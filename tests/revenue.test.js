import { describe, it, expect } from "vitest";
import { WON_STATUS, isWonMission, wonMissionsForFY, sumCommission, sumRecruiterCommission, findCurrentFY } from "../src/utils/revenue.js";

const missions = [
  { id: 1, status: "Gagné", commission: 8000, recruiterCommission: 1000, fiscalYearId: 2 },
  { id: 2, status: "Gagné", commission: 6000, recruiterCommission: 0, fiscalYearId: 3 },
  { id: 3, status: "Ouverte", commission: 9000, recruiterCommission: 500, fiscalYearId: 3 },
  { id: 4, status: "Pourvue", commission: 4000, recruiterCommission: 0, fiscalYearId: 3 },
  { id: 5, status: "Gagné", commission: 0, recruiterCommission: 0, fiscalYearId: null },
];

describe("revenue — règle unique du CA", () => {
  it("seules les missions « Gagné » comptent", () => {
    expect(WON_STATUS).toBe("Gagné");
    expect(isWonMission({ status: "Gagné" })).toBe(true);
    expect(isWonMission({ status: "Pourvue" })).toBe(false);
    expect(wonMissionsForFY(missions).map(m => m.id)).toEqual([1, 2, 5]);
  });

  it("filtre par année fiscale (id numérique ou chaîne)", () => {
    expect(wonMissionsForFY(missions, 3).map(m => m.id)).toEqual([2]);
    expect(wonMissionsForFY(missions, "3").map(m => m.id)).toEqual([2]);
    expect(wonMissionsForFY(missions, "all").map(m => m.id)).toEqual([1, 2, 5]);
    expect(wonMissionsForFY(missions, null).map(m => m.id)).toEqual([1, 2, 5]);
  });

  it("somme les commissions VALO et recruteurs", () => {
    const won = wonMissionsForFY(missions);
    expect(sumCommission(won)).toBe(14000);
    expect(sumRecruiterCommission(won)).toBe(1000);
    expect(sumCommission([])).toBe(0);
    expect(sumCommission(undefined)).toBe(0);
  });

  it("ne compte pas deux fois une mission avec plusieurs placés", () => {
    // Le CA est porté par la mission, pas par les candidatures
    expect(sumCommission(wonMissionsForFY([missions[0], missions[0]]))).toBe(16000);
    expect(sumCommission(wonMissionsForFY([missions[0]]))).toBe(8000);
  });
});

describe("findCurrentFY", () => {
  const fys = [
    { id: 1, label: "Année 1", startDate: "2024-05-06", endDate: "2025-04-30" },
    { id: 2, label: "Année 2", startDate: "2025-05-01", endDate: "2026-04-30" },
    { id: 3, label: "Année 3", startDate: "2026-05-01", endDate: "2027-04-30" },
  ];

  it("trouve l'année couvrant une date", () => {
    expect(findCurrentFY(fys, new Date("2026-04-15T12:00:00")).id).toBe(2);
    expect(findCurrentFY(fys, new Date("2026-09-14T12:00:00")).id).toBe(3);
  });

  it("bornes inclusives et absence de couverture", () => {
    expect(findCurrentFY(fys, new Date("2025-05-01T12:00:00")).id).toBe(2);
    expect(findCurrentFY(fys, new Date("2030-01-01T12:00:00"))).toBeNull();
    expect(findCurrentFY([], new Date())).toBeNull();
    expect(findCurrentFY(undefined, new Date())).toBeNull();
  });
});
