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

// Check for duplicate contacts by email or phone
router.get("/check-duplicate", asyncHandler(async (req, res) => {
  const { email, phone, excludeId } = req.query;
  const conditions = [];
  const params = [];
  let idx = 1;
  if (email) { conditions.push(`LOWER(email) = LOWER($${idx++})`); params.push(email); }
  if (phone) { conditions.push(`phone = $${idx++}`); params.push(phone); }
  if (conditions.length === 0) return res.json({ duplicates: [] });
  let q = `SELECT id, name, email, phone FROM contacts WHERE (${conditions.join(" OR ")})`;
  if (excludeId) { q += ` AND id != $${idx++}`; params.push(excludeId); }
  const { rows } = await pool.query(q, params);
  res.json({ duplicates: rows.map(r => ({ id: r.id, name: r.name, email: r.email, phone: r.phone })) });
}));

router.post("/", validate(contactSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `INSERT INTO contacts (name, company, email, phone, status, sector, revenue, notes, city, linkedin, skills, salary_expectation, availability, validation_status, target_position, owner)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [d.name, d.company, d.email, d.phone, d.status, d.sector, d.revenue, d.notes, d.city, d.linkedin, d.skills, d.salaryExpectation, d.availability, d.validationStatus, d.targetPosition, d.owner]
  );
  await pool.query(
    "INSERT INTO audit_log (user_name, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
    [req.user?.login || "Système", "Créer", "Contact", rows[0].id, d.name]
  );
  res.json(fmtContact(rows[0]));
}));

router.put("/:id", validate(contactSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `UPDATE contacts SET name=$1, company=$2, email=$3, phone=$4, status=$5, sector=$6, revenue=$7, notes=$8, city=$9, linkedin=$10, skills=$11, salary_expectation=$12, availability=$13, validation_status=$14, target_position=$15, owner=$16 WHERE id=$17 RETURNING *`,
    [d.name, d.company, d.email, d.phone, d.status, d.sector, d.revenue, d.notes, d.city, d.linkedin, d.skills, d.salaryExpectation, d.availability, d.validationStatus, d.targetPosition, d.owner, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Contact non trouvé" });
  await pool.query(
    "INSERT INTO audit_log (user_name, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
    [req.user?.login || "Système", "Modifier", "Contact", parseInt(req.params.id), d.name]
  );
  res.json(fmtContact(rows[0]));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM contacts WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

export default router;
