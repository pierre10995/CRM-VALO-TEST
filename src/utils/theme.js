/**
 * Thème clair / sombre / automatique (préférence système).
 * La préférence est stockée dans localStorage et appliquée via
 * <html data-theme="light|dark|auto"> ; les couleurs vivent dans styles.js.
 */
const KEY = "crm_theme";
export const THEMES = ["auto", "light", "dark"];

export function getThemePref() {
  try {
    const v = localStorage.getItem(KEY);
    return THEMES.includes(v) ? v : "auto";
  } catch { return "auto"; }
}

export function applyTheme(pref) {
  const p = THEMES.includes(pref) ? pref : "auto";
  document.documentElement.setAttribute("data-theme", p);
  try { localStorage.setItem(KEY, p); } catch { /* stockage indisponible */ }
  return p;
}

/** Applique la préférence enregistrée (à appeler avant le premier rendu). */
export function initTheme() {
  return applyTheme(getThemePref());
}
