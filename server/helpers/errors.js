/**
 * Error handler Express centralisé.
 * Ne fuit jamais de détails internes vers le client.
 */
import { logger } from "./logger.js";

export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Wrapper async pour les routes Express.
 * Attrape automatiquement les erreurs et les passe au middleware d'erreur.
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Middleware Express global de gestion d'erreurs.
 * À monter en dernier dans server.js.
 */
export function errorMiddleware(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error("Erreur interne non gérée", {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: err.stack?.split("\n").slice(0, 3).join(" | "),
  });

  res.status(500).json({ error: "Erreur serveur" });
}
