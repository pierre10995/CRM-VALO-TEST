export function fmtContact(r) {
  return {
    id: r.id, name: r.name, company: r.company, email: r.email, phone: r.phone,
    status: r.status, sector: r.sector, revenue: Number(r.revenue), notes: r.notes,
    city: r.city || "", linkedin: r.linkedin || "", skills: r.skills || "",
    salaryExpectation: Number(r.salary_expectation) || 0, availability: r.availability || "",
    validationStatus: r.validation_status || "",
    targetPosition: r.target_position || "",
    createdAt: r.created_at,
  };
}

export function fmtMission(r) {
  return {
    id: r.id, title: r.title, clientContactId: r.client_contact_id, company: r.company,
    location: r.location || "", contractType: r.contract_type || "CDI",
    salaryMin: Number(r.salary_min) || 0, salaryMax: Number(r.salary_max) || 0,
    description: r.description || "", requirements: r.requirements || "",
    status: r.status, priority: r.priority || "Normale",
    assignedTo: r.assigned_to, commission: Number(r.commission) || 0,
    createdAt: r.created_at, deadline: r.deadline,
    fiscalYearId: r.fiscal_year_id || null, workMode: r.work_mode || "",
    clientName: r.client_name || "", assignedName: r.assigned_name || "",
    candidatureCount: parseInt(r.candidature_count) || 0,
    fiscalYearLabel: r.fiscal_year_label || "",
  };
}

export function fmtCandidature(r) {
  return {
    id: r.id, candidateId: r.candidate_id, missionId: r.mission_id,
    stage: r.stage, rating: r.rating || 0, notes: r.notes || "",
    interviewDate: r.interview_date, createdAt: r.created_at, updatedAt: r.updated_at,
    candidateName: r.candidate_name || "", candidateEmail: r.candidate_email || "",
    candidatePhone: r.candidate_phone || "", candidateSkills: r.candidate_skills || "",
    missionTitle: r.mission_title || "", missionCompany: r.mission_company || "",
  };
}

export function fmtActivity(r) {
  return {
    id: r.id, contactId: r.contact_id, missionId: r.mission_id, userId: r.user_id,
    type: r.type, subject: r.subject, description: r.description || "",
    dueDate: r.due_date, completed: r.completed, createdAt: r.created_at,
    contactName: r.contact_name || "", userName: r.user_name || "",
  };
}

export function fmtObjective(r) {
  return {
    id: r.id, userId: r.user_id, period: r.period, year: r.year, month: r.month,
    targetNewClients: r.target_new_clients || 0, targetCA: Number(r.target_ca) || 0,
    targetTotal: Number(r.target_total) || 0, notes: r.notes || "", createdAt: r.created_at,
    userName: r.user_name || "",
  };
}

export function fmtEvaluation(r) {
  return {
    id: r.id, candidateId: r.candidate_id, missionId: r.mission_id,
    score: r.score, positives: r.positives || "", negatives: r.negatives || "",
    clarifications: r.clarifications || "", summary: r.summary || "",
    createdAt: r.created_at,
    candidateName: r.candidate_name || "", missionTitle: r.mission_title || "",
    missionCompany: r.mission_company || "",
  };
}

export function fmtPlacement(r) {
  return {
    id: r.id, candidatureId: r.candidature_id, candidateId: r.candidate_id,
    missionId: r.mission_id, company: r.company || "",
    startDate: r.start_date, probationDate: r.probation_date,
    startInvoiceSent: r.start_invoice_sent || false,
    startInvoiceName: r.start_invoice_name || "",
    startInvoicePaid: r.start_invoice_paid || false,
    probationInvoiceSent: r.probation_invoice_sent || false,
    probationInvoiceName: r.probation_invoice_name || "",
    probationInvoicePaid: r.probation_invoice_paid || false,
    probationValidated: r.probation_validated || false,
    notes: r.notes || "", createdAt: r.created_at,
    candidateName: r.candidate_name || "", missionTitle: r.mission_title || "",
    missionCompany: r.mission_company || "",
  };
}
