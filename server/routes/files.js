import { Router } from "express";
import { pool } from "../db.js";
import { config } from "../config.js";
import { validate } from "../validators/validate.js";
import { fileUploadSchema } from "../validators/schemas.js";
import { asyncHandler, AppError } from "../helpers/errors.js";
import { sanitizeFileName } from "../helpers/sanitize.js";

const router = Router();

router.post("/", validate(fileUploadSchema), asyncHandler(async (req, res) => {
  const { contactId, missionId, fileType, fileName, mimeType, fileData } = req.body;

  if (!contactId && !missionId) {
    throw new AppError(400, "contactId ou missionId requis");
  }

  if (fileData.length > config.limits.maxFileSize) {
    throw new AppError(400, "Fichier trop volumineux (max 6 Mo)");
  }

  const safeName = sanitizeFileName(fileName);

  const { rows } = await pool.query(
    `INSERT INTO files (contact_id, mission_id, file_type, file_name, mime_type, file_data)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, contact_id, mission_id, file_type, file_name, mime_type, created_at`,
    [contactId || null, missionId || null, fileType, safeName, mimeType, fileData]
  );
  res.status(201).json(rows[0]);
}));

router.get("/contact/:contactId", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, contact_id, file_type, file_name, mime_type, created_at FROM files WHERE contact_id=$1 ORDER BY created_at DESC",
    [req.params.contactId]
  );
  res.json(rows);
}));

router.get("/mission/:missionId", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, mission_id, file_type, file_name, mime_type, created_at FROM files WHERE mission_id=$1 ORDER BY created_at DESC",
    [req.params.missionId]
  );
  res.json(rows);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM files WHERE id=$1", [req.params.id]);
  if (rows.length === 0) throw new AppError(404, "Fichier non trouvé");

  const file = rows[0];
  const buffer = Buffer.from(file.file_data, "base64");
  const safeName = sanitizeFileName(file.file_name);
  res.setHeader("Content-Type", file.mime_type);
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
  res.send(buffer);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM files WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
}));

export default router;
