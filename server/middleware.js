import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";

const { secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN, cookieName: COOKIE_NAME } = config.jwt;

// ─── Rate limiters ───────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Trop de requêtes IA. Réessayez dans 1 minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Trop d'uploads. Réessayez dans 1 minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Auth middleware ─────────────────────────────────────────────────────────

/**
 * Extrait le JWT soit du cookie httpOnly, soit du header Authorization (fallback).
 * Le cookie est prioritaire pour la sécurité (pas accessible en JS côté client).
 */
function authMiddleware(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
    || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

  if (!token) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ error: "Session expirée, veuillez vous reconnecter" });
  }
}

/**
 * Génère un token JWT et le pose en cookie httpOnly + en réponse JSON.
 */
function signTokenAndSetCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "strict",
    maxAge: 4 * 60 * 60 * 1000, // 4h
    path: "/",
  });

  return token;
}

export {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  loginLimiter,
  aiLimiter,
  uploadLimiter,
  authMiddleware,
  signTokenAndSetCookie,
};
