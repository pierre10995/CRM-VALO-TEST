import { Router } from "express";
import { pool } from "../db.js";
import { fmtActivity } from "../formatters.js";
import { validate } from "../validators/validate.js";
import { activityCreateSchema, activityUpdateSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { contactId } = req.query;
  let q = `SELECT a.*, c.name as contact_name, u.full_name as user_name
           FROM activities a
           LEFT JOIN contacts c ON a.contact_id = c.id
           LEFT JOIN users u ON a.user_id = u.id`;
  const params = [];
  if (contactId) { q += " WHERE a.contact_id = $1"; params.push(contactId); }
  q += " ORDER BY a.created_at DESC LIMIT 100";
  const { rows } = await pool.query(q, params);
  res.json(rows.map(fmtActivity));
}));

router.post("/", validate(activityCreateSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `INSERT INTO activities (contact_id, mission_id, user_id, type, subject, description, due_date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [d.contactId, d.missionId, d.userId, d.type, d.subject, d.description, d.dueDate]
  );
  res.json(fmtActivity(rows[0]));
}));

router.put("/:id", validate(activityUpdateSchema), asyncHandler(async (req, res) => {
  const { rows: cur } = await pool.query("SELECT * FROM activities WHERE id = $1", [req.params.id]);
  if (cur.length === 0) return res.status(404).json({ error: "Activité non trouvée" });
  const a = cur[0];
  const d = req.body;
  const pick = (val, fallback) => (val !== undefined ? val : fallback);
  const { rows } = await pool.query(
    `UPDATE activities SET contact_id=$1, mission_id=$2, type=$3, subject=$4, description=$5, due_date=$6, completed=$7 WHERE id=$8 RETURNING *`,
    [
      pick(d.contactId, a.contact_id),
      pick(d.missionId, a.mission_id),
      pick(d.type, a.type),
      pick(d.subject, a.subject),
      pick(d.description, a.description),
      pick(d.dueDate, a.due_date),
      pick(d.completed, a.completed),
      req.params.id,
    ]
  );
  res.json(fmtActivity(rows[0]));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const { rows: existing } = await pool.query("SELECT subject FROM activities WHERE id = $1", [req.params.id]);
  await pool.query("DELETE FROM activities WHERE id = $1", [req.params.id]);
  await pool.query(
    "INSERT INTO audit_log (user_name, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
    [req.user?.login || "Système", "Supprimer", "Activité", parseInt(req.params.id), existing[0]?.subject || ""]
  );
  res.json({ ok: true });
}));

export default router;
