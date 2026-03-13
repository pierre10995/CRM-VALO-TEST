import { Router } from "express";
import { pool } from "../db.js";
import { fmtPlacement } from "../formatters.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.name as candidate_name, m.title as mission_title, m.company as mission_company
      FROM placements p
      LEFT JOIN contacts c ON p.candidate_id = c.id
      LEFT JOIN missions m ON p.mission_id = m.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows.map(fmtPlacement));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { candidatureId, candidateId, missionId, company, startDate, probationDate, startInvoiceSent, startInvoiceName, startInvoicePaid, probationInvoiceSent, probationInvoiceName, probationInvoicePaid, probationValidated, notes } = req.body;
  if (!candidateId || !missionId) return res.status(400).json({ error: "Candidat et mission requis" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO placements (candidature_id, candidate_id, mission_id, company, start_date, probation_date, start_invoice_sent, start_invoice_name, start_invoice_paid, probation_invoice_sent, probation_invoice_name, probation_invoice_paid, probation_validated, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [candidatureId || null, candidateId, missionId, company || "", startDate || null, probationDate || null, startInvoiceSent || false, startInvoiceName || "", startInvoicePaid || false, probationInvoiceSent || false, probationInvoiceName || "", probationInvoicePaid || false, probationValidated || false, notes || ""]
    );
    res.json(fmtPlacement(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { startDate, probationDate, startInvoiceSent, startInvoiceName, startInvoicePaid, probationInvoiceSent, probationInvoiceName, probationInvoicePaid, probationValidated, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE placements SET start_date=$1, probation_date=$2, start_invoice_sent=$3, start_invoice_name=$4, start_invoice_paid=$5, probation_invoice_sent=$6, probation_invoice_name=$7, probation_invoice_paid=$8, probation_validated=$9, notes=$10 WHERE id=$11 RETURNING *`,
      [startDate || null, probationDate || null, startInvoiceSent || false, startInvoiceName || "", startInvoicePaid || false, probationInvoiceSent || false, probationInvoiceName || "", probationInvoicePaid || false, probationValidated || false, notes || "", req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Placement non trouvé" });
    res.json(fmtPlacement(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try { await pool.query("DELETE FROM placements WHERE id=$1", [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
