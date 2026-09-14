/**
 * Fonctions de sanitisation réutilisables.
 */

/**
 * Nettoie un nom de fichier : supprime les caractères dangereux,
 * conserve les accents et tronque à 200 caractères.
 */
export function sanitizeFileName(name) {
  return String(name || "")
    .replace(/[^a-zA-Z0-9À-ÖØ-öø-ÿ._\- ]/g, "_")
    .slice(0, 200);
}

/**
 * Échappe une valeur avant interpolation dans du HTML (emails).
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
