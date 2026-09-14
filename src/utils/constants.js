export const SECTORS = ["Tech", "Finance", "Santé", "Retail", "Industrie", "Services", "Médias", "Éducation", "Autre"];
// Étapes proposées à la saisie interne
export const STAGES = ["Présélectionné", "Soumis", "Entretien", "Finaliste", "Placé", "Refusé"];
// Toutes les étapes existantes en base (y compris flux partenaires)
export const ALL_STAGES = ["En attente", "Proposition partenaire", ...STAGES, "Archivé"];

// Presets de couleur des statuts de validation (partagés par la page et le formulaire)
export const COLOR_PRESETS = [
  { bg: "#d1fae5", color: "#059669", name: "Vert" },
  { bg: "#fef3c7", color: "#d97706", name: "Orange" },
  { bg: "#e0e7ff", color: "#4f46e5", name: "Indigo" },
  { bg: "#fee2e2", color: "#dc2626", name: "Rouge" },
  { bg: "#fce7f3", color: "#be185d", name: "Rose" },
  { bg: "#dbeafe", color: "#2563eb", name: "Bleu" },
  { bg: "#f1f5f9", color: "#64748b", name: "Gris" },
];
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
