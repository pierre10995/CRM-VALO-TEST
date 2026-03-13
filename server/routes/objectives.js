import { Router } from "express";
import { pool } from "../db.js";
import { fmtObjective } from "../formatters.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, u.full_name as user_name FROM objectives o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.year DESC, o.month ASC NULLS FIRST, o.user_id
    `);
    res.json(rows.map(fmtObjective));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { userId, period, year, month, targetNewClients, targetCA, targetTotal, notes } = req.body;
  if (!userId || !period || !year) return res.status(400).json({ error: "Utilisateur, période et année requis" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO objectives (user_id, period, year, month, target_new_clients, target_ca, target_total, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (user_id, period, year, month) DO UPDATE SET target_new_clients=$5, target_ca=$6, target_total=$7, notes=$8
       RETURNING *`,
      [userId, period, year, month || null, targetNewClients || 0, Number(targetCA) || 0, Number(targetTotal) || 0, notes || ""]
    );
    res.json(fmtObjective(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  const { targetNewClients, targetCA, targetTotal, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE objectives SET target_new_clients=$1, target_ca=$2, target_total=$3, notes=$4 WHERE id=$5 RETURNING *`,
      [targetNewClients || 0, Number(targetCA) || 0, Number(targetTotal) || 0, notes || "", req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Objectif non trouvé" });
    res.json(fmtObjective(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try { await pool.query("DELETE FROM objectives WHERE id=$1", [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
