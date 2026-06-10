import { useState, useEffect } from "react";

/**
 * useState persisté en sessionStorage : les filtres survivent à la navigation
 * entre les onglets (le composant est démonté/remonté) mais pas à la fermeture
 * de l'onglet navigateur.
 */
export default function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch { /* stockage indisponible : on garde l'état en mémoire */ }
  }, [key, value]);

  return [value, setValue];
}
