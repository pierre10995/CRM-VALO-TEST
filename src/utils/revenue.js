/**
 * Source unique de vérité pour le calcul du chiffre d'affaires.
 *
 * Règle métier : une mission compte dans le CA dès que son statut est "Gagné".
 * Le CA d'une mission = sa commission VALO. Le résultat net déduit la
 * commission versée aux recruteurs externes.
 *
 * Toutes les pages (Dashboard, Chiffre d'affaires, Objectifs) DOIVENT utiliser
 * ces helpers pour éviter des écarts d'un écran à l'autre.
 */

export const WON_STATUS = "Gagné";

export function isWonMission(m) {
  return m.status === WON_STATUS;
}

/** Missions gagnées, optionnellement filtrées sur une année fiscale. */
export function wonMissionsForFY(missions, fyId) {
  const won = (missions || []).filter(isWonMission);
  if (!fyId || fyId === "all" || fyId == null) return won;
  return won.filter(m => String(m.fiscalYearId) === String(fyId));
}

export function sumCommission(missions) {
  return (missions || []).reduce((s, m) => s + (m.commission || 0), 0);
}

export function sumRecruiterCommission(missions) {
  return (missions || []).reduce((s, m) => s + (m.recruiterCommission || 0), 0);
}

/** Trouve l'année fiscale couvrant une date donnée (par défaut aujourd'hui). */
export function findCurrentFY(fiscalYears, date = new Date()) {
  return (fiscalYears || []).find(fy =>
    new Date(fy.startDate) <= date && date <= new Date(fy.endDate)
  ) || null;
}
