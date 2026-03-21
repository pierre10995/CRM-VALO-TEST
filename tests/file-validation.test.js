import { describe, it, expect } from "vitest";
import { config } from "../server/config.js";

describe("File config limits", () => {
  it("has a max file size configured", () => {
    expect(config.limits.maxFileSize).toBe(8 * 1024 * 1024);
  });

  it("has a max bulk files configured", () => {
    expect(config.limits.maxBulkFiles).toBe(50);
  });

  it("has a JSON payload limit", () => {
    expect(config.limits.jsonPayload).toBe("10mb");
  });
});
