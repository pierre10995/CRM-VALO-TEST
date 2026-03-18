import { Router } from "express";
import { pool } from "../db.js";
import { fmtContact } from "../formatters.js";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const router = Router();

function extractEmail(text) {
  const match = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  return match ? match[0] : "";
}

function extractPhone(text) {
  const patterns = [
    /\+?\d[\d\s\-().]{7,}\d/,
    /\(\d{3}\)\s?\d{3}[.-]\d{4}/,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) return match[0].trim();
  }
  return "";
}

function extractName(text) {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (line.includes("@") || line.match(/\d{3}/) || line.includes("http") || line.includes("www")) continue;
    const cleaned = line.replace(/[,|·•:]/g, " ").trim();
    const words = cleaned.split(/\s+/).filter(w => /^[A-Za-zÀ-ÖØ-öø-ÿ'-]+$/.test(w));
    if (words.length >= 2 && words.length <= 4) {
      return words.join(" ");
    }
  }
  return "";
}

function formatName(name) {
  const parts = name.split(/\s+/);
  let firstName = "", lastName = "";
  if (parts.length >= 2) {
    if (parts[0] === parts[0].toUpperCase() && parts[0].length > 1) {
      lastName = parts[0];
      firstName = parts.slice(1).join(" ");
    } else {
      firstName = parts[0];
      lastName = parts.slice(1).join(" ");
    }
  } else {
    firstName = name;
  }
  if (firstName && lastName) {
    return `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()} ${lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()}`;
  }
  return name;
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

        const rawName = extractName(text);
        const name = formatName(rawName) || fileName.replace(/\.pdf$/i, "");
        const email = extractEmail(text);
        const phone = extractPhone(text);

        // Check for duplicate by email (if we found one)
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
          [name, "", email, phone, "Candidat", "Tech", 0, "", "", "", "", 0, "", "", ""]
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
