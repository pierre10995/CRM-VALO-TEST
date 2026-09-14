import { describe, it, expect, vi } from "vitest";

// Le module route importe la base et Supabase : on les mocke (aucune connexion).
vi.mock("../server/db.js", () => ({ pool: { query: vi.fn(), on: () => {} }, initDB: vi.fn() }));
vi.mock("../server/supabase.js", () => ({ supabaseAdmin: {}, supabaseClient: {} }));

// On teste la fonction réelle du module (et non une copie locale).
const { extractNameFromFileName, llmInfoSchema } = await import("../server/routes/bulk-cv-upload.js");

describe("llmInfoSchema — validation de la sortie du modèle", () => {
  it("coerce les types et tronque les longueurs", () => {
    const out = llmInfoSchema.parse({ name: "Jean", email: null, phone: 514, skills: ["React", "Node"], city: "Montréal" });
    expect(out.name).toBe("Jean");
    expect(out.email).toBe("");
    expect(out.phone).toBe("514");
    expect(out.skills).toBe("React, Node");
    expect(out.city).toBe("Montréal");
  });

  it("rejette un objet dont un champ dépasse la limite", () => {
    expect(llmInfoSchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });

  it("accepte un objet vide (tous les champs optionnels)", () => {
    expect(llmInfoSchema.safeParse({}).success).toBe(true);
  });
});

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
