/**
 * Configuration centralisée du serveur.
 * Valide les variables d'environnement au démarrage (fail-fast).
 */

const isProduction = process.env.NODE_ENV === "production";

// --- JWT ---
if (isProduction && !process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET est requis en production.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn("WARN: JWT_SECRET non défini. Secret aléatoire généré (non persistant, dev only).");
}

export const config = {
  env: process.env.NODE_ENV || "development",
  isProduction,
  port: parseInt(process.env.PORT, 10) || 3000,

  jwt: {
    secret: process.env.JWT_SECRET || `dev-secret-${Date.now()}-${Math.random()}`,
    expiresIn: "4h",
    cookieName: "crm_token",
  },

  db: {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  },

  cors: {
    origins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim())
      : isProduction
        ? []
        : ["http://localhost:5173", "http://localhost:3000"],
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY || "",
    adminEmail: process.env.ADMIN_EMAIL || "",
  },

  limits: {
    jsonPayload: "10mb",
    maxFileSize: 8 * 1024 * 1024,  // 8MB base64
    maxBulkFiles: 50,
  },
};
