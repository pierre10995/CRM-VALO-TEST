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
