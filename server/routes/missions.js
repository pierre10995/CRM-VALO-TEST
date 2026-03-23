import { Router } from "express";
import { pool } from "../db.js";
import { fmtMission } from "../formatters.js";
import { validate } from "../validators/validate.js";
import { missionSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
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
}));

router.post("/", validate(missionSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `INSERT INTO missions (title, client_contact_id, company, location, contract_type, salary_min, salary_max, description, requirements, status, priority, assigned_to, commission, deadline, fiscal_year_id, work_mode, partner_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    [d.title, d.clientContactId, d.company, d.location, d.contractType, d.salaryMin, d.salaryMax, d.description, d.requirements, d.status, d.priority, d.assignedTo, d.commission, d.deadline, d.fiscalYearId, d.workMode, d.partnerNotes]
  );
  await pool.query(
    "INSERT INTO audit_log (user_name, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
    [req.user?.login || "Système", "Création", "mission", rows[0].id, d.title]
  );
  res.json(fmtMission(rows[0]));
}));

router.put("/:id", validate(missionSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `UPDATE missions SET title=$1, client_contact_id=$2, company=$3, location=$4, contract_type=$5, salary_min=$6, salary_max=$7, description=$8, requirements=$9, status=$10, priority=$11, assigned_to=$12, commission=$13, deadline=$14, fiscal_year_id=$15, work_mode=$16, partner_notes=$17 WHERE id=$18 RETURNING *`,
    [d.title, d.clientContactId, d.company, d.location, d.contractType, d.salaryMin, d.salaryMax, d.description, d.requirements, d.status, d.priority, d.assignedTo, d.commission, d.deadline, d.fiscalYearId, d.workMode, d.partnerNotes, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Mission non trouvée" });

  if (d.status === "Gagné") {
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
          [cd.id, cd.candidate_id, cd.mission_id, cd.company || d.company]
        );
      }
    }
  }

  await pool.query(
    "INSERT INTO audit_log (user_name, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)",
    [req.user?.login || "Système", "Modification", "mission", parseInt(req.params.id), d.title]
  );
  res.json(fmtMission(rows[0]));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM missions WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

export default router;
