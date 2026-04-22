import { Router } from "express";
import { Resend } from "resend";
import { pool } from "../db.js";
import { config } from "../config.js";
import { supabaseAdmin, supabaseClient } from "../supabase.js";
import { loginLimiter, signTokenAndSetCookie } from "../middleware.js";
import { validate } from "../validators/validate.js";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";
import { logger } from "../helpers/logger.js";

const router = Router();
const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;

// ─── Login ───────────────────────────────────────────────────────────────────

router.post("/login", loginLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { login, password } = req.body;

  // Vérifier les credentials via Supabase Auth
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: login,
    password,
  });

  if (error) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });

  // Récupérer l'utilisateur local par email ou auth_id
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE auth_id = $1 OR login = $2 LIMIT 1",
    [data.user.id, login]
  );
  if (rows.length === 0) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });

  const user = rows[0];

  // Mettre à jour auth_id si pas encore lié
  if (!user.auth_id) {
    await pool.query("UPDATE users SET auth_id = $1 WHERE id = $2", [data.user.id, user.id]);
  }

  signTokenAndSetCookie(res, { id: user.id, login: user.login, userRole: user.role || "user" });

  res.json({ id: user.id, login: user.login, fullName: user.full_name, userRole: user.role || "user" });
}));

// ─── Forgot password ─────────────────────────────────────────────────────────
// Génère un code à 6 chiffres, le stocke en BDD et l'envoie par email à l'utilisateur.

router.post("/forgot-password", loginLimiter, validate(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const { login } = req.body;

  // Toujours répondre ok (empêche l'énumération d'utilisateurs)
  const respondOk = () => res.json({ ok: true });

  const { rows: userRows } = await pool.query("SELECT id, login, full_name FROM users WHERE LOWER(login) = LOWER($1)", [login]);
  if (userRows.length === 0) return respondOk();
  const user = userRows[0];

  // Générer un code à 6 chiffres (100000-999999)
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Invalider les anciens codes et insérer le nouveau
  await pool.query("UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE", [user.id]);
  await pool.query(
    "INSERT INTO password_resets (user_id, code, expires_at) VALUES ($1, $2, $3)",
    [user.id, code, expiresAt]
  );

  // Envoyer le code par email
  if (resend) {
    try {
      await resend.emails.send({
        from: "VALO CRM <onboarding@resend.dev>",
        to: user.login,
        subject: "Code de réinitialisation de mot de passe — VALO CRM",
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#0f172a;">Réinitialisation de mot de passe</h2>
          <p>Bonjour ${user.full_name || ""},</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Voici votre code :</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
            <div style="font-size:32px;font-weight:800;letter-spacing:0.4em;color:#0f172a;">${code}</div>
          </div>
          <p style="color:#64748b;font-size:13px;">Ce code est valide pendant <strong>15 minutes</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
        </div>`,
      });
    } catch (err) {
      logger.error("Erreur envoi email reset password", { error: err.message });
    }
  } else {
    logger.warn("Resend non configuré - code de reset généré mais non envoyé", { userId: user.id, code });
  }

  respondOk();
}));

// ─── Reset password ──────────────────────────────────────────────────────────
// Vérifie le code contre la BDD puis met à jour le mot de passe dans Supabase Auth.

router.post("/reset-password", loginLimiter, validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  const { login, code, newPassword } = req.body;

  const { rows: userRows } = await pool.query("SELECT * FROM users WHERE LOWER(login) = LOWER($1)", [login]);
  if (userRows.length === 0) return res.status(400).json({ error: "Code invalide ou expiré" });
  const user = userRows[0];

  // Vérifier le code contre la BDD (non utilisé + non expiré)
  const { rows: resetRows } = await pool.query(
    `SELECT id FROM password_resets
     WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [user.id, code]
  );
  if (resetRows.length === 0) return res.status(400).json({ error: "Code invalide ou expiré" });

  // Mettre à jour le mot de passe dans Supabase Auth
  let authId = user.auth_id;
  if (!authId) {
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const supaUser = listData?.users?.find(u => u.email === user.login);
    if (!supaUser) return res.status(400).json({ error: "Utilisateur non trouvé dans Supabase Auth" });
    authId = supaUser.id;
    await pool.query("UPDATE users SET auth_id = $1 WHERE id = $2", [authId, user.id]);
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(authId, { password: newPassword });
  if (error) {
    logger.error("Erreur Supabase updateUserById", { error: error.message });
    return res.status(400).json({ error: "Impossible de mettre à jour le mot de passe" });
  }

  // Marquer le code comme utilisé
  await pool.query("UPDATE password_resets SET used = TRUE WHERE id = $1", [resetRows[0].id]);

  logger.info("Mot de passe réinitialisé", { userId: user.id });
  res.json({ ok: true });
}));

// ─── Logout (clear cookie) ──────────────────────────────────────────────────

router.post("/logout", (req, res) => {
  res.clearCookie(config.jwt.cookieName);
  res.json({ ok: true });
});

export default router;
