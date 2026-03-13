import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtCAD, VALIDATION_COLORS } from "../../utils/constants";

export default function FicheCandidat({ contact: c, onClose, onEdit, onDelete, candidatures, missions, loadAll }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [cvSummary, setCvSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const loadFiles = async () => {
    const data = await api.get(`/api/files/contact/${c.id}`);
    setFiles(data);
  };

  const loadEvaluations = async () => {
    const data = await api.get(`/api/evaluations/candidate/${c.id}`);
    setEvaluations(data);
  };

  useEffect(() => { loadFiles(); loadEvaluations(); }, [c.id]);

  const deleteEvaluation = async (id) => {
    await api.del(`/api/evaluations/${id}`);
    await loadEvaluations();
  };

  const handleUpload = async (fileType) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(",")[1];
        await api.post("/api/files", {
          contactId: c.id,
          fileType,
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          fileData: base64,
        });
        await loadFiles();
        setUploading(false);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const deleteFile = async (id) => {
    await api.del(`/api/files/${id}`);
    await loadFiles();
  };

  const downloadFile = (id, name) => {
    window.open(`/api/files/${id}`, "_blank");
  };

  const findSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await api.post(`/api/matching/candidate/${c.id}`);
      if (res.ok) { const data = await res.json(); setSuggestions(data); }
      else { const err = await res.json(); alert(err.error || "Erreur"); }
    } catch { alert("Erreur réseau"); }
    setLoadingSuggestions(false);
  };

  const generateCvSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.post("/api/cv-summary/generate", { candidateId: c.id });
      if (res.ok) { const data = await res.json(); setCvSummary(data); if (loadAll) loadAll(); }
      else { const err = await res.json(); alert(err.error || "Erreur"); }
    } catch { alert("Erreur réseau"); }
    setLoadingSummary(false);
  };

  const cvFiles = files.filter(f => f.file_type === "cv");
  const crFiles = files.filter(f => f.file_type === "compte-rendu");
  const myCandidatures = candidatures.filter(cd => cd.candidateId === c.id);

  return (
    <div className="card" style={{ width: 600, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, #fef3c7, #fde68a)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#d97706" }}>{c.name[0]}</div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{c.name}</h2>
            <p style={{ fontSize: 13, color: "#64748b" }}>Fiche Candidat</p>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>X</button>
      </div>

      {/* Info section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>EMAIL</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{c.email || "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>TELEPHONE</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{c.phone || "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>VILLE</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{c.city || "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>SALAIRE SOUHAITE</div>
          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{c.salaryExpectation > 0 ? fmtCAD(c.salaryExpectation) : "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>DISPONIBILITE</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{c.availability || "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>SECTEUR</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{c.sector || "—"}</div>
        </div>
      </div>

      {/* Statut validation */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>STATUT VALIDATION</div>
        {c.validationStatus ? (() => {
          const vc = VALIDATION_COLORS[c.validationStatus] || { bg: "#f1f5f9", color: "#64748b" };
          return <span style={{ fontSize: 13, fontWeight: 600, padding: "5px 14px", borderRadius: 16, background: vc.bg, color: vc.color }}>{c.validationStatus}</span>;
        })() : <span style={{ fontSize: 13, color: "#cbd5e1" }}>Non défini</span>}
      </div>

      {/* Skills */}
      {c.skills && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>COMPETENCES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {c.skills.split(",").filter(Boolean).map((s, i) => (
              <span key={i} style={{ fontSize: 12, background: "#eff6ff", color: "#2563eb", padding: "4px 12px", borderRadius: 16, fontWeight: 500 }}>{s.trim()}</span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {c.notes && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>NOTES</div>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{c.notes}</div>
        </div>
      )}

      {/* CV Section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>CV</div>
          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => handleUpload("cv")} disabled={uploading}>
            {uploading ? "Envoi..." : "+ Ajouter CV"}
          </button>
        </div>
        {cvFiles.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucun CV</p>}
        {cvFiles.map(f => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{f.file_name}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(f.created_at).toLocaleDateString("fr-CA")}</span>
            <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => downloadFile(f.id, f.file_name)}>Télécharger</button>
            <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && deleteFile(f.id)}>Suppr.</button>
          </div>
        ))}
      </div>

      {/* Résumé IA du CV */}
      {cvFiles.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Résumé IA du CV</div>
            <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={generateCvSummary} disabled={loadingSummary}>
              {loadingSummary ? "Analyse en cours..." : cvSummary ? "Relancer l'analyse" : "Analyser le CV"}
            </button>
          </div>
          {!cvSummary && !loadingSummary && <p style={{ fontSize: 12, color: "#94a3b8" }}>Cliquez pour générer un résumé IA du CV</p>}
          {cvSummary && (
            <div style={{ background: "#f0f9ff", borderRadius: 10, padding: 14, border: "1px solid #bae6fd" }}>
              <p style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.6, marginBottom: 10 }}>{cvSummary.summary}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {cvSummary.current_role && <div><span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>POSTE ACTUEL</span><div style={{ fontSize: 12, color: "#0f172a" }}>{cvSummary.current_role}</div></div>}
                {cvSummary.experience_years && <div><span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>EXPERIENCE</span><div style={{ fontSize: 12, color: "#0f172a" }}>{cvSummary.experience_years} ans</div></div>}
                {cvSummary.education && <div><span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>FORMATION</span><div style={{ fontSize: 12, color: "#0f172a" }}>{cvSummary.education}</div></div>}
                {cvSummary.salary_estimate && <div><span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>SALAIRE ESTIME</span><div style={{ fontSize: 12, color: "#0f172a" }}>{cvSummary.salary_estimate}</div></div>}
              </div>
              {cvSummary.key_skills?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>COMPETENCES CLES</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {cvSummary.key_skills.map((s, i) => <span key={i} style={{ fontSize: 11, background: "#dbeafe", color: "#2563eb", padding: "2px 8px", borderRadius: 10 }}>{s}</span>)}
                  </div>
                </div>
              )}
              {cvSummary.languages?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>LANGUES</span>
                  <div style={{ fontSize: 12, color: "#0f172a", marginTop: 2 }}>{cvSummary.languages.join(", ")}</div>
                </div>
              )}
              {cvSummary.strengths?.length > 0 && (
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>POINTS FORTS</span>
                  <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                    {cvSummary.strengths.map((s, i) => <li key={i} style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Compte-rendus */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Comptes-rendus d'entretien</div>
          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => handleUpload("compte-rendu")} disabled={uploading}>
            {uploading ? "Envoi..." : "+ Ajouter CR"}
          </button>
        </div>
        {crFiles.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucun compte-rendu</p>}
        {crFiles.map(f => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{f.file_name}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(f.created_at).toLocaleDateString("fr-CA")}</span>
            <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => downloadFile(f.id, f.file_name)}>Télécharger</button>
            <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && deleteFile(f.id)}>Suppr.</button>
          </div>
        ))}
      </div>

      {/* Candidatures */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Candidatures ({myCandidatures.length})</div>
        {myCandidatures.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucune candidature</p>}
        {myCandidatures.map(cd => (
          <div key={cd.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{cd.missionTitle} — {cd.missionCompany}</span>
            <span className="tag" style={{ background: cd.stage === "Placé" ? "#d1fae5" : cd.stage === "Refusé" ? "#fee2e2" : "#dbeafe", color: cd.stage === "Placé" ? "#059669" : cd.stage === "Refusé" ? "#dc2626" : "#2563eb" }}>{cd.stage}</span>
          </div>
        ))}
      </div>

      {/* Évaluations IA */}
      {evaluations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Évaluations IA ({evaluations.length})</div>
          {evaluations.map(ev => {
            const scoreColor = ev.score >= 70 ? "#059669" : ev.score >= 40 ? "#d97706" : "#dc2626";
            return (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: ev.score >= 70 ? "#ecfdf5" : ev.score >= 40 ? "#fffbeb" : "#fef2f2", border: `2px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: scoreColor }}>{ev.score}</div>
                <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{ev.missionTitle} — {ev.missionCompany}</span>
                <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && deleteEvaluation(ev.id)}>Suppr.</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Matching IA - missions suggérées */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Missions suggérées par l'IA</div>
          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={findSuggestions} disabled={loadingSuggestions}>
            {loadingSuggestions ? "Analyse en cours..." : "Trouver des missions"}
          </button>
        </div>
        {suggestions.length === 0 && !loadingSuggestions && <p style={{ fontSize: 12, color: "#94a3b8" }}>Cliquez pour lancer le matching IA</p>}
        {suggestions.map((s, i) => {
          const scoreColor = s.score >= 70 ? "#059669" : s.score >= 40 ? "#d97706" : "#dc2626";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.score >= 70 ? "#ecfdf5" : s.score >= 40 ? "#fffbeb" : "#fef2f2", border: `2px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: scoreColor }}>{s.score}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{s.title} — {s.company}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{s.reason}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onEdit}>Modifier</button>
        <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && onDelete()}>Supprimer</button>
      </div>
    </div>
  );
}
