export const SECTORS = ["Tech", "Finance", "Santé", "Retail", "Industrie", "Services", "Médias", "Éducation", "Autre"];
export const STAGES = ["Présélectionné", "Soumis", "Entretien", "Finaliste", "Placé", "Refusé"];
export const ACTIVITY_TYPES = ["Appel", "Email", "Réunion", "Note"];
export const CONTRACT_TYPES = ["CDI", "CDD", "Contrat", "Freelance", "Stage"];
export const MISSION_STATUSES = ["Ouverte", "En cours", "Gagné", "Pourvue", "Fermée"];
export const VALIDATION_STATUSES = ["Validé", "À moitié Validé", "Doute", "Refusé par VALO", "Refusé par le client"];
export const PRIORITIES = ["Basse", "Normale", "Haute", "Urgente"];

export const fmtCAD = (n) => Number(n || 0).toLocaleString("fr-CA") + " $ CAD";

export const VALIDATION_COLORS = {
  "Validé": { bg: "#d1fae5", color: "#059669" },
  "À moitié Validé": { bg: "#fef3c7", color: "#d97706" },
  "Doute": { bg: "#e0e7ff", color: "#4f46e5" },
  "Refusé par VALO": { bg: "#fee2e2", color: "#dc2626" },
  "Refusé par le client": { bg: "#fce7f3", color: "#be185d" },
};
