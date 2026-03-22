import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { adminOnly, authMiddleware, JWT_SECRET, partnerAuthMiddleware } from "../server/middleware.js";

function mockReqResNext(opts = {}) {
  const req = {
    headers: { authorization: opts.authHeader },
    cookies: opts.cookies || {},
    user: opts.user || undefined,
  };
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
    clearCookie: vi.fn(),
    cookie: vi.fn(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe("adminOnly middleware", () => {
  it("allows pierre@valo-inno.com", () => {
    const { req, res, next } = mockReqResNext();
    req.user = { id: 1, login: "pierre@valo-inno.com" };
    adminOnly(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects other internal users", () => {
    const { req, res, next } = mockReqResNext();
    req.user = { id: 2, login: "oceane@valo-inno.com" };
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Accès réservé à l'administrateur" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects when no user on request", () => {
    const { req, res, next } = mockReqResNext();
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects partner users", () => {
    const { req, res, next } = mockReqResNext();
    req.user = { id: 5, login: "partner@external.com", role: "partner" };
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects empty login", () => {
    const { req, res, next } = mockReqResNext();
    req.user = { id: 1, login: "" };
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("authMiddleware blocks partners", () => {
  it("rejects partner role tokens on internal routes", () => {
    const token = jwt.sign({ id: 1, email: "p@test.com", role: "partner" }, JWT_SECRET, { expiresIn: "1h" });
    const { req, res, next } = mockReqResNext({ authHeader: `Bearer ${token}` });
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Accès réservé aux utilisateurs internes" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("partnerAuthMiddleware", () => {
  it("allows partner tokens", () => {
    const token = jwt.sign({ id: 1, email: "p@test.com", role: "partner" }, JWT_SECRET, { expiresIn: "1h" });
    const { req, res, next } = mockReqResNext({ authHeader: `Bearer ${token}` });
    partnerAuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.partner.role).toBe("partner");
  });

  it("rejects non-partner tokens", () => {
    const token = jwt.sign({ id: 1, login: "admin@test.com" }, JWT_SECRET, { expiresIn: "1h" });
    const { req, res, next } = mockReqResNext({ authHeader: `Bearer ${token}` });
    partnerAuthMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Accès réservé aux partenaires" });
  });

  it("rejects missing token", () => {
    const { req, res, next } = mockReqResNext();
    partnerAuthMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects expired token", () => {
    const token = jwt.sign({ id: 1, role: "partner" }, JWT_SECRET, { expiresIn: "-1s" });
    const { req, res, next } = mockReqResNext({ authHeader: `Bearer ${token}` });
    partnerAuthMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
