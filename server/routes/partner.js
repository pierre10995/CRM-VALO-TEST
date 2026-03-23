import { Router } from "express";
import { Resend } from "resend";
import { pool } from "../db.js";
import { config } from "../config.js";
import { partnerAuthMiddleware, uploadLimiter, emailCheckLimiter } from "../middleware.js";
import { validate } from "../validators/validate.js";
import { partnerSubmitSchema } from "../validators/schemas.js";
import { asyncHandler, AppError } from "../helpers/errors.js";
import { sanitizeFileName } from "../helpers/sanitize.js";
import { fmtMission } from "../formatters.js";
import { logger } from "../helpers/logger.js";

const router = Router();
const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;

// All routes require partner auth
router.use(partnerAuthMiddleware);

// ─── List affiliated missions ───────────────────────────────────────────────

router.get("/missions", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT m.*, c.name as client_name, u.full_name as assigned_name,
           fy.label as fiscal_year_label,
           (SELECT COUNT(*) FROM candidatures cd WHERE cd.mission_id = m.id) as candidature_count
    FROM missions m
    INNER JOIN partner_missions pm ON pm.mission_id = m.id AND pm.partner_id = $1
    LEFT JOIN contacts c ON m.client_contact_id = c.id
    LEFT JOIN users u ON m.assigned_to = u.id
    LEFT JOIN fiscal_years fy ON m.fiscal_year_id = fy.id
    ORDER BY m.created_at DESC
  `, [req.partner.id]);
  res.json(rows.map(fmtMission));
}));

// ─── Get single mission detail (if affiliated) ─────────────────────────────

router.get("/missions/:id", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT m.*, c.name as client_name, u.full_name as assigned_name,
           fy.label as fiscal_year_label,
           (SELECT COUNT(*) FROM candidatures cd WHERE cd.mission_id = m.id) as candidature_count
    FROM missions m
    INNER JOIN partner_missions pm ON pm.mission_id = m.id AND pm.partner_id = $1
    LEFT JOIN contacts c ON m.client_contact_id = c.id
    LEFT JOIN users u ON m.assigned_to = u.id
    LEFT JOIN fiscal_years fy ON m.fiscal_year_id = fy.id
    WHERE m.id = $2
  `, [req.partner.id, req.params.id]);

  if (rows.length === 0) throw new AppError(404, "Mission non trouvée ou non affiliée");
  res.json(fmtMission(rows[0]));
}));

// ─── List files attached to an affiliated mission ───────────────────────────

router.get("/missions/:id/files", asyncHandler(async (req, res) => {
  // Verify affiliation
  const { rows: affil } = await pool.query(
    "SELECT 1 FROM partner_missions WHERE partner_id = $1 AND mission_id = $2",
    [req.partner.id, req.params.id]
  );
  if (affil.length === 0) throw new AppError(404, "Mission non trouvée ou non affiliée");

  const { rows } = await pool.query(
    "SELECT id, mission_id, file_type, file_name, mime_type, created_at FROM files WHERE mission_id = $1 ORDER BY created_at DESC",
    [req.params.id]
  );
  res.json(rows);
}));

// ─── Download a file from an affiliated mission ─────────────────────────────

router.get("/files/:id", asyncHandler(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM files WHERE id = $1", [req.params.id]);
  if (rows.length === 0) throw new AppError(404, "Fichier non trouvé");

  const file = rows[0];

  // Verify partner is affiliated to the mission this file belongs to
  if (!file.mission_id) throw new AppError(403, "Accès non autorisé");
  const { rows: affil } = await pool.query(
    "SELECT 1 FROM partner_missions WHERE partner_id = $1 AND mission_id = $2",
    [req.partner.id, file.mission_id]
  );
  if (affil.length === 0) throw new AppError(403, "Accès non autorisé");

  const buffer = Buffer.from(file.file_data, "base64");
  res.setHeader("Content-Type", file.mime_type);
  res.setHeader("Content-Disposition", `inline; filename="${file.file_name}"`);
  res.send(buffer);
}));

// ─── List candidatures submitted by this partner ────────────────────────────

router.get("/candidatures", asyncHandler(async (req, res) => {
  const { missionId } = req.query;
  let q = `
    SELECT cd.*, c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
           m.title as mission_title, m.company as mission_company
    FROM candidatures cd
    LEFT JOIN contacts c ON cd.candidate_id = c.id
    LEFT JOIN missions m ON cd.mission_id = m.id
    WHERE cd.partner_id = $1
  `;
  const params = [req.partner.id];
  if (missionId) {
    q += " AND cd.mission_id = $2";
    params.push(missionId);
  }
  q += " ORDER BY cd.created_at DESC";
  const { rows } = await pool.query(q, params);
  res.json(rows.map(r => ({
    id: r.id, candidateId: r.candidate_id, missionId: r.mission_id,
    stage: r.stage, notes: r.notes || "", createdAt: r.created_at,
    candidateName: r.candidate_name || "", candidateEmail: r.candidate_email || "",
    candidatePhone: r.candidate_phone || "",
    missionTitle: r.mission_title || "", missionCompany: r.mission_company || "",
  })));
}));

// ─── Check if a candidate email is already known ────────────────────────────

router.get("/check-email", emailCheckLimiter, asyncHandler(async (req, res) => {
  const email = (req.query.email || "").trim();
  if (!email) return res.json({ known: false });

  const { rows } = await pool.query(
    "SELECT id, name FROM contacts WHERE LOWER(email) = LOWER($1) AND status = 'Candidat'",
    [email]
  );
  res.json({ known: rows.length > 0 });
}));

// ─── Submit a candidate ─────────────────────────────────────────────────────

router.post("/submit", uploadLimiter, validate(partnerSubmitSchema), asyncHandler(async (req, res) => {
  const { missionId, name, email, phone, summary, fileName, fileData } = req.body;
  const partnerId = req.partner.id;

  // Verify partner is affiliated to this mission
  const { rows: affil } = await pool.query(
    "SELECT 1 FROM partner_missions WHERE partner_id = $1 AND mission_id = $2",
    [partnerId, missionId]
  );
  if (affil.length === 0) throw new AppError(403, "Vous n'êtes pas affilié à cette mission");

  // Validate file size
  if (fileData.length > config.limits.maxFileSize) {
    throw new AppError(400, "Fichier trop volumineux (max 6 Mo)");
  }

  // Block submission if candidate email is already known
  if (email) {
    const { rows: existing } = await pool.query(
      "SELECT id FROM contacts WHERE LOWER(email) = LOWER($1) AND status = 'Candidat'",
      [email]
    );
    if (existing.length > 0) {
      throw new AppError(409, "Ce candidat est déjà enregistré dans notre base. Vous ne pouvez pas soumettre un candidat déjà connu.");
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create contact
    const { rows: newContact } = await client.query(
      `INSERT INTO contacts (name, email, phone, company, status, sector, revenue, notes)
       VALUES ($1, $2, $3, '', 'Candidat', 'Tech', 0, $4) RETURNING id`,
      [name, email, phone, summary]
    );
    const contactId = newContact[0].id;

    // Create candidature
    const { rows: cdRows } = await client.query(
      `INSERT INTO candidatures (candidate_id, mission_id, stage, notes, partner_id)
       VALUES ($1, $2, 'En attente', $3, $4) RETURNING id`,
      [contactId, missionId, summary, partnerId]
    );

    // Store CV file
    const safeName = sanitizeFileName(fileName);
    await client.query(
      `INSERT INTO files (contact_id, file_type, file_name, mime_type, file_data)
       VALUES ($1, 'cv', $2, 'application/pdf', $3)`,
      [contactId, safeName, fileData]
    );

    await client.query("COMMIT");

    // Send email notification to assigned recruiter
    const { rows: missionRows } = await pool.query(
      `SELECT m.title, m.company, u.full_name as assigned_name, u.login as assigned_email
       FROM missions m LEFT JOIN users u ON m.assigned_to = u.id WHERE m.id = $1`,
      [missionId]
    );
    const { rows: partnerRows } = await pool.query("SELECT name, company FROM partners WHERE id = $1", [partnerId]);
    const mission = missionRows[0];
    const partner = partnerRows[0];

    if (resend && mission?.assigned_email) {
      try {
        await resend.emails.send({
          from: "VALO CRM <onboarding@resend.dev>",
          to: mission.assigned_email,
          subject: `Nouveau candidat proposé : ${name} pour ${mission.title}`,
          html: `<h2>Nouveau candidat proposé par un partenaire</h2>
            <p>Le partenaire <strong>${partner?.name || "Inconnu"}</strong>${partner?.company ? ` (${partner.company})` : ""} a soumis un candidat pour votre mission.</p>
            <table style="border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f8fafc;">Mission</td><td style="padding:6px 12px;">${mission.title} — ${mission.company}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:bold;background:#f8fafc;">Candidat</td><td style="padding:6px 12px;">${name}</td></tr>
              ${email ? `<tr><td style="padding:6px 12px;font-weight:bold;background:#f8fafc;">Email</td><td style="padding:6px 12px;">${email}</td></tr>` : ""}
              ${phone ? `<tr><td style="padding:6px 12px;font-weight:bold;background:#f8fafc;">Téléphone</td><td style="padding:6px 12px;">${phone}</td></tr>` : ""}
            </table>
            ${summary ? `<p><strong>Résumé :</strong><br/>${summary.replace(/\n/g, "<br/>")}</p>` : ""}
            <p style="color:#64748b;font-size:13px;">Connectez-vous au CRM pour consulter le profil et le CV.</p>`,
        });
        logger.info("Email notification partenaire envoyé", { to: mission.assigned_email, partner: partner?.name });
      } catch (emailErr) {
        logger.error("Échec envoi email notification partenaire", { error: emailErr.message });
      }
    }

    res.status(201).json({
      ok: true,
      candidatureId: cdRows[0].id,
      contactId,
      message: `Candidat "${name}" soumis avec succès`,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}));

export default router;
