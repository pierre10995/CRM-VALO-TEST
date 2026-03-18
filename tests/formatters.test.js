import { describe, it, expect } from "vitest";
import { fmtContact, fmtMission, fmtCandidature, fmtActivity, fmtPlacement, fmtEvaluation, fmtObjective } from "../server/formatters.js";

describe("fmtContact", () => {
  it("formats a full contact row", () => {
    const row = {
      id: 1, name: "Jean Dupont", company: "Acme", email: "jean@acme.com",
      phone: "514-555-1234", status: "Candidat", sector: "Tech", revenue: "75000",
      notes: "Bon profil", city: "Montréal", linkedin: "https://linkedin.com/in/jean",
      skills: "React, Node", salary_expectation: "90000", availability: "Immédiate",
      validation_status: "Validé", target_position: "Dev Senior", created_at: "2025-01-01",
    };
    const result = fmtContact(row);
    expect(result.id).toBe(1);
    expect(result.name).toBe("Jean Dupont");
    expect(result.revenue).toBe(75000);
    expect(result.salaryExpectation).toBe(90000);
    expect(result.targetPosition).toBe("Dev Senior");
    expect(result.city).toBe("Montréal");
  });

  it("handles missing optional fields", () => {
    const row = {
      id: 2, name: "Test", company: "", email: "", phone: "", status: "Candidat",
      sector: "", revenue: null, notes: "", created_at: "2025-01-01",
    };
    const result = fmtContact(row);
    expect(result.city).toBe("");
    expect(result.linkedin).toBe("");
    expect(result.skills).toBe("");
    expect(result.salaryExpectation).toBe(0);
    expect(result.validationStatus).toBe("");
    expect(result.targetPosition).toBe("");
  });

  it("converts string numbers correctly", () => {
    const row = {
      id: 3, name: "X", company: "", email: "", phone: "", status: "Candidat",
      sector: "", revenue: "0", notes: "", salary_expectation: "abc",
      created_at: "2025-01-01",
    };
    const result = fmtContact(row);
    expect(result.revenue).toBe(0);
    expect(result.salaryExpectation).toBe(0); // NaN -> 0 via || 0
  });

  it("does not mutate original row", () => {
    const row = {
      id: 4, name: "Original", company: "", email: "", phone: "", status: "Candidat",
      sector: "", revenue: "100", notes: "", created_at: "2025-01-01",
    };
    const original = { ...row };
    fmtContact(row);
    expect(row).toEqual(original);
  });
});

describe("fmtMission", () => {
  it("formats a mission row with all fields", () => {
    const row = {
      id: 10, title: "Dev Fullstack", client_contact_id: 5, company: "Startup Inc",
      location: "Montréal", contract_type: "CDI", salary_min: "60000", salary_max: "80000",
      description: "Poste dev", requirements: "3 ans exp", status: "En cours",
      priority: "Haute", assigned_to: 1, commission: "5000", created_at: "2025-01-01",
      deadline: "2025-06-01", fiscal_year_id: 1, work_mode: "Hybride",
      client_name: "Client A", assigned_name: "Pierre", candidature_count: "3",
      fiscal_year_label: "2025",
    };
    const result = fmtMission(row);
    expect(result.title).toBe("Dev Fullstack");
    expect(result.salaryMin).toBe(60000);
    expect(result.salaryMax).toBe(80000);
    expect(result.commission).toBe(5000);
    expect(result.workMode).toBe("Hybride");
    expect(result.candidatureCount).toBe(3);
  });

  it("handles missing optional fields", () => {
    const row = {
      id: 11, title: "Test", client_contact_id: 1, company: "X",
      status: "Nouveau", assigned_to: 1, created_at: "2025-01-01",
    };
    const result = fmtMission(row);
    expect(result.location).toBe("");
    expect(result.contractType).toBe("CDI");
    expect(result.salaryMin).toBe(0);
    expect(result.workMode).toBe("");
    expect(result.candidatureCount).toBe(0);
  });

  it("handles non-numeric candidature_count", () => {
    const row = {
      id: 12, title: "T", client_contact_id: 1, company: "X",
      status: "N", assigned_to: 1, created_at: "2025-01-01",
      candidature_count: "abc",
    };
    const result = fmtMission(row);
    expect(result.candidatureCount).toBe(0);
  });
});

describe("fmtCandidature", () => {
  it("formats a candidature row", () => {
    const row = {
      id: 1, candidate_id: 2, mission_id: 3, stage: "Entretien", rating: 4,
      notes: "Bon", interview_date: "2025-03-01", created_at: "2025-01-01",
      updated_at: "2025-02-01", candidate_name: "Jean", candidate_email: "j@x.com",
      candidate_phone: "514-555-0000", candidate_skills: "JS",
      mission_title: "Dev", mission_company: "Corp",
    };
    const result = fmtCandidature(row);
    expect(result.stage).toBe("Entretien");
    expect(result.rating).toBe(4);
    expect(result.candidateName).toBe("Jean");
    expect(result.missionTitle).toBe("Dev");
  });

  it("handles missing optional fields", () => {
    const row = {
      id: 2, candidate_id: 1, mission_id: 1, stage: "Nouveau",
      created_at: "2025-01-01", updated_at: "2025-01-01",
    };
    const result = fmtCandidature(row);
    expect(result.rating).toBe(0);
    expect(result.notes).toBe("");
    expect(result.candidateName).toBe("");
    expect(result.missionTitle).toBe("");
  });
});

describe("fmtActivity", () => {
  it("formats an activity row", () => {
    const row = {
      id: 1, contact_id: 2, mission_id: null, user_id: 1, type: "Appel",
      subject: "Suivi", description: "RAS", due_date: "2025-04-01", completed: false,
      created_at: "2025-01-01", contact_name: "Jean", user_name: "Pierre",
    };
    const result = fmtActivity(row);
    expect(result.type).toBe("Appel");
    expect(result.contactName).toBe("Jean");
    expect(result.completed).toBe(false);
  });

  it("handles missing optional fields", () => {
    const row = {
      id: 2, contact_id: 1, user_id: 1, type: "Email",
      subject: "Test", due_date: null, completed: true, created_at: "2025-01-01",
    };
    const result = fmtActivity(row);
    expect(result.description).toBe("");
    expect(result.contactName).toBe("");
    expect(result.userName).toBe("");
  });
});

describe("fmtObjective", () => {
  it("formats an objective row", () => {
    const row = {
      id: 1, user_id: 2, period: "mensuel", year: 2025, month: 3,
      fiscal_year_id: 1, target_new_clients: 5, target_ca: "50000",
      target_total: "100000", notes: "Q1", created_at: "2025-01-01",
      user_name: "Pierre", fiscal_year_label: "2025",
    };
    const result = fmtObjective(row);
    expect(result.period).toBe("mensuel");
    expect(result.targetNewClients).toBe(5);
    expect(result.targetCA).toBe(50000);
    expect(result.targetTotal).toBe(100000);
    expect(result.userName).toBe("Pierre");
  });

  it("handles missing optional fields", () => {
    const row = {
      id: 2, user_id: 1, period: "annuel", year: 2025, month: null,
      created_at: "2025-01-01",
    };
    const result = fmtObjective(row);
    expect(result.targetNewClients).toBe(0);
    expect(result.targetCA).toBe(0);
    expect(result.targetTotal).toBe(0);
    expect(result.notes).toBe("");
    expect(result.userName).toBe("");
    expect(result.fiscalYearLabel).toBe("");
  });
});

describe("fmtPlacement", () => {
  it("formats a placement row", () => {
    const row = {
      id: 1, candidature_id: 2, candidate_id: 3, mission_id: 4, company: "Corp",
      start_date: "2025-06-01", probation_date: "2025-09-01",
      start_invoice_sent: true, start_invoice_name: "INV-001", start_invoice_paid: false,
      probation_invoice_sent: false, probation_invoice_name: "", probation_invoice_paid: false,
      probation_validated: false, notes: "", created_at: "2025-01-01",
      candidate_name: "Jean", mission_title: "Dev", mission_company: "Corp",
    };
    const result = fmtPlacement(row);
    expect(result.startInvoiceSent).toBe(true);
    expect(result.startInvoiceName).toBe("INV-001");
    expect(result.probationValidated).toBe(false);
    expect(result.candidateName).toBe("Jean");
  });

  it("handles missing boolean fields", () => {
    const row = {
      id: 2, candidature_id: 1, candidate_id: 1, mission_id: 1,
      start_date: "2025-01-01", probation_date: "2025-04-01",
      created_at: "2025-01-01",
    };
    const result = fmtPlacement(row);
    expect(result.startInvoiceSent).toBe(false);
    expect(result.startInvoicePaid).toBe(false);
    expect(result.probationValidated).toBe(false);
    expect(result.company).toBe("");
    expect(result.notes).toBe("");
  });
});

describe("fmtEvaluation", () => {
  it("formats an evaluation row", () => {
    const row = {
      id: 1, candidate_id: 2, mission_id: 3, score: 85,
      positives: "Bon profil", negatives: "Peu d'exp", clarifications: "",
      summary: "Candidat solide", created_at: "2025-01-01",
      candidate_name: "Jean", mission_title: "Dev", mission_company: "Corp",
    };
    const result = fmtEvaluation(row);
    expect(result.score).toBe(85);
    expect(result.positives).toBe("Bon profil");
    expect(result.candidateName).toBe("Jean");
  });

  it("handles missing optional fields", () => {
    const row = {
      id: 2, candidate_id: 1, mission_id: 1, score: 0,
      created_at: "2025-01-01",
    };
    const result = fmtEvaluation(row);
    expect(result.score).toBe(0);
    expect(result.positives).toBe("");
    expect(result.negatives).toBe("");
    expect(result.summary).toBe("");
    expect(result.candidateName).toBe("");
  });
});
