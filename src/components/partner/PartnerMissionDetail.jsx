import { useState, useEffect } from "react";
import api from "../../services/api";
import PartnerSubmitForm from "./PartnerSubmitForm";

const STAGE_COLORS = {
  "En attente": { bg: "#fef3c7", color: "#d97706" },
  "Proposition partenaire": { bg: "#d1fae5", color: "#059669" },
  "Présélectionné": { bg: "#dbeafe", color: "#2563eb" },
  "Soumis": { bg: "#e2e8f0", color: "#64748b" },
  "Entretien": { bg: "#fef3c7", color: "#d97706" },
  "Finaliste": { bg: "#ede9fe", color: "#7c3aed" },
  "Placé": { bg: "#d1fae5", color: "#059669" },
  "Refusé": { bg: "#fee2e2", color: "#dc2626" },
  "Archivé": { bg: "#f1f5f9", color: "#94a3b8" },
};

export default function PartnerMissionDetail({ mission, candidatures, onBack, onSubmitted }) {
  const [showForm, setShowForm] = useState(false);
  const [files, setFiles] = useState([]);
  const [expandedCd, setExpandedCd] = useState(null);

  useEffect(() => {
    fetch(`/api/partner/missions/${mission.id}/files`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setFiles)
      .catch(() => setFiles([]));
  }, [mission.id]);

  const stageOf = (stage) => STAGE_COLORS[stage] || { bg: "#f1f5f9", color: "#64748b" };

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
          {(mission.salaryMin > 0 || mission.salaryMax > 0) && (
            <InfoItem label="Salaire" value={`${mission.salaryMin.toLocaleString()}$ — ${mission.salaryMax.toLocaleString()}$`} />
          )}
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
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Prerequis</div>
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{mission.requirements}</div>
          </div>
        )}
        {mission.partnerNotes && (
          <div style={{ marginTop: 12, padding: 14, background: "#fffbeb", borderRadius: 10, border: "1px solid #fef3c7" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#d97706", textTransform: "uppercase", marginBottom: 4 }}>Notes complementaires</div>
            <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{mission.partnerNotes}</div>
          </div>
        )}
      </div>

      {/* Fiche de poste PDF */}
      {files.length > 0 && (
        <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>Documents du poste</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {files.map(f => (
              <a key={f.id} href={`/api/partner/files/${f.id}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f8fafc", borderRadius: 10, textDecoration: "none", color: "#0f172a", border: "1px solid #e2e8f0" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#dc2626" }}>PDF</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.file_name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(f.created_at).toLocaleDateString("fr-CA")}</div>
                </div>
                <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>Ouvrir</span>
              </a>
            ))}
          </div>
        </div>
      )}

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
            {candidatures.map(cd => {
              const sc = stageOf(cd.stage);
              const isExpanded = expandedCd === cd.id;
              return (
                <div key={cd.id}>
                  <div
                    onClick={() => setExpandedCd(isExpanded ? null : cd.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      background: isExpanded ? "#f0fdf4" : "#f8fafc", borderRadius: isExpanded ? "10px 10px 0 0" : 10,
                      cursor: "pointer", border: isExpanded ? "1px solid #86efac" : "1px solid transparent",
                      borderBottom: isExpanded ? "none" : undefined,
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#059669" }}>
                      {cd.candidateName?.[0] || "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{cd.candidateName}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {cd.candidateEmail}{cd.candidatePhone ? ` — ${cd.candidatePhone}` : ""}
                      </div>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{cd.stage}</span>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(cd.createdAt).toLocaleDateString("fr-CA")}</div>
                    <span style={{ fontSize: 14, color: "#94a3b8", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>v</span>
                  </div>
                  {isExpanded && (
                    <div style={{ border: "1px solid #86efac", borderTop: "none", borderRadius: "0 0 10px 10px", padding: 14, background: "white" }}>
                      <CommentThread candidatureId={cd.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <PartnerSubmitForm missionId={mission.id} missionTitle={mission.title} onClose={() => setShowForm(false)} onSubmitted={() => { setShowForm(false); onSubmitted(); }} />
      )}
    </div>
  );
}

function CommentThread({ candidatureId }) {
  const [comments, setComments] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get(`/api/partner/candidatures/${candidatureId}/comments`)
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]));
  }, [candidatureId]);

  const send = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/api/partner/candidatures/${candidatureId}/comments`, { message: newMsg.trim() });
      if (res.ok) {
        const c = await res.json();
        setComments(prev => [...prev, c]);
        setNewMsg("");
      }
    } catch {}
    setSending(false);
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Echanges ({comments.length})</div>
      {comments.length === 0 && (
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Aucun commentaire. Posez une question ou partagez des informations.</div>
      )}
      <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 8 }}>
        {comments.map(c => (
          <div key={c.id} style={{
            marginBottom: 6, padding: "8px 10px", borderRadius: 8,
            background: c.authorType === "internal" ? "#eff6ff" : "#f0fdf4",
            borderLeft: `3px solid ${c.authorType === "internal" ? "#3b82f6" : "#10b981"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: c.authorType === "internal" ? "#2563eb" : "#059669" }}>
                {c.authorType === "internal" ? `${c.authorName} (VALO)` : c.authorName}
              </span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{new Date(c.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{c.message}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ecrire un message..."
          style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 12.5, fontFamily: "inherit", outline: "none" }}
        />
        <button onClick={send} disabled={sending || !newMsg.trim()}
          style={{ padding: "8px 16px", background: "#059669", color: "white", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: sending ? 0.6 : 1 }}>
          Envoyer
        </button>
      </div>
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
