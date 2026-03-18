import { Router } from "express";
import { pool } from "../db.js";
import { fmtObjective } from "../formatters.js";
import { validate } from "../validators/validate.js";
import { objectiveCreateSchema, objectiveUpdateSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT o.*, u.full_name as user_name, fy.label as fiscal_year_label
    FROM objectives o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN fiscal_years fy ON o.fiscal_year_id = fy.id
    ORDER BY o.fiscal_year_id DESC NULLS LAST, o.year DESC, o.month ASC NULLS FIRST, o.user_id
  `);
  res.json(rows.map(fmtObjective));
}));

router.post("/", validate(objectiveCreateSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `INSERT INTO objectives (user_id, period, year, month, target_new_clients, target_ca, target_total, notes, fiscal_year_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (user_id, period, year, month) DO UPDATE SET target_new_clients=$5, target_ca=$6, target_total=$7, notes=$8, fiscal_year_id=$9
     RETURNING *`,
    [d.userId, d.period, d.year, d.month, d.targetNewClients, d.targetCA, d.targetTotal, d.notes, d.fiscalYearId]
  );
  res.json(fmtObjective(rows[0]));
}));

router.put("/:id", validate(objectiveUpdateSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    `UPDATE objectives SET target_new_clients=$1, target_ca=$2, target_total=$3, notes=$4 WHERE id=$5 RETURNING *`,
    [d.targetNewClients, d.targetCA, d.targetTotal, d.notes, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Objectif non trouvé" });
  res.json(fmtObjective(rows[0]));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM objectives WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
}));

export default router;
