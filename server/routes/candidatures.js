import { Router } from "express";
import { pool } from "../db.js";
import { fmtCandidature } from "../formatters.js";
import { validate } from "../validators/validate.js";
import { candidatureCreateSchema, candidatureUpdateSchema } from "../validators/schemas.js";
import { asyncHandler, AppError } from "../helpers/errors.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { missionId, candidateId } = req.query;
  let q = `SELECT cd.*, c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone, c.skills as candidate_skills,
           m.title as mission_title, m.company as mission_company, m.assigned_to as mission_assigned_to,
           p.name as partner_name
           FROM candidatures cd
           LEFT JOIN contacts c ON cd.candidate_id = c.id
           LEFT JOIN missions m ON cd.mission_id = m.id
           LEFT JOIN partners p ON cd.partner_id = p.id`;
  const params = [];
  if (missionId) { q += " WHERE cd.mission_id = $1"; params.push(missionId); }
  else if (candidateId) { q += " WHERE cd.candidate_id = $1"; params.push(candidateId); }
  q += " ORDER BY cd.created_at DESC";
  const { rows } = await pool.query(q, params);
  res.json(rows.map(fmtCandidature));
}));

router.post("/", validate(candidatureCreateSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `INSERT INTO candidatures (candidate_id, mission_id, stage, rating, notes, interview_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [d.candidateId, d.missionId, d.stage, d.rating, d.notes, d.interviewDate]
  );
  res.json(fmtCandidature(rows[0]));
}));

router.put("/:id", validate(candidatureUpdateSchema), asyncHandler(async (req, res) => {
  const d = req.body;

  // Récupérer l'état avant mise à jour pour détecter les changements d'étape
  const { rows: before } = await pool.query("SELECT stage, partner_id FROM candidatures WHERE id = $1", [req.params.id]);

  // Mise à jour partielle : uniquement les colonnes fournies
  const sets = [];
  const params = [];
  const add = (col, val) => { params.push(val); sets.push(`${col}=$${params.length}`); };
  if (d.stage !== undefined) add("stage", d.stage);
  if (d.rating !== undefined) add("rating", d.rating);
  if (d.notes !== undefined) add("notes", d.notes);
  if (d.interviewDate !== undefined) add("interview_date", d.interviewDate);
  if (sets.length === 0) return res.status(400).json({ error: "Aucune modification fournie" });
  params.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE candidatures SET ${sets.join(", ")}, updated_at=NOW() WHERE id=$${params.length} RETURNING *`,
    params
  );
  if (rows.length === 0) return res.status(404).json({ error: "Candidature non trouvée" });
  const newStage = rows[0].stage;
  const newNotes = rows[0].notes;

  // Notifier le partenaire si l'étape a changé
  if (before.length > 0 && before[0].partner_id && newStage !== before[0].stage) {
    const cd = rows[0];
    const { rows: cRows } = await pool.query("SELECT name FROM contacts WHERE id = $1", [cd.candidate_id]);
    const candidateName = cRows[0]?.name || "Candidat";
    const stageMessages = {
      "Proposition partenaire": `Votre candidat "${candidateName}" a été accepté et passe en proposition.`,
      "Présélectionné": `Votre candidat "${candidateName}" a été présélectionné.`,
      "Soumis": `Votre candidat "${candidateName}" a été soumis au client.`,
      "Entretien": `Votre candidat "${candidateName}" est convoqué en entretien.`,
      "Finaliste": `Votre candidat "${candidateName}" est finaliste !`,
      "Placé": `Votre candidat "${candidateName}" a été placé avec succès !`,
      "Refusé": `Votre candidat "${candidateName}" n'a pas été retenu.${newNotes ? ` Motif : ${newNotes}` : ""}`,
      "Archivé": `La candidature de "${candidateName}" a été archivée.`,
    };
    const message = stageMessages[newStage] || `Le statut de "${candidateName}" est passé à "${newStage}".`;
    await pool.query(
      "INSERT INTO partner_notifications (partner_id, candidature_id, type, message) VALUES ($1, $2, $3, $4)",
      [before[0].partner_id, cd.id, "stage_change", message]
    );
  }

  if (newStage === "Placé") {
    const cd = rows[0];
    const { rows: mRows } = await pool.query("SELECT status, company FROM missions WHERE id = $1", [cd.mission_id]);
    if (mRows.length > 0 && mRows[0].status === "Gagné") {
      const { rows: existing } = await pool.query("SELECT 1 FROM placements WHERE candidature_id = $1", [cd.id]);
      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO placements (candidature_id, candidate_id, mission_id, company) VALUES ($1,$2,$3,$4)`,
          [cd.id, cd.candidate_id, cd.mission_id, mRows[0].company]
        );
      }
    }
  }

  res.json(fmtCandidature(rows[0]));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  // Protège l'historique de facturation (placements en cascade)
  const { rows: linked } = await pool.query("SELECT 1 FROM placements WHERE candidature_id = $1 LIMIT 1", [req.params.id]);
  if (linked.length > 0) throw new AppError(409, "Impossible de supprimer : un placement (suivi de facturation) est lié à cette candidature. Supprimez d'abord le placement.");
  const { rows: existing } = await pool.query(
    `SELECT c.name as candidate_name, m.title as mission_title
     FROM candidatures cd
     LEFT JOIN contacts c ON cd.candidate_id = c.id
     LEFT JOIN missions m ON cd.mission_id = m.id
     WHERE cd.id = $1`,
    [req.params.id]
  );
  await pool.query("DELETE FROM candidatures WHERE id = $1", [req.params.id]);
  const detail = existing[0] ? `${existing[0].candidate_name || "?"} — ${existing[0].mission_title || "?"}` : "";
  await pool.query(
    "INSERT INTO audit_log (user_name, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
    [req.user?.login || "Système", "Supprimer", "Candidature", parseInt(req.params.id), detail]
  );
  res.json({ ok: true });
}));

export default router;
