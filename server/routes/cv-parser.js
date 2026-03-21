import { Router } from "express";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { asyncHandler, AppError } from "../helpers/errors.js";

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

router.post("/parse-cv", asyncHandler(async (req, res) => {
  const { fileData } = req.body;
  if (!fileData) throw new AppError(400, "fileData (base64) requis");

  const buffer = Buffer.from(fileData, "base64");
  const pdf = await pdfParse(buffer);
  const text = pdf.text || "";

  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);

  const parts = name.split(/\s+/);
  let firstName = "";
  let lastName = "";
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

  const fullName = firstName && lastName
    ? `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()} ${lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()}`
    : name;

  res.json({ name: fullName, email, phone });
}));

export default router;
