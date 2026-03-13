import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM fiscal_years ORDER BY start_date ASC");
    res.json(rows.map(r => ({ id: r.id, label: r.label, startDate: r.start_date, endDate: r.end_date, target: Number(r.target) })));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { label, startDate, endDate, target } = req.body;
  if (!label || !startDate || !endDate) return res.status(400).json({ error: "Champs requis" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO fiscal_years (label, start_date, end_date, target) VALUES ($1,$2,$3,$4) RETURNING *",
      [label, startDate, endDate, Number(target) || 0]
    );
    const r = rows[0];
    res.json({ id: r.id, label: r.label, startDate: r.start_date, endDate: r.end_date, target: Number(r.target) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  const { label, startDate, endDate, target } = req.body;
  if (!label || !startDate || !endDate) return res.status(400).json({ error: "Champs requis" });
  try {
    const { rows } = await pool.query(
      "UPDATE fiscal_years SET label=$1, start_date=$2, end_date=$3, target=$4 WHERE id=$5 RETURNING *",
      [label, startDate, endDate, Number(target) || 0, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Année non trouvée" });
    const r = rows[0];
    res.json({ id: r.id, label: r.label, startDate: r.start_date, endDate: r.end_date, target: Number(r.target) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try { await pool.query("DELETE FROM fiscal_years WHERE id=$1", [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
