import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { pool } from "../db.js";
import { fmtEvaluation } from "../formatters.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, c.name as candidate_name, m.title as mission_title, m.company as mission_company
       FROM evaluations e
       LEFT JOIN contacts c ON e.candidate_id = c.id
       LEFT JOIN missions m ON e.mission_id = m.id
       ORDER BY e.created_at DESC`
    );
    res.json(rows.map(fmtEvaluation));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/candidate/:candidateId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, c.name as candidate_name, m.title as mission_title, m.company as mission_company
       FROM evaluations e
       LEFT JOIN contacts c ON e.candidate_id = c.id
       LEFT JOIN missions m ON e.mission_id = m.id
       WHERE e.candidate_id = $1 ORDER BY e.created_at DESC`,
      [req.params.candidateId]
    );
    res.json(rows.map(fmtEvaluation));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM evaluations WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/generate", async (req, res) => {
  const { candidateId, missionId } = req.body;
  if (!candidateId || !missionId) return res.status(400).json({ error: "Candidat et mission requis" });

  try {
    const { rows: candidates } = await pool.query("SELECT * FROM contacts WHERE id=$1", [candidateId]);
    if (candidates.length === 0) return res.status(404).json({ error: "Candidat non trouvé" });
    const candidate = candidates[0];

    const { rows: missionRows } = await pool.query("SELECT * FROM missions WHERE id=$1", [missionId]);
    if (missionRows.length === 0) return res.status(404).json({ error: "Mission non trouvée" });
    const mission = missionRows[0];

    const { rows: cvFiles } = await pool.query(
      "SELECT * FROM files WHERE contact_id=$1 AND file_type='cv' ORDER BY created_at DESC LIMIT 1", [candidateId]
    );

    let cvText = "";
    if (cvFiles.length > 0) {
      try {
        const buffer = Buffer.from(cvFiles[0].file_data, "base64");
        const pdfData = await pdf(buffer);
        cvText = pdfData.text || "";
      } catch (pdfErr) {
        console.error("PDF parse error:", pdfErr.message);
        cvText = "(Impossible d'extraire le texte du CV PDF)";
      }
    }

    const { rows: missionFiles } = await pool.query(
      "SELECT * FROM files WHERE mission_id=$1 AND file_type='offre' ORDER BY created_at DESC LIMIT 1", [missionId]
    );

    let missionPdfText = "";
    if (missionFiles.length > 0) {
      try {
        const buffer = Buffer.from(missionFiles[0].file_data, "base64");
        const pdfData = await pdf(buffer);
        missionPdfText = pdfData.text || "";
      } catch (pdfErr) {
        console.error("Mission PDF parse error:", pdfErr.message);
        missionPdfText = "(Impossible d'extraire le texte du PDF de l'offre)";
      }
    }

    const candidateProfile = `
Nom: ${candidate.name}
Email: ${candidate.email || "N/A"}
Téléphone: ${candidate.phone || "N/A"}
Ville: ${candidate.city || "N/A"}
Compétences: ${candidate.skills || "N/A"}
Salaire souhaité: ${candidate.salary_expectation || "N/A"} $ CAD
Disponibilité: ${candidate.availability || "N/A"}
Secteur: ${candidate.sector || "N/A"}
Notes: ${candidate.notes || "N/A"}

--- CONTENU DU CV ---
${cvText || "(Aucun CV téléchargé)"}
`.trim();

    const missionProfile = `
Titre du poste: ${mission.title}
Entreprise: ${mission.company}
Lieu: ${mission.location || "N/A"}
Type de contrat: ${mission.contract_type || "N/A"}
Salaire: ${mission.salary_min || 0} - ${mission.salary_max || 0} $ CAD
Description: ${mission.description || "N/A"}
Pré-requis: ${mission.requirements || "N/A"}
Priorité: ${mission.priority || "N/A"}
${missionPdfText ? `\n--- DOCUMENT DE L'OFFRE ---\n${missionPdfText}` : ""}
`.trim();

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({
        error: "Clé API Anthropic manquante. Ajoutez ANTHROPIC_API_KEY dans les variables d'environnement Railway."
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `Tu es un expert en recrutement. Évalue la compatibilité entre ce candidat et ce poste.

PROFIL CANDIDAT:
${candidateProfile}

POSTE OUVERT:
${missionProfile}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte (pas de markdown, pas de texte avant/après) :
{
  "score": <nombre entier de 0 à 100>,
  "summary": "<résumé en 2 phrases>",
  "positives": ["<point positif 1>", "<point positif 2>", ...],
  "negatives": ["<point négatif 1>", "<point négatif 2>", ...],
  "clarifications": ["<point à éclaircir 1>", "<point à éclaircir 2>", ...]
}`
      }]
    });

    const responseText = message.content[0].text.trim();
    let evaluation;
    try {
      evaluation = JSON.parse(responseText);
    } catch (parseErr) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) evaluation = JSON.parse(jsonMatch[0]);
      else return res.status(500).json({ error: "Réponse IA invalide" });
    }

    const positivesStr = JSON.stringify(evaluation.positives || []);
    const negativesStr = JSON.stringify(evaluation.negatives || []);
    const clarificationsStr = JSON.stringify(evaluation.clarifications || []);

    const { rows } = await pool.query(
      `INSERT INTO evaluations (candidate_id, mission_id, score, positives, negatives, clarifications, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (candidate_id, mission_id) DO UPDATE SET
         score=$3, positives=$4, negatives=$5, clarifications=$6, summary=$7, created_at=NOW()
       RETURNING *`,
      [candidateId, missionId, evaluation.score || 0, positivesStr, negativesStr, clarificationsStr, evaluation.summary || ""]
    );

    res.json(fmtEvaluation(rows[0]));
  } catch (err) {
    console.error("Evaluation error:", err);
    res.status(500).json({ error: err.message || "Erreur lors de l'évaluation" });
  }
});

export default router;
