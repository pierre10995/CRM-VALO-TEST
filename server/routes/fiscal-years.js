import { Router } from "express";
import { pool } from "../db.js";
import { validate } from "../validators/validate.js";
import { fiscalYearSchema } from "../validators/schemas.js";
import { asyncHandler } from "../helpers/errors.js";

const router = Router();

const fmt = (r) => ({ id: r.id, label: r.label, startDate: r.start_date, endDate: r.end_date, target: Number(r.target) });

router.get("/", asyncHandler(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM fiscal_years ORDER BY start_date ASC");
  res.json(rows.map(fmt));
}));

router.post("/", validate(fiscalYearSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    "INSERT INTO fiscal_years (label, start_date, end_date, target) VALUES ($1,$2,$3,$4) RETURNING *",
    [d.label, d.startDate, d.endDate, d.target]
  );
  res.json(fmt(rows[0]));
}));

router.put("/:id", validate(fiscalYearSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(
    "UPDATE fiscal_years SET label=$1, start_date=$2, end_date=$3, target=$4 WHERE id=$5 RETURNING *",
    [d.label, d.startDate, d.endDate, d.target, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Année non trouvée" });
  res.json(fmt(rows[0]));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM fiscal_years WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
}));

export default router;
