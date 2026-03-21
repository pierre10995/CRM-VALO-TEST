import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "./server/config.js";
import { initDB } from "./server/db.js";
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

app.use("/api", (req, res, next) => {
  if (publicPaths.includes(req.path)) return next();
  // Partner-facing routes handle their own auth via partnerAuthMiddleware
  if (req.path.startsWith("/partner/") && !req.path.startsWith("/partners")) return next();
  authMiddleware(req, res, next);
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
app.use("/api", uploadLimiter, bulkCvRoutes);

// ─── Serve frontend ──────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ─── Global error handler (must be last) ─────────────────────────────────────

app.use(errorMiddleware);

// ─── Start ───────────────────────────────────────────────────────────────────

initDB()
  .then(() => {
    app.listen(config.port, "0.0.0.0", () => {
      logger.info(`VALO CRM running`, { port: config.port, env: config.env });
    });
  })
  .catch((err) => {
    logger.error("DB init failed", { error: err.message });
    process.exit(1);
  });
