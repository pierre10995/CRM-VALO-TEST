import { describe, it, expect } from "vitest";
import { config } from "../server/config.js";

describe("config", () => {
  it("has a JWT secret defined", () => {
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.secret.length).toBeGreaterThan(10);
  });

  it("has JWT expiration set to 4h", () => {
    expect(config.jwt.expiresIn).toBe("4h");
  });

  it("has JWT cookie name defined", () => {
    expect(config.jwt.cookieName).toBe("crm_token");
  });

  it("has CORS origins as array", () => {
    expect(Array.isArray(config.cors.origins)).toBe(true);
  });

  it("has DB SSL disabled in dev", () => {
    if (!config.isProduction) {
      expect(config.db.ssl).toBe(false);
    }
  });

  it("has limits defined", () => {
    expect(config.limits.maxFileSize).toBeGreaterThan(0);
    expect(config.limits.maxBulkFiles).toBeGreaterThan(0);
    expect(config.limits.jsonPayload).toBeDefined();
  });
});
