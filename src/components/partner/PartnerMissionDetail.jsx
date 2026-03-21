import { useState } from "react";
import PartnerSubmitForm from "./PartnerSubmitForm";

export default function PartnerMissionDetail({ mission, candidatures, onBack, onSubmitted }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "inherit" }}>
          Retour
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>{mission.title}</h2>
          <div style={{ fontSize: 13, color: "#64748b" }}>{mission.company}{mission.location ? ` — ${mission.location}` : ""}</div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 20px", background: "linear-gradient(135deg, #059669, #10b981)", color: "white",
            border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
          }}
        >
          Proposer un candidat
        </button>
      </div>

      {/* Mission info */}
      <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          <InfoItem label="Type de contrat" value={mission.contractType} />
          {mission.salaryMin > 0 && <InfoItem label="Salaire" value={`${mission.salaryMin.toLocaleString()}$ — ${mission.salaryMax.toLocaleString()}$`} />}
          {mission.workMode && <InfoItem label="Mode de travail" value={mission.workMode} />}
          <InfoItem label="Statut" value={mission.status} />
          {mission.deadline && <InfoItem label="Date limite" value={new Date(mission.deadline).toLocaleDateString("fr-CA")} />}
        </div>
        {mission.description && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Description</div>
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{mission.description}</div>
          </div>
        )}
        {mission.requirements && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Prérequis</div>
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{mission.requirements}</div>
          </div>
        )}
      </div>

      {/* Candidatures submitted */}
      <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 14px" }}>
          Vos candidats soumis ({candidatures.length})
        </h3>
        {candidatures.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
            Aucun candidat soumis pour cette mission.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {candidatures.map(cd => (
              <div key={cd.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#059669" }}>
                  {cd.candidateName?.[0] || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{cd.candidateName}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {cd.candidateEmail}{cd.candidatePhone ? ` — ${cd.candidatePhone}` : ""}
                  </div>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: cd.stage === "Soumis" ? "#fef3c7" : cd.stage === "Placé" ? "#d1fae5" : "#dbeafe",
                  color: cd.stage === "Soumis" ? "#d97706" : cd.stage === "Placé" ? "#059669" : "#2563eb",
                }}>
                  {cd.stage}
                </span>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {new Date(cd.createdAt).toLocaleDateString("fr-CA")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit form modal */}
      {showForm && (
        <PartnerSubmitForm
          missionId={mission.id}
          missionTitle={mission.title}
          onClose={() => setShowForm(false)}
          onSubmitted={() => { setShowForm(false); onSubmitted(); }}
        />
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a", marginTop: 2 }}>{value}</div>
    </div>
  );
}
