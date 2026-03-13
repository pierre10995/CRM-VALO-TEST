import { Router } from "express";
import { pool } from "../db.js";
import { fmtActivity } from "../formatters.js";

const router = Router();

router.get("/", async (req, res) => {
  const { contactId } = req.query;
  try {
    let q = `SELECT a.*, c.name as contact_name, u.full_name as user_name
             FROM activities a
             LEFT JOIN contacts c ON a.contact_id = c.id
             LEFT JOIN users u ON a.user_id = u.id`;
    const params = [];
    if (contactId) { q += " WHERE a.contact_id = $1"; params.push(contactId); }
    q += " ORDER BY a.created_at DESC LIMIT 100";
    const { rows } = await pool.query(q, params);
    res.json(rows.map(fmtActivity));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { contactId, missionId, userId, type, subject, description, dueDate } = req.body;
  if (!type || !subject) return res.status(400).json({ error: "Type et sujet requis" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO activities (contact_id, mission_id, user_id, type, subject, description, due_date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [contactId || null, missionId || null, userId || null, type, subject, description || "", dueDate || null]
    );
    res.json(fmtActivity(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { completed } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE activities SET completed=$1 WHERE id=$2 RETURNING *`,
      [completed, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Activité non trouvée" });
    res.json(fmtActivity(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try { await pool.query("DELETE FROM activities WHERE id = $1", [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
