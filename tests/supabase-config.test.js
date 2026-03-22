import { describe, it, expect } from "vitest";
import { config } from "../server/config.js";

describe("supabase config", () => {
  it("has supabase section defined", () => {
    expect(config.supabase).toBeDefined();
    expect(config.supabase).toHaveProperty("url");
    expect(config.supabase).toHaveProperty("anonKey");
    expect(config.supabase).toHaveProperty("serviceRoleKey");
  });

  it("anonKey defaults to empty string when not set", () => {
    if (!process.env.SUPABASE_ANON_KEY) {
      expect(config.supabase.anonKey).toBe("");
    }
  });

  it("does not crash in test environment without SUPABASE vars", () => {
    // This test passing proves the config module loads without process.exit
    expect(config.jwt.cookieName).toBe("crm_token");
  });
});

describe("config integrity", () => {
  it("has all required sections", () => {
    expect(config.jwt).toBeDefined();
    expect(config.db).toBeDefined();
    expect(config.cors).toBeDefined();
    expect(config.supabase).toBeDefined();
    expect(config.limits).toBeDefined();
  });

  it("has sensible defaults for limits", () => {
    expect(config.limits.maxFileSize).toBe(8 * 1024 * 1024);
    expect(config.limits.maxBulkFiles).toBe(50);
    expect(config.limits.jsonPayload).toBe("10mb");
  });
});
