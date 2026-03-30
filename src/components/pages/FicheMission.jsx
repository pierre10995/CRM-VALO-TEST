import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtCAD } from "../../utils/constants";
import AuditHistory from "../common/AuditHistory";

export default function FicheMission({ mission: m, onClose, onEdit, onDelete, candidatures }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const loadFiles = async () => {
    const data = await api.get(`/api/files/mission/${m.id}`);
    setFiles(data);
  };

  useEffect(() => { loadFiles(); }, [m.id]);

  const handleUpload = async () => {
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
          missionId: m.id,
          fileType: "offre",
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

  const downloadFile = async (id, name) => {
    try {
      const blob = await api.getBlob(`/api/files/${id}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name || "fichier.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Erreur lors du téléchargement"); }
  };

  const previewFile = async (id, name) => {
    try {
      const blob = await api.getBlob(`/api/files/${id}`);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewName(name || "Document");
    } catch { alert("Erreur lors de la prévisualisation"); }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName("");
  };

  const findSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await api.post(`/api/matching/mission/${m.id}`);
      if (res.ok) { const data = await res.json(); setSuggestions(data); }
      else { const err = await res.json(); alert(err.error || "Erreur"); }
    } catch { alert("Erreur réseau"); }
    setLoadingSuggestions(false);
  };

  const mCandidatures = candidatures.filter(cd => cd.missionId === m.id);

  return (
    <div className="card" style={{ width: 580, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, #dbeafe, #93c5fd)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#2563eb" }}>{m.title[0]}</div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{m.title}</h2>
            <p style={{ fontSize: 13, color: "#64748b" }}>{m.company} — {m.location || "N/A"}</p>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>X</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>TYPE DE CONTRAT</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{m.contractType}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>SALAIRE</div>
          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{m.salaryMin > 0 ? `${fmtCAD(m.salaryMin)} - ${fmtCAD(m.salaryMax)}` : "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>COMMISSION</div>
          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{m.commission > 0 ? fmtCAD(m.commission) : "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>STATUT</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{m.status}</div>
        </div>
        {m.workMode && (
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>MODE DE TRAVAIL</div>
            <div style={{ fontSize: 13, color: "#0f172a" }}>{m.workMode}</div>
          </div>
        )}
      </div>

      {m.description && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>DESCRIPTION</div>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{m.description}</div>
        </div>
      )}
      {m.requirements && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>PRE-REQUIS</div>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{m.requirements}</div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Document de l'offre (PDF)</div>
          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={handleUpload} disabled={uploading}>
            {uploading ? "Envoi..." : "+ Importer PDF"}
          </button>
        </div>
        {files.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucun document importé</p>}
        {files.map(f => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{f.file_name}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(f.created_at).toLocaleDateString("fr-CA")}</span>
            <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => previewFile(f.id, f.file_name)}>Voir</button>
            <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => downloadFile(f.id, f.file_name)}>Télécharger</button>
            <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && deleteFile(f.id)}>Suppr.</button>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>Ce document sera utilisé par l'IA lors de l'évaluation des candidats.</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Candidatures ({mCandidatures.length})</div>
        {mCandidatures.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucune candidature</p>}
        {mCandidatures.map(cd => (
          <div key={cd.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{cd.candidateName}</span>
            <span className="tag" style={{ background: cd.stage === "Placé" ? "#d1fae5" : cd.stage === "Refusé" ? "#fee2e2" : "#dbeafe", color: cd.stage === "Placé" ? "#059669" : cd.stage === "Refusé" ? "#dc2626" : "#2563eb" }}>{cd.stage}</span>
          </div>
        ))}
      </div>

      {/* Matching IA */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Candidats suggérés par l'IA</div>
          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={findSuggestions} disabled={loadingSuggestions}>
            {loadingSuggestions ? "Analyse en cours..." : "Trouver des candidats"}
          </button>
        </div>
        {suggestions.length === 0 && !loadingSuggestions && <p style={{ fontSize: 12, color: "#94a3b8" }}>Cliquez pour lancer le matching IA</p>}
        {suggestions.map((s, i) => {
          const scoreColor = s.score >= 70 ? "#059669" : s.score >= 40 ? "#d97706" : "#dc2626";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.score >= 70 ? "#ecfdf5" : s.score >= 40 ? "#fffbeb" : "#fef2f2", border: `2px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: scoreColor }}>{s.score}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{s.reason}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit history */}
      <AuditHistory entityType="mission" entityId={m.id} />

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onEdit}>Modifier</button>
        <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && onDelete()}>Supprimer</button>
      </div>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={closePreview}>
          <div style={{ background: "#fff", borderRadius: 12, width: "80vw", height: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{previewName}</span>
              <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={closePreview}>Fermer</button>
            </div>
            <iframe src={previewUrl} style={{ flex: 1, border: "none" }} title="Prévisualisation PDF" />
          </div>
        </div>
      )}
    </div>
  );
}
