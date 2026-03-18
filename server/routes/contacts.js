import { Router } from "express";
import { pool } from "../db.js";
import { fmtContact } from "../formatters.js";
import { validate } from "../validators/validate.js";
import { contactSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM contacts ORDER BY id ASC");
  res.json(rows.map(fmtContact));
}));

router.post("/", validate(contactSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `INSERT INTO contacts (name, company, email, phone, status, sector, revenue, notes, city, linkedin, skills, salary_expectation, availability, validation_status, target_position)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [d.name, d.company, d.email, d.phone, d.status, d.sector, d.revenue, d.notes, d.city, d.linkedin, d.skills, d.salaryExpectation, d.availability, d.validationStatus, d.targetPosition]
  );
  res.json(fmtContact(rows[0]));
}));

router.put("/:id", validate(contactSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `UPDATE contacts SET name=$1, company=$2, email=$3, phone=$4, status=$5, sector=$6, revenue=$7, notes=$8, city=$9, linkedin=$10, skills=$11, salary_expectation=$12, availability=$13, validation_status=$14, target_position=$15 WHERE id=$16 RETURNING *`,
    [d.name, d.company, d.email, d.phone, d.status, d.sector, d.revenue, d.notes, d.city, d.linkedin, d.skills, d.salaryExpectation, d.availability, d.validationStatus, d.targetPosition, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Contact non trouvé" });
  res.json(fmtContact(rows[0]));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM contacts WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

export default router;
