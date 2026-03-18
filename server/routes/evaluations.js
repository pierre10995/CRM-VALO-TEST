import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { pool } from "../db.js";
import { config } from "../config.js";
import { fmtEvaluation } from "../formatters.js";
import { validate } from "../validators/validate.js";
import { evaluationGenerateSchema } from "../validators/schemas.js";
import { asyncHandler, AppError } from "../helpers/errors.js";
import { logger } from "../helpers/logger.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT e.*, c.name as candidate_name, m.title as mission_title, m.company as mission_company
     FROM evaluations e
     LEFT JOIN contacts c ON e.candidate_id = c.id
     LEFT JOIN missions m ON e.mission_id = m.id
     ORDER BY e.created_at DESC`
  );
  res.json(rows.map(fmtEvaluation));
}));

router.get("/candidate/:candidateId", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT e.*, c.name as candidate_name, m.title as mission_title, m.company as mission_company
     FROM evaluations e
     LEFT JOIN contacts c ON e.candidate_id = c.id
     LEFT JOIN missions m ON e.mission_id = m.id
     WHERE e.candidate_id = $1 ORDER BY e.created_at DESC`,
    [req.params.candidateId]
  );
  res.json(rows.map(fmtEvaluation));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM evaluations WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
}));

router.post("/generate", validate(evaluationGenerateSchema), asyncHandler(async (req, res) => {
  const { candidateId, missionId } = req.body;

  if (!config.anthropic.apiKey) {
    throw new AppError(400, "Clé API Anthropic manquante. Ajoutez ANTHROPIC_API_KEY dans les variables d'environnement.");
  }

  const { rows: candidates } = await pool.query("SELECT * FROM contacts WHERE id=$1", [candidateId]);
  if (candidates.length === 0) throw new AppError(404, "Candidat non trouvé");
  const candidate = candidates[0];

  const { rows: missionRows } = await pool.query("SELECT * FROM missions WHERE id=$1", [missionId]);
  if (missionRows.length === 0) throw new AppError(404, "Mission non trouvée");
  const mission = missionRows[0];

  const { rows: cvFiles } = await pool.query(
    "SELECT * FROM files WHERE contact_id=$1 AND file_type='cv' ORDER BY created_at DESC LIMIT 1", [candidateId]
  );

  let cvText = "";
  if (cvFiles.length > 0) {
    try {
      const buffer = Buffer.from(cvFiles[0].file_data, "base64");
      cvText = (await pdf(buffer)).text || "";
    } catch (pdfErr) {
      logger.warn("Échec parsing CV PDF", { candidateId, error: pdfErr.message });
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
      missionPdfText = (await pdf(buffer)).text || "";
    } catch (pdfErr) {
      logger.warn("Échec parsing offre PDF", { missionId, error: pdfErr.message });
    }
  }

  const candidateProfile = `
Nom: ${candidate.name}
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
${missionPdfText ? `\n--- DOCUMENT DE L'OFFRE ---\n${missionPdfText}` : ""}
`.trim();

  const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

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
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) evaluation = JSON.parse(jsonMatch[0]);
    else throw new AppError(500, "Réponse IA invalide");
  }

  const { rows } = await pool.query(
    `INSERT INTO evaluations (candidate_id, mission_id, score, positives, negatives, clarifications, summary)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (candidate_id, mission_id) DO UPDATE SET
       score=$3, positives=$4, negatives=$5, clarifications=$6, summary=$7, created_at=NOW()
     RETURNING *`,
    [candidateId, missionId, evaluation.score || 0,
     JSON.stringify(evaluation.positives || []),
     JSON.stringify(evaluation.negatives || []),
     JSON.stringify(evaluation.clarifications || []),
     evaluation.summary || ""]
  );

  res.json(fmtEvaluation(rows[0]));
}));

export default router;
