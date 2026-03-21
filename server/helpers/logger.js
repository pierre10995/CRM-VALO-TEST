/**
 * Logger structuré minimaliste.
 * Émet du JSON en production pour intégration avec des outils de monitoring.
 * Émet du texte lisible en développement.
 */
import { config } from "../config.js";

function formatEntry(level, message, meta = {}) {
  if (config.isProduction) {
    return JSON.stringify({ ts: new Date().toISOString(), level, msg: message, ...meta });
  }
  const prefix = `[${new Date().toISOString().slice(11, 19)}] [${level.toUpperCase()}]`;
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${prefix} ${message}${metaStr}`;
}

export const logger = {
  info(message, meta) { console.log(formatEntry("info", message, meta)); },
  warn(message, meta) { console.warn(formatEntry("warn", message, meta)); },
  error(message, meta) { console.error(formatEntry("error", message, meta)); },
};
