import { describe, it, expect } from "vitest";
import { sanitizeFileName } from "../server/helpers/sanitize.js";

describe("sanitizeFileName", () => {
  it("preserves normal filenames", () => {
    expect(sanitizeFileName("CV-Jean-Dupont.pdf")).toBe("CV-Jean-Dupont.pdf");
  });

  it("preserves accented characters", () => {
    expect(sanitizeFileName("CV-Réné Château.pdf")).toBe("CV-Réné Château.pdf");
  });

  it("removes path traversal slashes", () => {
    const result = sanitizeFileName("../../etc/passwd");
    expect(result).not.toContain("/");
    expect(result).not.toContain("\\");
  });

  it("removes quotes and special chars", () => {
    expect(sanitizeFileName('file"; rm -rf /')).toBe("file__ rm -rf _");
  });

  it("truncates to 200 characters", () => {
    const longName = "a".repeat(300) + ".pdf";
    expect(sanitizeFileName(longName).length).toBe(200);
  });

  it("handles empty string", () => {
    expect(sanitizeFileName("")).toBe("");
  });

  it("handles null/undefined", () => {
    expect(sanitizeFileName(null)).toBe("");
    expect(sanitizeFileName(undefined)).toBe("");
  });

  it("removes newlines and control characters", () => {
    expect(sanitizeFileName("file\nname\r.pdf")).toBe("file_name_.pdf");
  });

  it("removes angle brackets (XSS prevention)", () => {
    const result = sanitizeFileName("<script>alert(1)</script>.pdf");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).toContain("script");
    expect(result.endsWith(".pdf")).toBe(true);
  });
});
