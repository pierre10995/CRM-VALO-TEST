import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { contactId, missionId, fileType, fileName, mimeType, fileData } = req.body;
    if ((!contactId && !missionId) || !fileType || !fileName || !fileData) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }
    const { rows } = await pool.query(
      `INSERT INTO files (contact_id, mission_id, file_type, file_name, mime_type, file_data)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, contact_id, mission_id, file_type, file_name, mime_type, created_at`,
      [contactId || null, missionId || null, fileType, fileName, mimeType || "application/pdf", fileData]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/contact/:contactId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, contact_id, file_type, file_name, mime_type, created_at FROM files WHERE contact_id=$1 ORDER BY created_at DESC",
      [req.params.contactId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/mission/:missionId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, mission_id, file_type, file_name, mime_type, created_at FROM files WHERE mission_id=$1 ORDER BY created_at DESC",
      [req.params.missionId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM files WHERE id=$1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Fichier non trouvé" });
    const file = rows[0];
    const buffer = Buffer.from(file.file_data, "base64");
    res.setHeader("Content-Type", file.mime_type);
    res.setHeader("Content-Disposition", `attachment; filename="${file.file_name}"`);
    res.send(buffer);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM files WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
