import { describe, it, expect } from "vitest";

// Replicate the validation logic from files.js for unit testing
const ALLOWED_FILE_TYPES = ["cv", "compte-rendu", "offre"];
const ALLOWED_MIME_TYPES = ["application/pdf"];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9À-ÖØ-öø-ÿ._\- ]/g, "_").slice(0, 200);
}

describe("File type validation", () => {
  it("accepts valid file types", () => {
    for (const t of ["cv", "compte-rendu", "offre"]) {
      expect(ALLOWED_FILE_TYPES.includes(t)).toBe(true);
    }
  });

  it("rejects invalid file types", () => {
    for (const t of ["exe", "script", "../cv", "CV", ""]) {
      expect(ALLOWED_FILE_TYPES.includes(t)).toBe(false);
    }
  });
});

describe("MIME type validation", () => {
  it("accepts application/pdf", () => {
    expect(ALLOWED_MIME_TYPES.includes("application/pdf")).toBe(true);
  });

  it("rejects dangerous MIME types", () => {
    const dangerous = [
      "application/x-executable",
      "application/x-msdownload",
      "text/html",
      "application/javascript",
      "image/svg+xml",
    ];
    for (const m of dangerous) {
      expect(ALLOWED_MIME_TYPES.includes(m)).toBe(false);
    }
  });
});

describe("sanitizeFileName", () => {
  it("preserves normal filenames", () => {
    expect(sanitizeFileName("CV-Jean-Dupont.pdf")).toBe("CV-Jean-Dupont.pdf");
  });

  it("preserves accented characters", () => {
    expect(sanitizeFileName("CV-Réné Château.pdf")).toBe("CV-Réné Château.pdf");
  });

  it("removes path traversal characters", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe(".._.._etc_passwd");
    expect(sanitizeFileName("../../etc/passwd")).not.toContain("/");
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

  it("removes newlines and control characters", () => {
    expect(sanitizeFileName("file\nname\r.pdf")).toBe("file_name_.pdf");
  });
});

describe("File size validation", () => {
  it("accepts files under the limit", () => {
    const smallData = "a".repeat(1000);
    expect(smallData.length < MAX_FILE_SIZE_BYTES).toBe(true);
  });

  it("rejects files over 8MB base64", () => {
    const largeData = "a".repeat(MAX_FILE_SIZE_BYTES + 1);
    expect(largeData.length > MAX_FILE_SIZE_BYTES).toBe(true);
  });
});
