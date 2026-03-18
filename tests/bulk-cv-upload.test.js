import { describe, it, expect } from "vitest";

// Test the extractNameFromFileName function logic
function extractNameFromFileName(fileName) {
  const base = fileName.replace(/\.pdf$/i, "").trim();
  const match = base.match(/VALO\s*[-–]\s*(.+?)\s*(?:[-–]\s*CV)?$/i);
  if (match) return match[1].trim();
  return "";
}

describe("extractNameFromFileName", () => {
  it("extracts name from standard VALO format", () => {
    expect(extractNameFromFileName("VALO - Jean Dupont - CV.pdf")).toBe("Jean Dupont");
  });

  it("extracts name with em dash", () => {
    expect(extractNameFromFileName("VALO – Marie Tremblay – CV.pdf")).toBe("Marie Tremblay");
  });

  it("extracts name without CV suffix", () => {
    expect(extractNameFromFileName("VALO - Pierre Martin.pdf")).toBe("Pierre Martin");
  });

  it("handles no spaces around dashes", () => {
    expect(extractNameFromFileName("VALO-Jean Dupont-CV.pdf")).toBe("Jean Dupont");
  });

  it("returns empty for non-VALO filenames", () => {
    expect(extractNameFromFileName("resume_jean.pdf")).toBe("");
  });

  it("handles case-insensitive VALO", () => {
    expect(extractNameFromFileName("valo - Test Nom - CV.pdf")).toBe("Test Nom");
  });

  it("handles compound names", () => {
    expect(extractNameFromFileName("VALO - Jean-Pierre De La Fontaine - CV.pdf")).toBe("Jean-Pierre De La Fontaine");
  });
});
