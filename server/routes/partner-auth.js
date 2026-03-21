import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { config } from "../config.js";
import { loginLimiter, signTokenAndSetCookie } from "../middleware.js";
import { validate } from "../validators/validate.js";
import { partnerLoginSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";

const router = Router();

router.post("/partner/login", loginLimiter, validate(partnerLoginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await pool.query("SELECT * FROM partners WHERE email = $1", [email]);
  if (rows.length === 0) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });

  const partner = rows[0];
  const valid = await bcrypt.compare(password, partner.password);
  if (!valid) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });

  signTokenAndSetCookie(res, { id: partner.id, email: partner.email, role: "partner" });

  res.json({ id: partner.id, email: partner.email, name: partner.name, company: partner.company, role: "partner" });
}));

router.post("/partner/logout", (req, res) => {
  res.clearCookie(config.jwt.cookieName);
  res.json({ ok: true });
});

export default router;
