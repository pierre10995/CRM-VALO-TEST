import { describe, it, expect, vi } from "vitest";
import { validate } from "../server/validators/validate.js";
import { z } from "zod";

const testSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().int().positive(),
});

function mockReqResNext(body) {
  const req = { body };
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) };
  const next = vi.fn();
  return { req, res, next };
}

describe("validate middleware", () => {
  it("passes valid body and calls next", () => {
    const { req, res, next } = mockReqResNext({ name: "Test", age: 25 });
    validate(testSchema)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.name).toBe("Test");
    expect(req.body.age).toBe(25);
  });

  it("coerces string age to number", () => {
    const { req, res, next } = mockReqResNext({ name: "Test", age: "30" });
    validate(testSchema)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.age).toBe(30);
  });

  it("returns 400 on invalid body", () => {
    const { req, res, next } = mockReqResNext({ name: "", age: -5 });
    validate(testSchema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 on missing fields", () => {
    const { req, res, next } = mockReqResNext({});
    validate(testSchema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("includes error message in response", () => {
    const { req, res, next } = mockReqResNext({ name: "" });
    validate(testSchema)(req, res, next);
    const errorResponse = res.json.mock.calls[0][0];
    expect(errorResponse.error).toBeDefined();
    expect(typeof errorResponse.error).toBe("string");
  });
});
