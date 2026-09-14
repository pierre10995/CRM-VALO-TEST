/**
 * Matrice rôles × routes sensibles — tests d'intégration Express avec la base
 * et Supabase mockés. Vérifie les garde-fous introduits par l'audit :
 * placements (facturation) réservés aux admins, journal d'audit complet
 * réservé au super admin, protection du compte super admin.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const queryMock = vi.fn();
vi.mock("../server/db.js", () => ({
  pool: { query: (...args) => queryMock(...args), on: () => {} },
  initDB: vi.fn(),
}));
vi.mock("../server/supabase.js", () => ({
  supabaseAdmin: { auth: { admin: { updateUserById: vi.fn(async () => ({ error: null })), deleteUser: vi.fn(async () => ({})), createUser: vi.fn() } } },
  supabaseClient: { auth: { signInWithPassword: vi.fn() } },
}));

const { authMiddleware, JWT_SECRET } = await import("../server/middleware.js");
const { config } = await import("../server/config.js");
const placementsRouter = (await import("../server/routes/placements.js")).default;
const statsRouter = (await import("../server/routes/stats.js")).default;
const { errorMiddleware } = await import("../server/helpers/errors.js");

let server, base;

beforeAll(async () => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api", authMiddleware);
  app.use("/api/placements", placementsRouter);
  app.use("/api", statsRouter);
  app.use(errorMiddleware);
  await new Promise(resolve => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise(resolve => server.close(resolve)));

beforeEach(() => {
  queryMock.mockReset();
  queryMock.mockResolvedValue({ rows: [], rowCount: 0 });
});

const cookieFor = (role, id = 1) =>
  `${config.jwt.cookieName}=${jwt.sign({ id, login: `${role}@valo-inno.com`, userRole: role }, JWT_SECRET, { expiresIn: "1h" })}`;

const call = (method, path, role, body) =>
  fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(role ? { Cookie: cookieFor(role) } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

describe("placements (facturation)", () => {
  const payload = { candidateId: 1, missionId: 2 };

  it("anonyme → 401", async () => {
    expect((await call("POST", "/api/placements", null, payload)).status).toBe(401);
  });

  it("user → 403 sur POST/PUT/DELETE, 200 sur GET", async () => {
    expect((await call("POST", "/api/placements", "user", payload)).status).toBe(403);
    expect((await call("PUT", "/api/placements/1", "user", {})).status).toBe(403);
    expect((await call("DELETE", "/api/placements/1", "user")).status).toBe(403);
    expect((await call("GET", "/api/placements", "user")).status).toBe(200);
  });

  it("admin → peut créer", async () => {
    queryMock.mockResolvedValue({ rows: [{ id: 10, candidate_id: 1, mission_id: 2 }], rowCount: 1 });
    const res = await call("POST", "/api/placements", "admin", payload);
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(10);
  });

  it("supprimer un placement inexistant → 404", async () => {
    expect((await call("DELETE", "/api/placements/999", "superadmin")).status).toBe(404);
  });
});

describe("journal d'audit", () => {
  it("historique d'une entité : admin OK, user refusé", async () => {
    expect((await call("GET", "/api/audit-log?entityType=contact&entityId=5", "admin")).status).toBe(200);
    expect((await call("GET", "/api/audit-log?entityType=contact&entityId=5", "user")).status).toBe(403);
  });

  it("journal complet : superadmin uniquement", async () => {
    expect((await call("GET", "/api/audit-log", "admin")).status).toBe(403);
    expect((await call("GET", "/api/audit-log", "superadmin")).status).toBe(200);
  });

  it("entityId non numérique → 400", async () => {
    expect((await call("GET", "/api/audit-log?entityType=contact&entityId=abc", "admin")).status).toBe(400);
  });

  it("POST /audit-log n'existe plus (journal non falsifiable)", async () => {
    expect((await call("POST", "/api/audit-log", "superadmin", { action: "x", entityType: "y" })).status).toBe(404);
  });
});

describe("protection du compte super admin", () => {
  const superTarget = { rows: [{ id: 5, auth_id: null, login: "pierre@valo-inno.com", role: "superadmin" }], rowCount: 1 };

  it("un admin ne peut pas modifier un super admin (403)", async () => {
    queryMock.mockResolvedValue(superTarget);
    const res = await call("PUT", "/api/users/5", "admin", { fullName: "X", login: "pierre@valo-inno.com" });
    expect(res.status).toBe(403);
  });

  it("un super admin peut modifier un super admin", async () => {
    queryMock.mockImplementation(async (sql) => {
      if (/^SELECT id, auth_id, login, role/.test(sql)) return superTarget;
      if (/^UPDATE users SET full_name/.test(sql)) return { rows: [{ id: 5, login: "pierre@valo-inno.com", full_name: "Pierre", role: "superadmin" }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    const res = await call("PUT", "/api/users/5", "superadmin", { fullName: "Pierre", login: "pierre@valo-inno.com" });
    expect(res.status).toBe(200);
  });

  it("changement de rôle et suppression : super admin uniquement", async () => {
    expect((await call("PUT", "/api/users/5/role", "admin", { role: "user" })).status).toBe(403);
    expect((await call("DELETE", "/api/users/5", "admin")).status).toBe(403);
    expect((await call("PUT", "/api/users/5/role", "superadmin", { role: "banana" })).status).toBe(400);
  });
});
