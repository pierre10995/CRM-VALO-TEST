import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { authMiddleware, JWT_SECRET, signTokenAndSetCookie } from "../server/middleware.js";

function mockReqResNext(opts = {}) {
  const req = {
    headers: { authorization: opts.authHeader },
    cookies: opts.cookies || {},
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

describe("authMiddleware", () => {
  it("rejects request without any token", () => {
    const { req, res, next } = mockReqResNext();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Non autorisé" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid Authorization header format", () => {
    const { req, res, next } = mockReqResNext({ authHeader: "InvalidToken" });
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects expired/invalid JWT from header", () => {
    const { req, res, next } = mockReqResNext({ authHeader: "Bearer invalid.jwt.token" });
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Session expirée, veuillez vous reconnecter" });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows request with valid JWT from header", () => {
    const token = jwt.sign({ id: 1, login: "admin" }, JWT_SECRET, { expiresIn: "1h" });
    const { req, res, next } = mockReqResNext({ authHeader: `Bearer ${token}` });
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(1);
  });

  it("allows request with valid JWT from cookie", () => {
    const token = jwt.sign({ id: 2, login: "user" }, JWT_SECRET, { expiresIn: "1h" });
    const { req, res, next } = mockReqResNext({ cookies: { crm_token: token } });
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(2);
  });

  it("prioritizes cookie over header", () => {
    const cookieToken = jwt.sign({ id: 10, login: "cookie" }, JWT_SECRET, { expiresIn: "1h" });
    const headerToken = jwt.sign({ id: 20, login: "header" }, JWT_SECRET, { expiresIn: "1h" });
    const { req, res, next } = mockReqResNext({
      cookies: { crm_token: cookieToken },
      authHeader: `Bearer ${headerToken}`,
    });
    authMiddleware(req, res, next);
    expect(req.user.id).toBe(10);
  });

  it("rejects token signed with wrong secret", () => {
    const token = jwt.sign({ id: 1 }, "wrong-secret", { expiresIn: "1h" });
    const { req, res, next } = mockReqResNext({ authHeader: `Bearer ${token}` });
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects expired token", () => {
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: "-1s" });
    const { req, res, next } = mockReqResNext({ authHeader: `Bearer ${token}` });
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("clears cookie on invalid token", () => {
    const { req, res, next } = mockReqResNext({ cookies: { crm_token: "bad" } });
    authMiddleware(req, res, next);
    expect(res.clearCookie).toHaveBeenCalledWith("crm_token");
  });
});

describe("signTokenAndSetCookie", () => {
  it("sets httpOnly cookie and returns token", () => {
    const res = { cookie: vi.fn() };
    const token = signTokenAndSetCookie(res, { id: 1, login: "test" });
    expect(typeof token).toBe("string");
    expect(res.cookie).toHaveBeenCalled();
    const args = res.cookie.mock.calls[0];
    expect(args[0]).toBe("crm_token");
    expect(args[2].httpOnly).toBe(true);
    expect(args[2].sameSite).toBe("strict");
  });

  it("returns a decodable JWT", () => {
    const res = { cookie: vi.fn() };
    const token = signTokenAndSetCookie(res, { id: 42, login: "foo" });
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.id).toBe(42);
    expect(decoded.login).toBe("foo");
  });
});
