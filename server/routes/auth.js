import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { config } from "../config.js";
import { loginLimiter, signTokenAndSetCookie } from "../middleware.js";
import { validate } from "../validators/validate.js";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";
import { logger } from "../helpers/logger.js";
import { Resend } from "resend";

const router = Router();
const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;

// ─── Login ───────────────────────────────────────────────────────────────────

router.post("/login", loginLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { login, password } = req.body;

  const { rows } = await pool.query("SELECT * FROM users WHERE login = $1", [login]);
  if (rows.length === 0) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });

  const token = signTokenAndSetCookie(res, { id: user.id, login: user.login });

  res.json({ id: user.id, login: user.login, fullName: user.full_name, token });
}));

// ─── Forgot password ─────────────────────────────────────────────────────────

router.post("/forgot-password", loginLimiter, validate(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const { login } = req.body;

  const { rows } = await pool.query("SELECT * FROM users WHERE login = $1", [login]);
  // Toujours répondre ok (empêche l'énumération d'utilisateurs)
  if (rows.length === 0) return res.json({ ok: true });

  const user = rows[0];
  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await pool.query("UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE", [user.id]);
  await pool.query("INSERT INTO password_resets (user_id, code, expires_at) VALUES ($1, $2, $3)", [user.id, code, expiresAt]);

  logger.info("Code de réinitialisation généré", { userId: user.id });

  if (resend && config.resend.adminEmail) {
    try {
      await resend.emails.send({
        from: "VALO CRM <onboarding@resend.dev>",
        to: config.resend.adminEmail,
        subject: `Code de réinitialisation pour ${user.login}`,
        html: `<h2>Réinitialisation de mot de passe</h2>
          <p>L'utilisateur <strong>${user.login}</strong> (${user.full_name}) a demandé une réinitialisation.</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:20px;background:#f0f0f0;border-radius:8px;">${code}</p>
          <p>Ce code expire dans <strong>15 minutes</strong>.</p>`,
      });
      logger.info("Email de reset envoyé", { to: config.resend.adminEmail });
    } catch (emailErr) {
      logger.error("Échec envoi email de reset", { error: emailErr.message });
    }
  }

  res.json({ ok: true });
}));

// ─── Reset password ──────────────────────────────────────────────────────────

router.post("/reset-password", loginLimiter, validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  const { login, code, newPassword } = req.body;

  const { rows: userRows } = await pool.query("SELECT * FROM users WHERE login = $1", [login]);
  if (userRows.length === 0) return res.status(400).json({ error: "Code invalide ou expiré" });

  const user = userRows[0];
  const { rows: resetRows } = await pool.query(
    "SELECT * FROM password_resets WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
    [user.id, code]
  );
  if (resetRows.length === 0) return res.status(400).json({ error: "Code invalide ou expiré" });

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, user.id]);
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
