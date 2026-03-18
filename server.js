import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import { initDB } from "./server/db.js";
import { authMiddleware, aiLimiter, uploadLimiter } from "./server/middleware.js";

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Protect all /api/ routes except auth endpoints
app.use("/api", (req, res, next) => {
  if (req.path === "/login" || req.path === "/forgot-password" || req.path === "/reset-password") return next();
  authMiddleware(req, res, next);
});

// Mount route modules
app.use("/api", authRoutes);
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

// Serve frontend
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start
initDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`VALO Recrutement CRM running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });
