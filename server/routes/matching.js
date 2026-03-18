import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { pool } from "../db.js";
import { config } from "../config.js";
import { asyncHandler, AppError } from "../helpers/errors.js";

const router = Router();

router.post("/mission/:id", asyncHandler(async (req, res) => {
  const missionId = req.params.id;

  if (!config.anthropic.apiKey) throw new AppError(400, "Clé API Anthropic manquante");

  const { rows: mRows } = await pool.query("SELECT * FROM missions WHERE id=$1", [missionId]);
  if (mRows.length === 0) throw new AppError(404, "Mission non trouvée");
  const mission = mRows[0];

  const { rows: candidates } = await pool.query("SELECT * FROM contacts WHERE status='Candidat'");
  if (candidates.length === 0) return res.json([]);

  const candidateList = candidates.map(c =>
    `ID:${c.id} | ${c.name} | Compétences: ${c.skills || "N/A"} | Ville: ${c.city || "N/A"} | Salaire souhaité: ${c.salary_expectation || "N/A"}$ | Disponibilité: ${c.availability || "N/A"} | Secteur: ${c.sector || "N/A"}`
  ).join("\n");

  const missionDesc = `Titre: ${mission.title} | Entreprise: ${mission.company} | Lieu: ${mission.location || "N/A"} | Contrat: ${mission.contract_type || "N/A"} | Salaire: ${mission.salary_min || 0}-${mission.salary_max || 0}$ | Description: ${mission.description || "N/A"} | Pré-requis: ${mission.requirements || "N/A"}`;

  const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: `Tu es un expert en recrutement. Analyse cette mission et classe les candidats par compatibilité.

MISSION:
${missionDesc}

CANDIDATS DISPONIBLES:
${candidateList}

Réponds UNIQUEMENT en JSON valide (pas de markdown) :
[{"id": <id du candidat>, "score": <0-100>, "reason": "<explication courte en 1 phrase>"}]

Retourne maximum 5 candidats, triés par score décroissant. Ne retourne que les candidats avec un score >= 30.` }]
  });

  let results;
  const text = message.content[0].text.trim();
  try { results = JSON.parse(text); }
  catch { const m = text.match(/\[[\s\S]*\]/); results = m ? JSON.parse(m[0]) : []; }

  const enriched = results.map(r => {
    const c = candidates.find(c => c.id === r.id);
    return { ...r, name: c?.name || "Inconnu", skills: c?.skills || "", city: c?.city || "" };
  });

  res.json(enriched);
}));

router.post("/candidate/:id", asyncHandler(async (req, res) => {
  const candidateId = req.params.id;

  if (!config.anthropic.apiKey) throw new AppError(400, "Clé API Anthropic manquante");

  const { rows: cRows } = await pool.query("SELECT * FROM contacts WHERE id=$1 AND status='Candidat'", [candidateId]);
  if (cRows.length === 0) throw new AppError(404, "Candidat non trouvé");
  const candidate = cRows[0];

  const { rows: openMissions } = await pool.query("SELECT * FROM missions WHERE status IN ('Ouverte', 'En cours')");
  if (openMissions.length === 0) return res.json([]);

  const candidateDesc = `Nom: ${candidate.name} | Compétences: ${candidate.skills || "N/A"} | Ville: ${candidate.city || "N/A"} | Salaire souhaité: ${candidate.salary_expectation || "N/A"}$ | Disponibilité: ${candidate.availability || "N/A"} | Secteur: ${candidate.sector || "N/A"}`;

  const missionList = openMissions.map(m =>
    `ID:${m.id} | ${m.title} chez ${m.company} | Lieu: ${m.location || "N/A"} | Contrat: ${m.contract_type || "N/A"} | Salaire: ${m.salary_min || 0}-${m.salary_max || 0}$ | Pré-requis: ${m.requirements || "N/A"}`
  ).join("\n");

  const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: `Tu es un expert en recrutement. Analyse ce candidat et classe les missions par compatibilité.

CANDIDAT:
${candidateDesc}

MISSIONS OUVERTES:
${missionList}

Réponds UNIQUEMENT en JSON valide (pas de markdown) :
[{"id": <id de la mission>, "score": <0-100>, "reason": "<explication courte en 1 phrase>"}]

Retourne maximum 5 missions, triées par score décroissant. Ne retourne que les missions avec un score >= 30.` }]
  });

  let results;
  const text = message.content[0].text.trim();
  try { results = JSON.parse(text); }
  catch { const m = text.match(/\[[\s\S]*\]/); results = m ? JSON.parse(m[0]) : []; }

  const enriched = results.map(r => {
    const m = openMissions.find(m => m.id === r.id);
    return { ...r, title: m?.title || "Inconnue", company: m?.company || "" };
  });

  res.json(enriched);
}));

export default router;
