/**
 * Journal d'audit — point d'entrée unique pour toutes les routes.
 * Vocabulaire normalisé (actions et types d'entité) pour un affichage cohérent.
 */
import { pool } from "../db.js";
import { logger } from "./logger.js";

export const AUDIT_ACTIONS = {
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
};

/**
 * @param {import("express").Request} req  requête (pour l'auteur)
 * @param {string} action     AUDIT_ACTIONS.*
 * @param {string} entityType ex. "contact", "mission", "candidature", "activité", "placement", "fichier", "user"
 * @param {number|null} entityId
 * @param {string} details
 */
export async function logAudit(req, action, entityType, entityId, details = "") {
  try {
    const id = entityId == null || Number.isNaN(Number(entityId)) ? null : Number(entityId);
    await pool.query(
      "INSERT INTO audit_log (user_name, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
      [req?.user?.login || "Système", String(action).slice(0, 30), String(entityType).toLowerCase().slice(0, 30), id, String(details || "").slice(0, 2000)]
    );
  } catch (err) {
    // L'audit ne doit jamais faire échouer l'opération métier.
    logger.error("Échec écriture audit_log", { error: err.message, action, entityType, entityId });
  }
}
