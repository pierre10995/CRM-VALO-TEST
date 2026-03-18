import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { pool } from "../db.js";
import { config } from "../config.js";
import { validate } from "../validators/validate.js";
import { validationStatusSchema, cvSummarySchema } from "../validators/schemas.js";
import { asyncHandler, AppError } from "../helpers/errors.js";
import { logger } from "../helpers/logger.js";

const router = Router();

// ─── Dashboard stats ─────────────────────────────────────────────────────────

router.get("/stats", asyncHandler(async (req, res) => {
  const contacts = await pool.query("SELECT status, COUNT(*) as count FROM contacts GROUP BY status");
  const missions = await pool.query("SELECT status, COUNT(*) as count FROM missions GROUP BY status");
  const revenue = await pool.query("SELECT COALESCE(SUM(revenue),0) as total FROM contacts WHERE status='Client'");
  const placements = await pool.query("SELECT COUNT(*) as count FROM candidatures WHERE stage='Placé'");
  const pending = await pool.query("SELECT COUNT(*) as count FROM activities WHERE completed=false");
  const commissions = await pool.query("SELECT COALESCE(SUM(m.commission),0) as total FROM candidatures cd JOIN missions m ON cd.mission_id=m.id WHERE cd.stage='Placé'");
  res.json({
    contacts: contacts.rows,
    missions: missions.rows,
    totalRevenue: Number(revenue.rows[0].total),
    totalPlacements: parseInt(placements.rows[0].count),
    pendingActivities: parseInt(pending.rows[0].count),
    totalCommissions: Number(commissions.rows[0].total),
  });
}));

// ─── Sectors ─────────────────────────────────────────────────────────────────

router.get("/sectors", asyncHandler(async (req, res) => {
  const defaults = ["Tech", "Finance", "Santé", "Retail", "Industrie", "Services", "Médias", "Éducation", "Autre"];
  const { rows } = await pool.query("SELECT DISTINCT sector FROM contacts WHERE sector IS NOT NULL AND sector != '' ORDER BY sector");
  const fromDb = rows.map(r => r.sector);
  const all = [...new Set([...defaults, ...fromDb])].sort((a, b) => a.localeCompare(b, "fr"));
  res.json(all);
}));

// ─── Work modes ──────────────────────────────────────────────────────────────

router.get("/work-modes", asyncHandler(async (req, res) => {
  const defaults = ["Hybride", "Sur site", "100% Remote"];
  const { rows } = await pool.query("SELECT DISTINCT work_mode FROM missions WHERE work_mode IS NOT NULL AND work_mode != '' ORDER BY work_mode");
  const fromDb = rows.map(r => r.work_mode);
  const all = [...new Set([...defaults, ...fromDb])].sort((a, b) => a.localeCompare(b, "fr"));
  res.json(all);
}));

// ─── Users ───────────────────────────────────────────────────────────────────

router.get("/users", asyncHandler(async (req, res) => {
  const { rows } = await pool.query("SELECT id, login, full_name FROM users ORDER BY id");
  res.json(rows.map(r => ({ id: r.id, login: r.login, fullName: r.full_name })));
}));

// ─── Validation statuses CRUD ────────────────────────────────────────────────

router.get("/validation-statuses", asyncHandler(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM validation_statuses ORDER BY sort_order ASC, id ASC");
  res.json(rows.map(r => ({ id: r.id, label: r.label, bg: r.bg_color, color: r.text_color, sortOrder: r.sort_order })));
}));

router.post("/validation-statuses", validate(validationStatusSchema), asyncHandler(async (req, res) => {
  const { label, bg, color } = req.body;
  const { rows: maxRows } = await pool.query("SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM validation_statuses");
  const { rows } = await pool.query(
    "INSERT INTO validation_statuses (label, bg_color, text_color, sort_order) VALUES ($1,$2,$3,$4) RETURNING *",
    [label, bg, color, maxRows[0].next]
  );
  const r = rows[0];
  res.json({ id: r.id, label: r.label, bg: r.bg_color, color: r.text_color, sortOrder: r.sort_order });
}));

router.put("/validation-statuses/:id", validate(validationStatusSchema), asyncHandler(async (req, res) => {
  const { label, bg, color } = req.body;
  const { rows } = await pool.query(
    "UPDATE validation_statuses SET label=$1, bg_color=$2, text_color=$3 WHERE id=$4 RETURNING *",
    [label, bg, color, req.params.id]
  );
  if (rows.length === 0) throw new AppError(404, "Statut non trouvé");
  const r = rows[0];
  res.json({ id: r.id, label: r.label, bg: r.bg_color, color: r.text_color, sortOrder: r.sort_order });
}));

router.delete("/validation-statuses/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM validation_statuses WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
}));

// ─── Auto-reminders ──────────────────────────────────────────────────────────

router.get("/auto-reminders", asyncHandler(async (req, res) => {
  const reminders = [];

  const { rows: staleProspects } = await pool.query(`
    SELECT c.id, c.name, c.company, c.created_at,
      (SELECT MAX(a.created_at) FROM activities a WHERE a.contact_id = c.id) as last_activity
    FROM contacts c WHERE c.status = 'Prospect'
  `);
  for (const p of staleProspects) {
    const lastDate = p.last_activity || p.created_at;
    const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 7) {
      reminders.push({ type: "prospect", contactId: p.id, name: p.company || p.name, days: daysSince, message: `Prospect "${p.company || p.name}" sans contact depuis ${daysSince} jours` });
    }
  }

  const { rows: activeCandidatures } = await pool.query(`
    SELECT cd.id, cd.candidate_id, cd.mission_id, cd.stage, cd.updated_at,
      c.name as candidate_name, m.title as mission_title,
      (SELECT MAX(a.created_at) FROM activities a WHERE a.contact_id = cd.candidate_id) as last_activity
    FROM candidatures cd
    JOIN contacts c ON cd.candidate_id = c.id
    JOIN missions m ON cd.mission_id = m.id
    WHERE cd.stage IN ('Soumis', 'Entretien', 'Finaliste')
  `);
  for (const cd of activeCandidatures) {
    const lastDate = cd.last_activity || cd.updated_at;
    const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 5) {
      reminders.push({ type: "candidature", contactId: cd.candidate_id, missionId: cd.mission_id, name: cd.candidate_name, missionTitle: cd.mission_title, stage: cd.stage, days: daysSince, message: `${cd.candidate_name} (${cd.stage} pour "${cd.mission_title}") sans suivi depuis ${daysSince} jours` });
    }
  }

  const { rows: emptyMissions } = await pool.query(`
    SELECT m.id, m.title, m.company, m.created_at,
      (SELECT COUNT(*) FROM candidatures cd WHERE cd.mission_id = m.id) as candidate_count
    FROM missions m WHERE m.status IN ('Ouverte', 'En cours')
  `);
  for (const m of emptyMissions) {
    if (parseInt(m.candidate_count) === 0) {
      const daysSince = Math.floor((Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= 10) {
        reminders.push({ type: "mission", missionId: m.id, name: m.title, company: m.company, days: daysSince, message: `Mission "${m.title}" (${m.company}) sans candidat depuis ${daysSince} jours` });
      }
    }
  }

  reminders.sort((a, b) => b.days - a.days);
  res.json(reminders);
}));

// ─── CV Summary (AI) ─────────────────────────────────────────────────────────

router.post("/cv-summary/generate", validate(cvSummarySchema), asyncHandler(async (req, res) => {
  const { candidateId } = req.body;

  if (!config.anthropic.apiKey) throw new AppError(400, "Clé API Anthropic manquante");

  const { rows: candidates } = await pool.query("SELECT * FROM contacts WHERE id=$1", [candidateId]);
  if (candidates.length === 0) throw new AppError(404, "Candidat non trouvé");
  const candidate = candidates[0];

  const { rows: cvFiles } = await pool.query(
    "SELECT * FROM files WHERE contact_id=$1 AND file_type='cv' ORDER BY created_at DESC LIMIT 1", [candidateId]
  );
  if (cvFiles.length === 0) throw new AppError(400, "Aucun CV uploadé pour ce candidat");

  let cvText = "";
  try {
    const buffer = Buffer.from(cvFiles[0].file_data, "base64");
    cvText = (await pdf(buffer)).text || "";
  } catch {
    throw new AppError(400, "Impossible de lire le fichier PDF");
  }

  if (!cvText.trim()) throw new AppError(400, "Le PDF ne contient pas de texte exploitable");

  const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: `Tu es un expert en recrutement. Analyse ce CV et produis un résumé structuré.

CONTENU DU CV:
${cvText}

Réponds UNIQUEMENT en JSON valide (pas de markdown) :
{
  "summary": "<résumé professionnel en 2-3 phrases>",
  "experience_years": <nombre estimé d'années d'expérience ou null>,
  "key_skills": ["<compétence 1>", "<compétence 2>", ...],
  "languages": ["<langue 1>", ...],
  "education": "<formation principale>",
  "current_role": "<poste actuel ou dernier poste>",
  "strengths": ["<point fort 1>", "<point fort 2>", ...],
  "salary_estimate": "<estimation salariale en $ CAD si possible, sinon null>"
}` }]
  });

  let result;
  const text = message.content[0].text.trim();
  try { result = JSON.parse(text); }
  catch { const m = text.match(/\{[\s\S]*\}/); result = m ? JSON.parse(m[0]) : null; }

  if (!result) throw new AppError(500, "Réponse IA invalide");

  if ((!candidate.skills || candidate.skills.trim() === "") && result.key_skills?.length > 0) {
    await pool.query("UPDATE contacts SET skills = $1 WHERE id = $2", [result.key_skills.join(", "), candidateId]);
  }

  res.json(result);
}));

export default router;
