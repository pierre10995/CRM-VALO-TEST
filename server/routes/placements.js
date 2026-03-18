import { Router } from "express";
import { pool } from "../db.js";
import { fmtPlacement } from "../formatters.js";
import { validate } from "../validators/validate.js";
import { placementCreateSchema, placementUpdateSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.*, c.name as candidate_name, m.title as mission_title, m.company as mission_company
    FROM placements p
    LEFT JOIN contacts c ON p.candidate_id = c.id
    LEFT JOIN missions m ON p.mission_id = m.id
    ORDER BY p.created_at DESC
  `);
  res.json(rows.map(fmtPlacement));
}));

router.post("/", validate(placementCreateSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `INSERT INTO placements (candidature_id, candidate_id, mission_id, company, start_date, probation_date, start_invoice_sent, start_invoice_name, start_invoice_paid, probation_invoice_sent, probation_invoice_name, probation_invoice_paid, probation_validated, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [d.candidatureId, d.candidateId, d.missionId, d.company, d.startDate, d.probationDate, d.startInvoiceSent, d.startInvoiceName, d.startInvoicePaid, d.probationInvoiceSent, d.probationInvoiceName, d.probationInvoicePaid, d.probationValidated, d.notes]
  );
  res.json(fmtPlacement(rows[0]));
}));

router.put("/:id", validate(placementUpdateSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `UPDATE placements SET start_date=$1, probation_date=$2, start_invoice_sent=$3, start_invoice_name=$4, start_invoice_paid=$5, probation_invoice_sent=$6, probation_invoice_name=$7, probation_invoice_paid=$8, probation_validated=$9, notes=$10 WHERE id=$11 RETURNING *`,
    [d.startDate, d.probationDate, d.startInvoiceSent, d.startInvoiceName, d.startInvoicePaid, d.probationInvoiceSent, d.probationInvoiceName, d.probationInvoicePaid, d.probationValidated, d.notes, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Placement non trouvé" });
  res.json(fmtPlacement(rows[0]));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM placements WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
}));

export default router;
