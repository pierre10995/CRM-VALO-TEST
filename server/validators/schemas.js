/**
 * Schémas de validation Zod pour toutes les routes de l'API.
 * Convention : chaque schéma porte le nom de la route + l'action.
 */
import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  login: z.string().min(1, "Identifiant requis").max(100),
  password: z.string().min(1, "Mot de passe requis").max(200),
});

export const forgotPasswordSchema = z.object({
  login: z.string().min(1, "Identifiant requis").max(100),
});

export const resetPasswordSchema = z.object({
  login: z.string().min(1).max(100),
  code: z.string().min(6).max(6),
  newPassword: z.string().min(12, "Le mot de passe doit contenir au moins 12 caractères").max(200)
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
});

// ─── Contacts ────────────────────────────────────────────────────────────────

export const contactSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  company: z.string().max(100).default(""),
  email: z.string().max(100).default(""),
  phone: z.string().max(50).default(""),
  status: z.enum(["Candidat", "Client", "Prospect"]).default("Candidat"),
  sector: z.string().max(50).default("Tech"),
  revenue: z.coerce.number().min(0).default(0),
  notes: z.string().max(5000).default(""),
  city: z.string().max(100).default(""),
  linkedin: z.string().max(200).default(""),
  skills: z.string().max(2000).default(""),
  salaryExpectation: z.coerce.number().min(0).default(0),
  availability: z.string().max(50).default(""),
  validationStatus: z.string().max(30).default(""),
  targetPosition: z.string().max(200).default(""),
  owner: z.string().max(100).default(""),
});

// ─── Missions ────────────────────────────────────────────────────────────────

export const missionSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  clientContactId: z.coerce.number().int().positive().nullable().default(null),
  company: z.string().min(1, "Entreprise requise").max(100),
  location: z.string().max(100).default(""),
  contractType: z.string().max(50).default("CDI"),
  salaryMin: z.coerce.number().min(0).default(0),
  salaryMax: z.coerce.number().min(0).default(0),
  description: z.string().max(5000).default(""),
  requirements: z.string().max(5000).default(""),
  status: z.string().max(30).default("Ouverte"),
  priority: z.string().max(20).default("Normale"),
  assignedTo: z.coerce.number().int().positive().nullable().default(null),
  commission: z.coerce.number().min(0).default(0),
  deadline: z.string().nullable().default(null),
  fiscalYearId: z.coerce.number().int().positive().nullable().default(null),
  workMode: z.string().max(50).default(""),
});

// ─── Candidatures ────────────────────────────────────────────────────────────

export const candidatureCreateSchema = z.object({
  candidateId: z.coerce.number().int().positive("Candidat requis"),
  missionId: z.coerce.number().int().positive("Mission requise"),
  stage: z.string().max(30).default("Soumis"),
  rating: z.coerce.number().int().min(0).max(5).default(0),
  notes: z.string().max(5000).default(""),
  interviewDate: z.string().nullable().default(null),
});

export const candidatureUpdateSchema = z.object({
  stage: z.string().max(30).default("Soumis"),
  rating: z.coerce.number().int().min(0).max(5).default(0),
  notes: z.string().max(5000).default(""),
  interviewDate: z.string().nullable().default(null),
});

// ─── Activities ──────────────────────────────────────────────────────────────

export const activityCreateSchema = z.object({
  contactId: z.coerce.number().int().positive().nullable().default(null),
  missionId: z.coerce.number().int().positive().nullable().default(null),
  userId: z.coerce.number().int().positive().nullable().default(null),
  type: z.string().min(1, "Type requis").max(30),
  subject: z.string().min(1, "Sujet requis").max(200),
  description: z.string().max(5000).default(""),
  dueDate: z.string().nullable().default(null),
});

export const activityUpdateSchema = z.object({
  completed: z.boolean(),
});

// ─── Objectives ──────────────────────────────────────────────────────────────

export const objectiveCreateSchema = z.object({
  userId: z.coerce.number().int().positive("Utilisateur requis"),
  period: z.string().min(1, "Période requise").max(20),
  year: z.coerce.number().int().default(0),
  month: z.coerce.number().int().nullable().default(null),
  targetNewClients: z.coerce.number().int().min(0).default(0),
  targetCA: z.coerce.number().min(0).default(0),
  targetTotal: z.coerce.number().min(0).default(0),
  notes: z.string().max(5000).default(""),
  fiscalYearId: z.coerce.number().int().positive().nullable().default(null),
});

export const objectiveUpdateSchema = z.object({
  targetNewClients: z.coerce.number().int().min(0).default(0),
  targetCA: z.coerce.number().min(0).default(0),
  targetTotal: z.coerce.number().min(0).default(0),
  notes: z.string().max(5000).default(""),
});

// ─── Fiscal Years ────────────────────────────────────────────────────────────

export const fiscalYearSchema = z.object({
  label: z.string().min(1, "Libellé requis").max(20),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  target: z.coerce.number().min(0).default(0),
});

// ─── Placements ──────────────────────────────────────────────────────────────

export const placementCreateSchema = z.object({
  candidatureId: z.coerce.number().int().positive().nullable().default(null),
  candidateId: z.coerce.number().int().positive("Candidat requis"),
  missionId: z.coerce.number().int().positive("Mission requise"),
  company: z.string().max(100).default(""),
  startDate: z.string().nullable().default(null),
  probationDate: z.string().nullable().default(null),
  startInvoiceSent: z.boolean().default(false),
  startInvoiceName: z.string().max(200).default(""),
  startInvoicePaid: z.boolean().default(false),
  probationInvoiceSent: z.boolean().default(false),
  probationInvoiceName: z.string().max(200).default(""),
  probationInvoicePaid: z.boolean().default(false),
  probationValidated: z.boolean().default(false),
  notes: z.string().max(5000).default(""),
});

export const placementUpdateSchema = z.object({
  startDate: z.string().nullable().default(null),
  probationDate: z.string().nullable().default(null),
  startInvoiceSent: z.boolean().default(false),
  startInvoiceName: z.string().max(200).default(""),
  startInvoicePaid: z.boolean().default(false),
  probationInvoiceSent: z.boolean().default(false),
  probationInvoiceName: z.string().max(200).default(""),
  probationInvoicePaid: z.boolean().default(false),
  probationValidated: z.boolean().default(false),
  notes: z.string().max(5000).default(""),
});

// ─── Files ───────────────────────────────────────────────────────────────────

export const fileUploadSchema = z.object({
  contactId: z.coerce.number().int().positive().nullable().default(null),
  missionId: z.coerce.number().int().positive().nullable().default(null),
  fileType: z.enum(["cv", "compte-rendu", "offre"], {
    errorMap: () => ({ message: "Type autorisé : cv, compte-rendu, offre" }),
  }),
  fileName: z.string().min(1).max(200),
  mimeType: z.enum(["application/pdf"]).default("application/pdf"),
  fileData: z.string().min(1),
});

// ─── Evaluations ─────────────────────────────────────────────────────────────

export const evaluationGenerateSchema = z.object({
  candidateId: z.coerce.number().int().positive("Candidat requis"),
  missionId: z.coerce.number().int().positive("Mission requise"),
});

// ─── Matching ────────────────────────────────────────────────────────────────
// (pas de body — validation de params uniquement)

// ─── Users ──────────────────────────────────────────────────────────────────

const strongPassword = z.string().min(12, "Mot de passe min. 12 caractères").max(200)
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre");

export const userCreateSchema = z.object({
  fullName: z.string().min(1, "Nom complet requis").max(100),
  login: z.string().email("Email invalide").max(100),
  password: strongPassword,
});

// ─── Validation Statuses ─────────────────────────────────────────────────────

export const validationStatusSchema = z.object({
  label: z.string().min(1, "Libellé requis").max(100),
  bg: z.string().max(20).default("#f1f5f9"),
  color: z.string().max(20).default("#64748b"),
});

// ─── CV Summary ──────────────────────────────────────────────────────────────

export const cvSummarySchema = z.object({
  candidateId: z.coerce.number().int().positive("Candidat requis"),
});

// ─── Partners ────────────────────────────────────────────────────────────

export const partnerCreateSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide").max(100),
  password: strongPassword,
  company: z.string().max(100).default(""),
  phone: z.string().max(50).default(""),
});

export const partnerUpdateSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide").max(100),
  company: z.string().max(100).default(""),
  phone: z.string().max(50).default(""),
  password: strongPassword.optional(),
});

export const partnerLoginSchema = z.object({
  email: z.string().email("Email requis").max(100),
  password: z.string().min(1, "Mot de passe requis").max(200),
});

export const partnerSubmitSchema = z.object({
  missionId: z.coerce.number().int().positive("Mission requise"),
  name: z.string().min(1, "Nom du candidat requis").max(100),
  email: z.string().max(100).default(""),
  phone: z.string().max(50).default(""),
  summary: z.string().max(5000).default(""),
  fileName: z.string().min(1, "Nom du fichier requis").max(200),
  fileData: z.string().min(1, "CV requis"),
});

export const partnerMissionSchema = z.object({
  missionId: z.coerce.number().int().positive("Mission requise"),
});
