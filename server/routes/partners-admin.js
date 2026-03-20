import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { fmtPartner } from "../formatters.js";
import { validate } from "../validators/validate.js";
import { partnerCreateSchema, partnerUpdateSchema, partnerMissionSchema } from "../validators/schemas.js";
import { asyncHandler, AppError } from "../helpers/errors.js";

const router = Router();

// ─── CRUD Partners ──────────────────────────────────────────────────────────

router.get("/", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.*, (SELECT COUNT(*) FROM partner_missions pm WHERE pm.partner_id = p.id) as mission_count
    FROM partners p ORDER BY p.created_at DESC
  `);
  res.json(rows.map(fmtPartner));
}));

router.post("/", validate(partnerCreateSchema), asyncHandler(async (req, res) => {
  const { name, email, password, company, phone } = req.body;

  const { rows: existing } = await pool.query("SELECT 1 FROM partners WHERE LOWER(email) = LOWER($1)", [email]);
  if (existing.length > 0) throw new AppError(409, "Un partenaire avec cet email existe déjà");

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO partners (name, email, password, company, phone) VALUES ($1, $2, $3, $4, $5)
     RETURNING *, 0 as mission_count`,
    [name, email, hash, company, phone]
  );
  res.status(201).json(fmtPartner(rows[0]));
}));

router.put("/:id", validate(partnerUpdateSchema), asyncHandler(async (req, res) => {
  const { name, email, company, phone, password } = req.body;

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query("UPDATE partners SET password = $1 WHERE id = $2", [hash, req.params.id]);
  }

  const { rows } = await pool.query(
    `UPDATE partners SET name=$1, email=$2, company=$3, phone=$4 WHERE id=$5
     RETURNING *, (SELECT COUNT(*) FROM partner_missions pm WHERE pm.partner_id = partners.id) as mission_count`,
    [name, email, company, phone, req.params.id]
  );
  if (rows.length === 0) throw new AppError(404, "Partenaire non trouvé");
  res.json(fmtPartner(rows[0]));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM partners WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

// ─── Mission affiliations ───────────────────────────────────────────────────

router.get("/:id/missions", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT m.id, m.title, m.company, m.status, pm.created_at as affiliated_at
    FROM partner_missions pm
    JOIN missions m ON pm.mission_id = m.id
    WHERE pm.partner_id = $1
    ORDER BY pm.created_at DESC
  `, [req.params.id]);
  res.json(rows);
}));

router.post("/:id/missions", validate(partnerMissionSchema), asyncHandler(async (req, res) => {
  const { missionId } = req.body;
  await pool.query(
    "INSERT INTO partner_missions (partner_id, mission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [req.params.id, missionId]
  );
  res.status(201).json({ ok: true });
}));

router.delete("/:id/missions/:missionId", asyncHandler(async (req, res) => {
  await pool.query(
    "DELETE FROM partner_missions WHERE partner_id = $1 AND mission_id = $2",
    [req.params.id, req.params.missionId]
  );
  res.json({ ok: true });
}));

export default router;
