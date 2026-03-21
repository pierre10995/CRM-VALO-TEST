import { Router } from "express";
import { pool } from "../db.js";
import { config } from "../config.js";
import { supabaseAdmin, supabaseClient } from "../supabase.js";
import { loginLimiter, signTokenAndSetCookie } from "../middleware.js";
import { validate } from "../validators/validate.js";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";
import { logger } from "../helpers/logger.js";

const router = Router();

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

  const token = signTokenAndSetCookie(res, { id: user.id, login: user.login });

  res.json({ id: user.id, login: user.login, fullName: user.full_name, token });
}));

// ─── Forgot password ─────────────────────────────────────────────────────────

router.post("/forgot-password", loginLimiter, validate(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const { login } = req.body;

  // Envoyer le lien de réinitialisation via Supabase Auth
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(login, {
    redirectTo: `${req.headers.origin || ""}/reset-password`,
  });

  if (error) {
    logger.error("Erreur Supabase resetPasswordForEmail", { error: error.message });
  }

  // Toujours répondre ok (empêche l'énumération d'utilisateurs)
  res.json({ ok: true });
}));

// ─── Reset password ──────────────────────────────────────────────────────────

router.post("/reset-password", loginLimiter, validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  const { login, code, newPassword } = req.body;

  // Chercher l'utilisateur local
  const { rows: userRows } = await pool.query("SELECT * FROM users WHERE login = $1", [login]);
  if (userRows.length === 0) return res.status(400).json({ error: "Code invalide ou expiré" });

  const user = userRows[0];

  if (user.auth_id) {
    // Mettre à jour le mot de passe via Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.auth_id, {
      password: newPassword,
    });
    if (error) {
      logger.error("Erreur Supabase updateUserById", { error: error.message });
      return res.status(400).json({ error: "Impossible de mettre à jour le mot de passe" });
    }
  } else {
    // Fallback : chercher par email dans Supabase Auth et mettre à jour
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const supaUser = listData?.users?.find(u => u.email === login);
    if (supaUser) {
      await supabaseAdmin.auth.admin.updateUserById(supaUser.id, { password: newPassword });
      await pool.query("UPDATE users SET auth_id = $1 WHERE id = $2", [supaUser.id, user.id]);
    } else {
      return res.status(400).json({ error: "Utilisateur non trouvé dans Supabase Auth" });
    }
  }

  // Marquer les anciens codes de reset comme utilisés (nettoyage)
  await pool.query("UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE", [user.id]);

  logger.info("Mot de passe réinitialisé via Supabase", { userId: user.id });

  res.json({ ok: true });
}));

// ─── Logout (clear cookie) ──────────────────────────────────────────────────

router.post("/logout", (req, res) => {
  res.clearCookie(config.jwt.cookieName);
  res.json({ ok: true });
});

export default router;
