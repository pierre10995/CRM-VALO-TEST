import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { JWT_SECRET, JWT_EXPIRES_IN, loginLimiter } from "../middleware.js";
import { Resend } from "resend";

const router = Router();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

router.post("/login", loginLimiter, async (req, res) => {
  const { login, password } = req.body;
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE login = $1", [login]);
    if (rows.length === 0) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    const user = rows[0];
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    const token = jwt.sign({ id: user.id, login: user.login }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ id: user.id, login: user.login, fullName: user.full_name, token });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/forgot-password", loginLimiter, async (req, res) => {
  const { login } = req.body;
  if (!login) return res.status(400).json({ error: "Identifiant requis" });
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE login = $1", [login]);
    if (rows.length === 0) return res.json({ ok: true });
    const user = rows[0];
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query("UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE", [user.id]);
    await pool.query("INSERT INTO password_resets (user_id, code, expires_at) VALUES ($1, $2, $3)", [user.id, code, expiresAt]);
    console.log(`[RESET PASSWORD] Code pour ${user.login} (${user.full_name}): ${code} — Expire dans 15 min`);
    if (resend && ADMIN_EMAIL) {
      try {
        await resend.emails.send({
          from: "VALO CRM <onboarding@resend.dev>",
          to: ADMIN_EMAIL,
          subject: `Code de réinitialisation pour ${user.login}`,
          html: `<h2>Réinitialisation de mot de passe</h2>
            <p>L'utilisateur <strong>${user.login}</strong> (${user.full_name}) a demandé une réinitialisation de mot de passe.</p>
            <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:20px;background:#f0f0f0;border-radius:8px;">${code}</p>
            <p>Ce code expire dans <strong>15 minutes</strong>.</p>`,
        });
        console.log(`[RESET PASSWORD] Email envoyé à ${ADMIN_EMAIL}`);
      } catch (emailErr) {
        console.error("[RESET PASSWORD] Erreur envoi email:", emailErr.message);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/reset-password", loginLimiter, async (req, res) => {
  const { login, code, newPassword } = req.body;
  if (!login || !code || !newPassword) return res.status(400).json({ error: "Tous les champs sont requis" });
  if (newPassword.length < 6) return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
  try {
    const { rows: userRows } = await pool.query("SELECT * FROM users WHERE login = $1", [login]);
    if (userRows.length === 0) return res.status(400).json({ error: "Code invalide ou expiré" });
    const user = userRows[0];
    const { rows: resetRows } = await pool.query(
      "SELECT * FROM password_resets WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [user.id, code]
    );
    if (resetRows.length === 0) return res.status(400).json({ error: "Code invalide ou expiré" });
    const hash = bcrypt.hashSync(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, user.id]);
    await pool.query("UPDATE password_resets SET used = TRUE WHERE id = $1", [resetRows[0].id]);
    console.log(`[RESET PASSWORD] Mot de passe réinitialisé pour ${user.login}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
