import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { authMiddleware, JWT_SECRET } from "../server/middleware.js";

function mockReqResNext(authHeader) {
  const req = { headers: { authorization: authHeader } };
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) };
  const next = vi.fn();
  return { req, res, next };
}

describe("authMiddleware", () => {
  it("rejects request without Authorization header", () => {
    const { req, res, next } = mockReqResNext(undefined);
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Non autorisé" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects request with invalid token format", () => {
    const { req, res, next } = mockReqResNext("InvalidToken");
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects request with expired/invalid JWT", () => {
    const { req, res, next } = mockReqResNext("Bearer invalid.jwt.token");
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Session expirée, veuillez vous reconnecter" });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows request with valid JWT", () => {
    const token = jwt.sign({ id: 1, username: "admin" }, JWT_SECRET, { expiresIn: "1h" });
    const { req, res, next } = mockReqResNext(`Bearer ${token}`);
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(1);
    expect(req.user.username).toBe("admin");
  });
});
