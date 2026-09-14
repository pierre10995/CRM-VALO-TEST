export const SECTORS = ["Tech", "Finance", "Santé", "Retail", "Industrie", "Services", "Médias", "Éducation", "Autre"];
// Étapes proposées à la saisie interne
export const STAGES = ["Présélectionné", "Soumis", "Entretien", "Finaliste", "Placé", "Refusé"];
// Toutes les étapes existantes en base (y compris flux partenaires)
export const ALL_STAGES = ["En attente", "Proposition partenaire", ...STAGES, "Archivé"];

// Presets de couleur des statuts de validation (partagés par la page et le formulaire)
export const COLOR_PRESETS = [
  { bg: "var(--tint-green)", color: "var(--c-green)", name: "Vert" },
  { bg: "var(--tint-amber)", color: "var(--c-amber)", name: "Orange" },
  { bg: "var(--tint-violet)", color: "var(--c-indigo)", name: "Indigo" },
  { bg: "var(--tint-red)", color: "var(--c-red)", name: "Rouge" },
  { bg: "var(--tint-pink)", color: "var(--c-pink)", name: "Rose" },
  { bg: "var(--tint-blue)", color: "var(--c-blue)", name: "Bleu" },
  { bg: "var(--surface-3)", color: "var(--muted)", name: "Gris" },
];
export const ACTIVITY_TYPES = ["Appel", "Email", "Réunion", "Note"];
export const CONTRACT_TYPES = ["CDI", "CDD", "Contrat", "Freelance", "Stage"];
export const MISSION_STATUSES = ["Ouverte", "En cours", "Gagné", "Pourvue", "Fermée"];
export const VALIDATION_STATUSES = ["Validé", "À moitié Validé", "Doute", "Refusé par VALO", "Refusé par le client"];
export const PRIORITIES = ["Basse", "Normale", "Haute", "Urgente"];

export const fmtCAD = (n) => Number(n || 0).toLocaleString("fr-CA") + " $ CAD";

export const VALIDATION_COLORS = {
  "Validé": { bg: "var(--tint-green)", color: "var(--c-green)" },
  "À moitié Validé": { bg: "var(--tint-amber)", color: "var(--c-amber)" },
  "Doute": { bg: "var(--tint-violet)", color: "var(--c-indigo)" },
  "Refusé par VALO": { bg: "var(--tint-red)", color: "var(--c-red)" },
  "Refusé par le client": { bg: "var(--tint-pink)", color: "var(--c-pink)" },
};
