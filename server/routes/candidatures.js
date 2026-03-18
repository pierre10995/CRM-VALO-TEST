import { Router } from "express";
import { pool } from "../db.js";
import { fmtCandidature } from "../formatters.js";
import { validate } from "../validators/validate.js";
import { candidatureCreateSchema, candidatureUpdateSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { missionId, candidateId } = req.query;
  let q = `SELECT cd.*, c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone, c.skills as candidate_skills,
           m.title as mission_title, m.company as mission_company
           FROM candidatures cd
           LEFT JOIN contacts c ON cd.candidate_id = c.id
           LEFT JOIN missions m ON cd.mission_id = m.id`;
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
  const { rows } = await pool.query(
    `UPDATE candidatures SET stage=$1, rating=$2, notes=$3, interview_date=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
    [d.stage, d.rating, d.notes, d.interviewDate, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Candidature non trouvée" });

  if (d.stage === "Placé") {
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
  await pool.query("DELETE FROM candidatures WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

export default router;
