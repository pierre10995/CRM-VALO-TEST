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

// ─── Partner submissions (notifications) ────────────────────────────────────

router.get("/submissions", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT cd.id, cd.candidate_id, cd.mission_id, cd.stage, cd.notes, cd.created_at,
           c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
           c.skills as candidate_skills, c.city as candidate_city,
           m.title as mission_title, m.company as mission_company,
           p.id as partner_id, p.name as partner_name, p.company as partner_company,
           (SELECT f.id FROM files f WHERE f.contact_id = cd.candidate_id AND f.file_type = 'cv' ORDER BY f.created_at DESC LIMIT 1) as cv_file_id
    FROM candidatures cd
    INNER JOIN partners p ON cd.partner_id = p.id
    LEFT JOIN contacts c ON cd.candidate_id = c.id
    LEFT JOIN missions m ON cd.mission_id = m.id
    ORDER BY cd.created_at DESC
    LIMIT 100
  `);
  res.json(rows.map(r => ({
    id: r.id, candidateId: r.candidate_id, missionId: r.mission_id,
    stage: r.stage, notes: r.notes || "", createdAt: r.created_at,
    candidateName: r.candidate_name || "", candidateEmail: r.candidate_email || "",
    candidatePhone: r.candidate_phone || "", candidateSkills: r.candidate_skills || "",
    candidateCity: r.candidate_city || "",
    missionTitle: r.mission_title || "", missionCompany: r.mission_company || "",
    partnerId: r.partner_id, partnerName: r.partner_name || "", partnerCompany: r.partner_company || "",
    cvFileId: r.cv_file_id || null,
  })));
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
