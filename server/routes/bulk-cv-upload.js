import { Router } from "express";
import { pool } from "../db.js";
import { config } from "../config.js";
import { fmtContact } from "../formatters.js";
import { asyncHandler, AppError } from "../helpers/errors.js";
import { logger } from "../helpers/logger.js";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

function extractNameFromFileName(fileName) {
  const base = fileName.replace(/\.pdf$/i, "").trim();
  const match = base.match(/VALO\s*[-–]\s*(.+?)\s*(?:[-–]\s*CV)?$/i);
  if (match) return match[1].trim();
  return "";
}

async function extractInfoFromCV(text, fileNameHint) {
  if (!config.anthropic.apiKey) {
    throw new Error("Clé API Anthropic manquante");
  }

  const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: `Extrais les informations suivantes de ce CV. Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de backticks).
${fileNameHint ? `\nINDICE - Le fichier s'appelle "${fileNameHint}", ce qui peut aider à identifier le nom du candidat.\n` : ""}
CONTENU DU CV:
${text.slice(0, 4000)}

Réponds avec ce format exact:
{
  "name": "<Prénom Nom complet>",
  "email": "<adresse email ou vide>",
  "phone": "<numéro de téléphone ou vide>",
  "city": "<ville de résidence ou vide>",
  "target_position": "<poste actuel ou recherché ou vide>",
  "skills": "<liste de compétences clés séparées par des virgules, max 8>",
  "linkedin": "<URL LinkedIn si présente ou vide>"
}` }]
  });

  const text2 = message.content[0].text.trim();
  try {
    return JSON.parse(text2);
  } catch {
    const m = text2.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
}

router.post("/bulk-cv-upload", asyncHandler(async (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new AppError(400, "Aucun fichier fourni");
  }
  if (files.length > config.limits.maxBulkFiles) {
    throw new AppError(400, `Maximum ${config.limits.maxBulkFiles} fichiers par import`);
  }

  const results = [];

  for (const file of files) {
    const { fileName, fileData } = file;
    try {
      const buffer = Buffer.from(fileData, "base64");
      const pdf = await pdfParse(buffer);
      const text = pdf.text || "";

      if (!text.trim()) {
        results.push({ fileName, status: "error", error: "PDF sans texte exploitable" });
        continue;
      }

      const fileNameHint = extractNameFromFileName(fileName);
      const info = await extractInfoFromCV(text, fileName);
      if (!info || (!info.name && !fileNameHint)) {
        results.push({ fileName, status: "error", error: "Impossible d'extraire les informations" });
        continue;
      }

      const name = info.name || fileNameHint || fileName.replace(/\.pdf$/i, "");
      const email = info.email || "";

      if (email) {
        const { rows: existing } = await pool.query(
          "SELECT id FROM contacts WHERE LOWER(email) = LOWER($1)", [email]
        );
        if (existing.length > 0) {
          results.push({ fileName, status: "duplicate", name, email, existingId: existing[0].id });
          continue;
        }
      }

      const { rows: contactRows } = await pool.query(
        `INSERT INTO contacts (name, company, email, phone, status, sector, revenue, notes, city, linkedin, skills, salary_expectation, availability, validation_status, target_position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        [name, "", email, info.phone || "", "Candidat", "", 0, "", info.city || "", info.linkedin || "", info.skills || "", 0, "", "", info.target_position || ""]
      );

      await pool.query(
        `INSERT INTO files (contact_id, file_type, file_name, mime_type, file_data)
         VALUES ($1,$2,$3,$4,$5)`,
        [contactRows[0].id, "cv", fileName, "application/pdf", fileData]
      );

      results.push({ fileName, status: "created", contact: fmtContact(contactRows[0]) });
    } catch (fileErr) {
      logger.error("Erreur traitement CV bulk", { fileName, error: fileErr.message });
      results.push({ fileName, status: "error", error: "Erreur lors du traitement du fichier" });
    }
  }

  res.json({
    total: files.length,
    created: results.filter(r => r.status === "created").length,
    duplicates: results.filter(r => r.status === "duplicate").length,
    errors: results.filter(r => r.status === "error").length,
    results,
  });
}));

export default router;
