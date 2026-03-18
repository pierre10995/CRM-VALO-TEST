import { Router } from "express";
import { pool } from "../db.js";
import { fmtContact } from "../formatters.js";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

async function extractInfoFromCV(text) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Clé API Anthropic manquante");
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: `Extrais les informations suivantes de ce CV. Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de backticks).

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

router.post("/bulk-cv-upload", async (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "Aucun fichier fourni" });
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

        // Use AI to extract info
        const info = await extractInfoFromCV(text);
        if (!info || !info.name) {
          results.push({ fileName, status: "error", error: "Impossible d'extraire les informations" });
          continue;
        }

        const name = info.name;
        const email = info.email || "";
        const phone = info.phone || "";
        const city = info.city || "";
        const targetPosition = info.target_position || "";
        const skills = info.skills || "";
        const linkedin = info.linkedin || "";

        // Check for duplicate by email
        if (email) {
          const { rows: existing } = await pool.query(
            "SELECT id FROM contacts WHERE LOWER(email) = LOWER($1)",
            [email]
          );
          if (existing.length > 0) {
            results.push({ fileName, status: "duplicate", name, email, existingId: existing[0].id });
            continue;
          }
        }

        // Create the contact
        const { rows: contactRows } = await pool.query(
          `INSERT INTO contacts (name, company, email, phone, status, sector, revenue, notes, city, linkedin, skills, salary_expectation, availability, validation_status, target_position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
          [name, "", email, phone, "Candidat", "", 0, "", city, linkedin, skills, 0, "", "", targetPosition]
        );
        const contact = contactRows[0];

        // Store the CV file
        await pool.query(
          `INSERT INTO files (contact_id, file_type, file_name, mime_type, file_data)
           VALUES ($1,$2,$3,$4,$5)`,
          [contact.id, "cv", fileName, "application/pdf", fileData]
        );

        results.push({ fileName, status: "created", contact: fmtContact(contact) });
      } catch (fileErr) {
        console.error(`Error processing ${fileName}:`, fileErr.message);
        results.push({ fileName, status: "error", error: fileErr.message });
      }
    }

    res.json({
      total: files.length,
      created: results.filter(r => r.status === "created").length,
      duplicates: results.filter(r => r.status === "duplicate").length,
      errors: results.filter(r => r.status === "error").length,
      results,
    });
  } catch (err) {
    console.error("Bulk CV upload error:", err);
    res.status(500).json({ error: "Erreur lors de l'import en masse" });
  }
});

export default router;
