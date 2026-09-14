/**
 * Helpers de dates partagés (front).
 */

/**
 * Convertit une date stockée (ISO ou autre) au format attendu par
 * <input type="datetime-local"> : "YYYY-MM-DDTHH:mm". Renvoie "" si invalide.
 */
export function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return typeof value === "string" ? value.slice(0, 16) : "";
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Date courte localisée (fr-CA) ; "" si absente/invalide. */
export function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-CA");
}

/** Date + heure localisées (fr-CA). */
export function fmtDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" });
}
