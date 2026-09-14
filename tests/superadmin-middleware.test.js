import { describe, it, expect, vi } from "vitest";
import { adminOnly, superAdminOnly } from "../server/middleware.js";

function ctx(user) {
  const req = { user, headers: {}, cookies: {} };
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) };
  const next = vi.fn();
  return { req, res, next };
}

describe("hiérarchie des rôles", () => {
  it("adminOnly accepte admin ET superadmin", () => {
    for (const role of ["admin", "superadmin"]) {
      const { req, res, next } = ctx({ id: 1, userRole: role });
      adminOnly(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it("adminOnly refuse user et absence de rôle", () => {
    for (const user of [{ id: 1, userRole: "user" }, { id: 1 }, undefined]) {
      const { req, res, next } = ctx(user);
      adminOnly(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    }
  });

  it("superAdminOnly accepte uniquement superadmin", () => {
    const ok = ctx({ id: 1, userRole: "superadmin" });
    superAdminOnly(ok.req, ok.res, ok.next);
    expect(ok.next).toHaveBeenCalled();

    for (const role of ["admin", "user", undefined]) {
      const { req, res, next } = ctx({ id: 2, userRole: role });
      superAdminOnly(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Accès réservé au super administrateur" });
      expect(next).not.toHaveBeenCalled();
    }
  });

  it("superAdminOnly ne se laisse pas tromper par un rôle partenaire", () => {
    const { req, res, next } = ctx({ id: 9, role: "partner", userRole: undefined });
    superAdminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
