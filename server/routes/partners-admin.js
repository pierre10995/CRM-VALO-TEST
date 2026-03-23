import { Router } from "express";
import { pool } from "../db.js";
import { supabaseAdmin } from "../supabase.js";
import { fmtPartner } from "../formatters.js";
import { validate } from "../validators/validate.js";
import { partnerCreateSchema, partnerUpdateSchema, partnerMissionSchema } from "../validators/schemas.js";
import { asyncHandler, AppError } from "../helpers/errors.js";
import { logger } from "../helpers/logger.js";
import { adminOnly } from "../middleware.js";

const router = Router();

// ─── CRUD Partners ──────────────────────────────────────────────────────────

router.get("/", adminOnly, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.*, (SELECT COUNT(*) FROM partner_missions pm WHERE pm.partner_id = p.id) as mission_count
    FROM partners p ORDER BY p.created_at DESC
  `);
  res.json(rows.map(fmtPartner));
}));

router.post("/", adminOnly, validate(partnerCreateSchema), asyncHandler(async (req, res) => {
  const { name, email, password, company, phone } = req.body;

  const { rows: existing } = await pool.query("SELECT 1 FROM partners WHERE LOWER(email) = LOWER($1)", [email]);
  if (existing.length > 0) throw new AppError(409, "Un partenaire avec cet email existe déjà");

  // Créer l'utilisateur dans Supabase Auth
  let authUser;
  try {
    const { data, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: "partner", company },
    });

    if (authErr) {
      if (authErr.message?.includes("already been registered")) {
        throw new AppError(409, "Un partenaire avec cet email existe déjà");
      }
      throw new AppError(400, authErr.message || "Erreur lors de la création du compte Supabase");
    }

    if (!data?.user?.id) {
      throw new AppError(500, "Supabase n'a pas retourné d'utilisateur");
    }

    authUser = data;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error("Erreur Supabase Auth createUser", { message: err.message });
    throw new AppError(500, "Erreur de connexion à Supabase Auth");
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO partners (name, email, company, phone, auth_id) VALUES ($1, $2, $3, $4, $5)
       RETURNING *, 0 as mission_count`,
      [name, email, company, phone, authUser.user.id]
    );
    res.status(201).json(fmtPartner(rows[0]));
  } catch (err) {
    // Rollback : supprimer l'utilisateur Supabase si l'insert local échoue
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    logger.error("Erreur INSERT partners", { message: err.message });
    throw new AppError(500, "Erreur lors de l'enregistrement en base de données");
  }
}));

router.put("/:id", adminOnly, validate(partnerUpdateSchema), asyncHandler(async (req, res) => {
  const { name, email, company, phone, password } = req.body;

  // Si le mot de passe est fourni, le mettre à jour dans Supabase Auth
  if (password) {
    const { rows: partnerRows } = await pool.query("SELECT auth_id FROM partners WHERE id = $1", [req.params.id]);
    if (partnerRows.length > 0 && partnerRows[0].auth_id) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(partnerRows[0].auth_id, { password });
      if (error) throw new AppError(500, "Erreur lors de la mise à jour du mot de passe");
    }
  }

  const { rows } = await pool.query(
    `UPDATE partners SET name=$1, email=$2, company=$3, phone=$4 WHERE id=$5
     RETURNING *, (SELECT COUNT(*) FROM partner_missions pm WHERE pm.partner_id = partners.id) as mission_count`,
    [name, email, company, phone, req.params.id]
  );
  if (rows.length === 0) throw new AppError(404, "Partenaire non trouvé");
  res.json(fmtPartner(rows[0]));
}));

router.delete("/:id", adminOnly, asyncHandler(async (req, res) => {
  // Supprimer aussi dans Supabase Auth
  const { rows } = await pool.query("SELECT auth_id FROM partners WHERE id = $1", [req.params.id]);
  if (rows.length > 0 && rows[0].auth_id) {
    await supabaseAdmin.auth.admin.deleteUser(rows[0].auth_id);
  }
  await pool.query("DELETE FROM partners WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

// ─── Partner submissions (notifications) ────────────────────────────────────

router.get("/submissions", adminOnly, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT cd.id, cd.candidate_id, cd.mission_id, cd.stage, cd.notes, cd.created_at,
           c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
           c.skills as candidate_skills, c.city as candidate_city,
           m.title as mission_title, m.company as mission_company,
           p.id as partner_id, p.name as partner_name, p.company as partner_company,
           (SELECT f.id FROM files f WHERE f.contact_id = cd.candidate_id AND f.file_type = 'cv' ORDER BY f.created_at DESC LIMIT 1) as cv_file_id,
           (SELECT ROUND(AVG(sr.rating)::numeric, 1) FROM submission_reviews sr WHERE sr.candidature_id = cd.id) as avg_rating,
           (SELECT COUNT(*) FROM submission_reviews sr WHERE sr.candidature_id = cd.id) as review_count
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
    avgRating: r.avg_rating ? Number(r.avg_rating) : null,
    reviewCount: parseInt(r.review_count) || 0,
  })));
}));

// ─── Submission reviews (rating + comment) ──────────────────────────────────

router.get("/submissions/:candidatureId/reviews", adminOnly, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT sr.*, u.full_name as user_name
    FROM submission_reviews sr
    LEFT JOIN users u ON sr.user_id = u.id
    WHERE sr.candidature_id = $1
    ORDER BY sr.created_at DESC
  `, [req.params.candidatureId]);
  res.json(rows.map(r => ({
    id: r.id, candidatureId: r.candidature_id, userId: r.user_id,
    rating: r.rating, comment: r.comment || "", userName: r.user_name || "",
    createdAt: r.created_at, updatedAt: r.updated_at,
  })));
}));

router.post("/submissions/:candidatureId/reviews", adminOnly, asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new AppError(400, "Note de 1 à 5 requise");

  const userId = req.user.id;
  const { rows } = await pool.query(`
    INSERT INTO submission_reviews (candidature_id, user_id, rating, comment)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (candidature_id, user_id)
    DO UPDATE SET rating = $3, comment = $4, updated_at = NOW()
    RETURNING *
  `, [req.params.candidatureId, userId, rating, comment || ""]);

  res.status(201).json(rows[0]);
}));

// ─── Mission affiliations ───────────────────────────────────────────────────

router.get("/:id/missions", adminOnly, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT m.id, m.title, m.company, m.status, pm.created_at as affiliated_at
    FROM partner_missions pm
    JOIN missions m ON pm.mission_id = m.id
    WHERE pm.partner_id = $1
    ORDER BY pm.created_at DESC
  `, [req.params.id]);
  res.json(rows);
}));

router.post("/:id/missions", adminOnly, validate(partnerMissionSchema), asyncHandler(async (req, res) => {
  const { missionId } = req.body;
  await pool.query(
    "INSERT INTO partner_missions (partner_id, mission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [req.params.id, missionId]
  );
  res.status(201).json({ ok: true });
}));

router.delete("/:id/missions/:missionId", adminOnly, asyncHandler(async (req, res) => {
  await pool.query(
    "DELETE FROM partner_missions WHERE partner_id = $1 AND mission_id = $2",
    [req.params.id, req.params.missionId]
  );
  res.json({ ok: true });
}));

export default router;
