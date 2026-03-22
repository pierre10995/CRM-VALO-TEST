import { describe, it, expect } from "vitest";
import {
  userCreateSchema,
  partnerCreateSchema,
  partnerUpdateSchema,
  partnerLoginSchema,
} from "../server/validators/schemas.js";

describe("userCreateSchema", () => {
  it("accepts valid user data", () => {
    const result = userCreateSchema.parse({
      fullName: "Jean Dupont",
      login: "jean@valo-inno.com",
      password: "securepass123",
    });
    expect(result.fullName).toBe("Jean Dupont");
    expect(result.login).toBe("jean@valo-inno.com");
  });

  it("rejects non-email login", () => {
    expect(() => userCreateSchema.parse({
      fullName: "Jean", login: "not-an-email", password: "pass123456",
    })).toThrow();
  });

  it("rejects empty fullName", () => {
    expect(() => userCreateSchema.parse({
      fullName: "", login: "j@test.com", password: "pass123456",
    })).toThrow();
  });

  it("rejects short password (< 6 chars)", () => {
    expect(() => userCreateSchema.parse({
      fullName: "Jean", login: "j@test.com", password: "abc",
    })).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => userCreateSchema.parse({})).toThrow();
    expect(() => userCreateSchema.parse({ fullName: "Jean" })).toThrow();
    expect(() => userCreateSchema.parse({ fullName: "Jean", login: "j@t.com" })).toThrow();
  });

  it("rejects fullName over 100 chars", () => {
    expect(() => userCreateSchema.parse({
      fullName: "a".repeat(101), login: "j@t.com", password: "pass123456",
    })).toThrow();
  });

  it("rejects password over 200 chars", () => {
    expect(() => userCreateSchema.parse({
      fullName: "Jean", login: "j@t.com", password: "a".repeat(201),
    })).toThrow();
  });
});

describe("partnerCreateSchema", () => {
  it("accepts valid partner with all fields", () => {
    const result = partnerCreateSchema.parse({
      name: "Partenaire Inc",
      email: "contact@partner.com",
      password: "secure123",
      company: "Partner Corp",
      phone: "(514) 555-1234",
    });
    expect(result.name).toBe("Partenaire Inc");
    expect(result.company).toBe("Partner Corp");
  });

  it("defaults company and phone to empty string", () => {
    const result = partnerCreateSchema.parse({
      name: "Test", email: "t@t.com", password: "pass123456",
    });
    expect(result.company).toBe("");
    expect(result.phone).toBe("");
  });

  it("rejects non-email", () => {
    expect(() => partnerCreateSchema.parse({
      name: "Test", email: "not-valid", password: "pass123456",
    })).toThrow();
  });

  it("rejects short password", () => {
    expect(() => partnerCreateSchema.parse({
      name: "Test", email: "t@t.com", password: "abc",
    })).toThrow();
  });

  it("rejects empty name", () => {
    expect(() => partnerCreateSchema.parse({
      name: "", email: "t@t.com", password: "pass123456",
    })).toThrow();
  });
});

describe("partnerUpdateSchema", () => {
  it("accepts update without password", () => {
    const result = partnerUpdateSchema.parse({
      name: "Updated", email: "u@t.com",
    });
    expect(result.name).toBe("Updated");
    expect(result.password).toBeUndefined();
  });

  it("accepts update with optional password", () => {
    const result = partnerUpdateSchema.parse({
      name: "Updated", email: "u@t.com", password: "newpass123",
    });
    expect(result.password).toBe("newpass123");
  });

  it("rejects short optional password", () => {
    expect(() => partnerUpdateSchema.parse({
      name: "Updated", email: "u@t.com", password: "abc",
    })).toThrow();
  });
});

describe("partnerLoginSchema", () => {
  it("accepts valid login", () => {
    const result = partnerLoginSchema.parse({
      email: "partner@test.com", password: "pass123",
    });
    expect(result.email).toBe("partner@test.com");
  });

  it("rejects non-email", () => {
    expect(() => partnerLoginSchema.parse({
      email: "notvalid", password: "pass123",
    })).toThrow();
  });

  it("rejects empty password", () => {
    expect(() => partnerLoginSchema.parse({
      email: "p@t.com", password: "",
    })).toThrow();
  });
});
