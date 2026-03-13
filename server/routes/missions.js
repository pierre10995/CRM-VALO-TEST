import { Router } from "express";
import { pool } from "../db.js";
import { fmtMission } from "../formatters.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, c.name as client_name, u.full_name as assigned_name, fy.label as fiscal_year_label,
        (SELECT COUNT(*) FROM candidatures WHERE mission_id = m.id) as candidature_count
      FROM missions m
      LEFT JOIN contacts c ON m.client_contact_id = c.id
      LEFT JOIN users u ON m.assigned_to = u.id
      LEFT JOIN fiscal_years fy ON m.fiscal_year_id = fy.id
      ORDER BY m.created_at DESC
    `);
    res.json(rows.map(fmtMission));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", async (req, res) => {
  const { title, clientContactId, company, location, contractType, salaryMin, salaryMax, description, requirements, status, priority, assignedTo, commission, deadline, fiscalYearId, workMode } = req.body;
  if (!title || !company) return res.status(400).json({ error: "Titre et entreprise requis" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO missions (title, client_contact_id, company, location, contract_type, salary_min, salary_max, description, requirements, status, priority, assigned_to, commission, deadline, fiscal_year_id, work_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [title, clientContactId || null, company, location || "", contractType || "CDI", Number(salaryMin) || 0, Number(salaryMax) || 0, description || "", requirements || "", status || "Ouverte", priority || "Normale", assignedTo || null, Number(commission) || 0, deadline || null, fiscalYearId || null, workMode || ""]
    );
    res.json(fmtMission(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  const { title, clientContactId, company, location, contractType, salaryMin, salaryMax, description, requirements, status, priority, assignedTo, commission, deadline, fiscalYearId, workMode } = req.body;
  if (!title || !company) return res.status(400).json({ error: "Titre et entreprise requis" });
  try {
    const { rows } = await pool.query(
      `UPDATE missions SET title=$1, client_contact_id=$2, company=$3, location=$4, contract_type=$5, salary_min=$6, salary_max=$7, description=$8, requirements=$9, status=$10, priority=$11, assigned_to=$12, commission=$13, deadline=$14, fiscal_year_id=$15, work_mode=$16 WHERE id=$17 RETURNING *`,
      [title, clientContactId || null, company, location || "", contractType || "CDI", Number(salaryMin) || 0, Number(salaryMax) || 0, description || "", requirements || "", status || "Ouverte", priority || "Normale", assignedTo || null, Number(commission) || 0, deadline || null, fiscalYearId || null, workMode || "", req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Mission non trouvée" });

    // Auto-create placements when mission status changes to "Gagné"
    if (status === "Gagné") {
      const { rows: placedCandidatures } = await pool.query(
        `SELECT cd.id, cd.candidate_id, cd.mission_id, m.company
         FROM candidatures cd JOIN missions m ON cd.mission_id = m.id
         WHERE cd.mission_id = $1 AND cd.stage = 'Placé'`, [req.params.id]
      );
      for (const cd of placedCandidatures) {
        const { rows: existing } = await pool.query("SELECT 1 FROM placements WHERE candidature_id = $1", [cd.id]);
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO placements (candidature_id, candidate_id, mission_id, company) VALUES ($1,$2,$3,$4)`,
            [cd.id, cd.candidate_id, cd.mission_id, cd.company || company]
          );
        }
      }
    }

    res.json(fmtMission(rows[0]));
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try { await pool.query("DELETE FROM missions WHERE id = $1", [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
