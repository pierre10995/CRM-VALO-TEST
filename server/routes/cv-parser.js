import { Router } from "express";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const router = Router();

function extractEmail(text) {
  const match = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  return match ? match[0] : "";
}

function extractPhone(text) {
  // Formats: +1 514 555 0000, (514) 555-0000, 514.555.0000, 5145550000, etc.
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
  // Take the first non-empty line that looks like a name (2-4 words, no special chars)
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    // Skip lines that look like addresses, emails, phones, URLs
    if (line.includes("@") || line.match(/\d{3}/) || line.includes("http") || line.includes("www")) continue;
    // A name is typically 2-4 words, only letters/accents/hyphens
    const cleaned = line.replace(/[,|·•:]/g, " ").trim();
    const words = cleaned.split(/\s+/).filter(w => /^[A-Za-zÀ-ÖØ-öø-ÿ'-]+$/.test(w));
    if (words.length >= 2 && words.length <= 4) {
      return words.join(" ");
    }
  }
  return "";
}

router.post("/parse-cv", async (req, res) => {
  try {
    const { fileData } = req.body;
    if (!fileData) return res.status(400).json({ error: "fileData (base64) requis" });

    const buffer = Buffer.from(fileData, "base64");
    const pdf = await pdfParse(buffer);
    const text = pdf.text || "";

    const name = extractName(text);
    const email = extractEmail(text);
    const phone = extractPhone(text);

    // Try to split name into first/last
    const parts = name.split(/\s+/);
    let firstName = "";
    let lastName = "";
    if (parts.length >= 2) {
      // If first part is ALL CAPS, it's likely the last name (French CV convention)
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

    // Build a full name in "Prénom Nom" format
    const fullName = firstName && lastName
      ? `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()} ${lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()}`
      : name;

    res.json({ name: fullName, email, phone });
  } catch (err) {
    console.error("CV parse error:", err);
    res.status(500).json({ error: "Erreur lors de l'analyse du CV" });
  }
});

export default router;
