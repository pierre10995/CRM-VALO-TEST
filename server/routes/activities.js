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
  const { rows } = await pool.query(
    `UPDATE activities SET completed=$1 WHERE id=$2 RETURNING *`,
    [req.body.completed, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Activité non trouvée" });
  res.json(fmtActivity(rows[0]));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM activities WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

export default router;
