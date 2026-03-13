import { Router } from "express";
import { pool } from "../db.js";
import { fmtContact } from "../formatters.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM contacts ORDER BY id ASC");
    res.json(rows.map(fmtContact));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { name, company, email, phone, status, sector, revenue, notes, city, linkedin, skills, salaryExpectation, availability, validationStatus, targetPosition } = req.body;
  if (!name) return res.status(400).json({ error: "Nom requis" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO contacts (name, company, email, phone, status, sector, revenue, notes, city, linkedin, skills, salary_expectation, availability, validation_status, target_position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [name, company || "", email || "", phone || "", status || "Candidat", sector || "Tech", Number(revenue) || 0, notes || "", city || "", linkedin || "", skills || "", Number(salaryExpectation) || 0, availability || "", validationStatus || "", targetPosition || ""]
    );
    res.json(fmtContact(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { name, company, email, phone, status, sector, revenue, notes, city, linkedin, skills, salaryExpectation, availability, validationStatus, targetPosition } = req.body;
  if (!name) return res.status(400).json({ error: "Nom requis" });
  try {
    const { rows } = await pool.query(
      `UPDATE contacts SET name=$1, company=$2, email=$3, phone=$4, status=$5, sector=$6, revenue=$7, notes=$8, city=$9, linkedin=$10, skills=$11, salary_expectation=$12, availability=$13, validation_status=$14, target_position=$15 WHERE id=$16 RETURNING *`,
      [name, company || "", email || "", phone || "", status || "Candidat", sector || "Tech", Number(revenue) || 0, notes || "", city || "", linkedin || "", skills || "", Number(salaryExpectation) || 0, availability || "", validationStatus || "", targetPosition || "", req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Contact non trouvé" });
    res.json(fmtContact(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try { await pool.query("DELETE FROM contacts WHERE id = $1", [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
