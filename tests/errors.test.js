import { describe, it, expect, vi } from "vitest";
import { AppError, asyncHandler, errorMiddleware } from "../server/helpers/errors.js";

describe("AppError", () => {
  it("creates error with status code and message", () => {
    const err = new AppError(404, "Not found");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err instanceof Error).toBe(true);
  });
});

describe("asyncHandler", () => {
  it("calls the wrapped function", async () => {
    const fn = vi.fn(async (req, res) => res.json({ ok: true }));
    const handler = asyncHandler(fn);
    const res = { json: vi.fn() };
    await handler({}, res, vi.fn());
    expect(fn).toHaveBeenCalled();
  });

  it("catches thrown errors and passes to next", async () => {
    const fn = async () => { throw new Error("test"); };
    const handler = asyncHandler(fn);
    const next = vi.fn();
    await handler({}, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("errorMiddleware", () => {
  it("returns AppError status and message", () => {
    const err = new AppError(400, "Bad request");
    const res = { status: vi.fn(() => res), json: vi.fn() };
    errorMiddleware(err, { method: "GET", originalUrl: "/test" }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Bad request" });
  });

  it("returns 500 with generic message for unknown errors", () => {
    const err = new Error("secret internal detail");
    const res = { status: vi.fn(() => res), json: vi.fn() };
    errorMiddleware(err, { method: "GET", originalUrl: "/test" }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
  });

  it("does not leak internal error message", () => {
    const err = new Error("pg: connection refused at 192.168.1.1");
    const res = { status: vi.fn(() => res), json: vi.fn() };
    errorMiddleware(err, { method: "POST", originalUrl: "/api/contacts" }, res, vi.fn());
    const response = res.json.mock.calls[0][0];
    expect(response.error).toBe("Erreur serveur");
    expect(response.error).not.toContain("192.168");
  });
});
