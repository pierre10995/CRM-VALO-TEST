import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

if (!process.env.JWT_SECRET) {
  console.warn("ATTENTION: JWT_SECRET non défini. Utilisation d'un secret par défaut (NON SÉCURISÉ en production).");
}
const JWT_SECRET = process.env.JWT_SECRET || "valo-crm-dev-only-secret-" + Date.now();
const JWT_EXPIRES_IN = "4h";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expirée, veuillez vous reconnecter" });
  }
}

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

export { JWT_SECRET, JWT_EXPIRES_IN, loginLimiter, aiLimiter, uploadLimiter, authMiddleware };
