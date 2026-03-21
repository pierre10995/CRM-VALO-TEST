import { Router } from "express";
import { pool } from "../db.js";
import { config } from "../config.js";
import { supabaseClient } from "../supabase.js";
import { loginLimiter, signTokenAndSetCookie } from "../middleware.js";
import { validate } from "../validators/validate.js";
import { partnerLoginSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";

const router = Router();

router.post("/partner/login", loginLimiter, validate(partnerLoginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Vérifier les credentials via Supabase Auth
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });

  // Récupérer le partenaire local par auth_id ou email
  const { rows } = await pool.query(
    "SELECT * FROM partners WHERE auth_id = $1 OR email = $2 LIMIT 1",
    [data.user.id, email]
  );
  if (rows.length === 0) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });

  const partner = rows[0];

  // Mettre à jour auth_id si pas encore lié
  if (!partner.auth_id) {
    await pool.query("UPDATE partners SET auth_id = $1 WHERE id = $2", [data.user.id, partner.id]);
  }

  signTokenAndSetCookie(res, { id: partner.id, email: partner.email, role: "partner" });

  res.json({ id: partner.id, email: partner.email, name: partner.name, company: partner.company, role: "partner" });
}));

router.post("/partner/logout", (req, res) => {
  res.clearCookie(config.jwt.cookieName);
  res.json({ ok: true });
});

export default router;
