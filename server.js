import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "./server/config.js";
import { initDB, pool } from "./server/db.js";
import { authMiddleware, aiLimiter, uploadLimiter } from "./server/middleware.js";
import { errorMiddleware } from "./server/helpers/errors.js";
import { logger } from "./server/helpers/logger.js";

// Route modules
import authRoutes from "./server/routes/auth.js";
import contactRoutes from "./server/routes/contacts.js";
import missionRoutes from "./server/routes/missions.js";
import candidatureRoutes from "./server/routes/candidatures.js";
import activityRoutes from "./server/routes/activities.js";
import objectiveRoutes from "./server/routes/objectives.js";
import fiscalYearRoutes from "./server/routes/fiscal-years.js";
import placementRoutes from "./server/routes/placements.js";
import fileRoutes from "./server/routes/files.js";
import evaluationRoutes from "./server/routes/evaluations.js";
import matchingRoutes from "./server/routes/matching.js";
import statsRoutes from "./server/routes/stats.js";
import cvParserRoutes from "./server/routes/cv-parser.js";
import bulkCvRoutes from "./server/routes/bulk-cv-upload.js";
import partnerAuthRoutes from "./server/routes/partner-auth.js";
import partnerRoutes from "./server/routes/partner.js";
import partnersAdminRoutes from "./server/routes/partners-admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Trust first proxy (Railway, Render, etc.) so rate-limiters & req.ip work correctly
app.set("trust proxy", 1);

// ─── Security & parsing middleware ───────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: config.cors.origins.length > 0 ? config.cors.origins : (config.isProduction ? false : true),
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: config.limits.jsonPayload }));

// ─── Auth guard for /api routes ──────────────────────────────────────────────

const publicPaths = ["/login", "/logout", "/forgot-password", "/reset-password", "/partner/login", "/partner/logout"];

// Le rôle est relu en base à chaque requête (et non figé dans le JWT) : une
// rétrogradation ou une suppression de compte prend effet immédiatement.
async function refreshUserRole(req, res, next) {
  try {
    if (!req.user?.id) return next();
    const { rows } = await pool.query("SELECT role FROM users WHERE id = $1", [req.user.id]);
    if (rows.length === 0) {
      res.clearCookie(config.jwt.cookieName);
      return res.status(401).json({ error: "Compte introuvable, veuillez vous reconnecter" });
    }
    req.user.userRole = rows[0].role || "user";
    next();
  } catch (err) {
    next(err);
  }
}

app.use("/api", (req, res, next) => {
  if (publicPaths.includes(req.path)) return next();
  // Partner-facing routes handle their own auth via partnerAuthMiddleware
  if (req.path.startsWith("/partner/") && !req.path.startsWith("/partners")) return next();
  authMiddleware(req, res, (err) => (err ? next(err) : refreshUserRole(req, res, next)));
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api", authRoutes);
app.use("/api", partnerAuthRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/partners", partnersAdminRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/candidatures", candidatureRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/objectives", objectiveRoutes);
app.use("/api/fiscal-years", fiscalYearRoutes);
app.use("/api/placements", placementRoutes);
app.use("/api/files", uploadLimiter, fileRoutes);
app.use("/api/evaluations", aiLimiter, evaluationRoutes);
app.use("/api/matching", aiLimiter, matchingRoutes);
app.use("/api", statsRoutes);
app.use("/api", cvParserRoutes);
app.use("/api", uploadLimiter, aiLimiter, bulkCvRoutes);

// ─── Serve frontend ──────────────────────────────────────────────────────────

// Health check (Railway / monitoring) : vérifie la connexion à la base.
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, uptime: Math.round(process.uptime()) });
  } catch {
    res.status(503).json({ ok: false });
  }
});

// Une route /api inconnue renvoie un 404 JSON (et non l'index.html).
app.all("/api/*", (req, res) => res.status(404).json({ error: "Route introuvable" }));

// Assets hashés par Vite : cache long ; index.html : jamais mis en cache,
// pour que chaque déploiement soit visible immédiatement.
const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir, {
  index: false,
  maxAge: "1y",
  immutable: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  },
}));
app.get("*", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(distDir, "index.html"));
});

// ─── Global error handler (must be last) ─────────────────────────────────────

app.use(errorMiddleware);

// ─── Start & arrêt propre ────────────────────────────────────────────────────

process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", { error: reason instanceof Error ? reason.message : String(reason) });
});
process.on("uncaughtException", (err) => {
  logger.error("uncaughtException", { error: err.message });
  process.exit(1);
});

initDB()
  .then(() => {
    const server = app.listen(config.port, "0.0.0.0", () => {
      logger.info(`VALO CRM running`, { port: config.port, env: config.env });
    });

    // SIGTERM (redéploiement Railway) : on laisse finir les requêtes en cours
    // (uploads, appels IA) puis on ferme le pool PostgreSQL.
    const shutdown = (signal) => {
      logger.info(`Arrêt demandé (${signal})`);
      server.close(async () => {
        try { await pool.end(); } catch { /* ignore */ }
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 15000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err) => {
    logger.error("DB init failed", { error: err.message });
    process.exit(1);
  });
