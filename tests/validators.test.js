import { describe, it, expect } from "vitest";
import {
  loginSchema, forgotPasswordSchema, resetPasswordSchema,
  contactSchema, missionSchema,
  candidatureCreateSchema, candidatureUpdateSchema,
  activityCreateSchema, activityUpdateSchema,
  objectiveCreateSchema, fiscalYearSchema,
  placementCreateSchema,
  fileUploadSchema, evaluationGenerateSchema,
  validationStatusSchema, cvSummarySchema,
} from "../server/validators/schemas.js";

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.parse({ login: "user@test.com", password: "pass123" });
    expect(result.login).toBe("user@test.com");
  });

  it("rejects empty login", () => {
    expect(() => loginSchema.parse({ login: "", password: "pass" })).toThrow();
  });

  it("rejects empty password", () => {
    expect(() => loginSchema.parse({ login: "user", password: "" })).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => loginSchema.parse({})).toThrow();
  });
});

describe("resetPasswordSchema", () => {
  it("accepts valid reset", () => {
    const result = resetPasswordSchema.parse({ login: "u", code: "123456", newPassword: "newpass123" });
    expect(result.code).toBe("123456");
  });

  it("rejects short password", () => {
    expect(() => resetPasswordSchema.parse({ login: "u", code: "123456", newPassword: "abc" })).toThrow();
  });

  it("rejects invalid code length", () => {
    expect(() => resetPasswordSchema.parse({ login: "u", code: "123", newPassword: "newpass123" })).toThrow();
  });
});

describe("contactSchema", () => {
  it("accepts minimal contact", () => {
    const result = contactSchema.parse({ name: "Jean" });
    expect(result.name).toBe("Jean");
    expect(result.status).toBe("Candidat");
    expect(result.revenue).toBe(0);
    expect(result.salaryExpectation).toBe(0);
  });

  it("coerces revenue from string", () => {
    const result = contactSchema.parse({ name: "X", revenue: "50000" });
    expect(result.revenue).toBe(50000);
  });

  it("rejects invalid status", () => {
    expect(() => contactSchema.parse({ name: "X", status: "Invalid" })).toThrow();
  });

  it("rejects missing name", () => {
    expect(() => contactSchema.parse({ company: "Corp" })).toThrow();
  });

  it("rejects name over 100 chars", () => {
    expect(() => contactSchema.parse({ name: "a".repeat(101) })).toThrow();
  });
});

describe("missionSchema", () => {
  it("accepts valid mission", () => {
    const result = missionSchema.parse({ title: "Dev", company: "Corp" });
    expect(result.contractType).toBe("CDI");
    expect(result.salaryMin).toBe(0);
  });

  it("rejects missing title", () => {
    expect(() => missionSchema.parse({ company: "Corp" })).toThrow();
  });

  it("rejects missing company", () => {
    expect(() => missionSchema.parse({ title: "Dev" })).toThrow();
  });

  it("coerces salary from string", () => {
    const result = missionSchema.parse({ title: "D", company: "C", salaryMin: "70000" });
    expect(result.salaryMin).toBe(70000);
  });
});

describe("candidatureCreateSchema", () => {
  it("accepts valid candidature", () => {
    const result = candidatureCreateSchema.parse({ candidateId: 1, missionId: 2 });
    expect(result.stage).toBe("Soumis");
    expect(result.rating).toBe(0);
  });

  it("rejects rating > 5", () => {
    expect(() => candidatureCreateSchema.parse({ candidateId: 1, missionId: 2, rating: 10 })).toThrow();
  });
});

describe("activityCreateSchema", () => {
  it("accepts valid activity", () => {
    const result = activityCreateSchema.parse({ type: "Appel", subject: "Suivi" });
    expect(result.description).toBe("");
  });

  it("rejects missing type", () => {
    expect(() => activityCreateSchema.parse({ subject: "S" })).toThrow();
  });
});

describe("activityUpdateSchema", () => {
  it("accepts boolean completed", () => {
    const result = activityUpdateSchema.parse({ completed: true });
    expect(result.completed).toBe(true);
  });

  it("rejects non-boolean", () => {
    expect(() => activityUpdateSchema.parse({ completed: "yes" })).toThrow();
  });
});

describe("objectiveCreateSchema", () => {
  it("accepts valid objective", () => {
    const result = objectiveCreateSchema.parse({ userId: 1, period: "mensuel" });
    expect(result.targetNewClients).toBe(0);
  });
});

describe("fiscalYearSchema", () => {
  it("accepts valid fiscal year", () => {
    const result = fiscalYearSchema.parse({ label: "2025", startDate: "2025-01-01", endDate: "2025-12-31" });
    expect(result.target).toBe(0);
  });

  it("rejects missing dates", () => {
    expect(() => fiscalYearSchema.parse({ label: "2025" })).toThrow();
  });
});

describe("fileUploadSchema", () => {
  it("accepts valid PDF upload", () => {
    const result = fileUploadSchema.parse({
      contactId: 1, fileType: "cv", fileName: "test.pdf", fileData: "base64data",
    });
    expect(result.mimeType).toBe("application/pdf");
  });

  it("rejects invalid fileType", () => {
    expect(() => fileUploadSchema.parse({
      contactId: 1, fileType: "exe", fileName: "bad.exe", fileData: "data",
    })).toThrow();
  });

  it("rejects non-PDF mimeType", () => {
    expect(() => fileUploadSchema.parse({
      contactId: 1, fileType: "cv", fileName: "t.pdf", mimeType: "text/html", fileData: "data",
    })).toThrow();
  });

  it("accepts all valid file types", () => {
    for (const ft of ["cv", "compte-rendu", "offre"]) {
      const result = fileUploadSchema.parse({ contactId: 1, fileType: ft, fileName: "f.pdf", fileData: "d" });
      expect(result.fileType).toBe(ft);
    }
  });
});

describe("evaluationGenerateSchema", () => {
  it("accepts valid IDs", () => {
    const result = evaluationGenerateSchema.parse({ candidateId: 1, missionId: 2 });
    expect(result.candidateId).toBe(1);
  });

  it("coerces string IDs", () => {
    const result = evaluationGenerateSchema.parse({ candidateId: "5", missionId: "10" });
    expect(result.candidateId).toBe(5);
    expect(result.missionId).toBe(10);
  });

  it("rejects negative IDs", () => {
    expect(() => evaluationGenerateSchema.parse({ candidateId: -1, missionId: 2 })).toThrow();
  });
});

describe("validationStatusSchema", () => {
  it("accepts valid status", () => {
    const result = validationStatusSchema.parse({ label: "Validé" });
    expect(result.bg).toBe("#f1f5f9");
    expect(result.color).toBe("#64748b");
  });
});

describe("cvSummarySchema", () => {
  it("accepts valid candidateId", () => {
    const result = cvSummarySchema.parse({ candidateId: 5 });
    expect(result.candidateId).toBe(5);
  });
});
