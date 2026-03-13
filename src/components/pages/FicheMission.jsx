import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtCAD } from "../../utils/constants";

export default function FicheMission({ mission: m, onClose, onEdit, onDelete, candidatures }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

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

  const downloadFile = (id) => {
    window.open(`/api/files/${id}`, "_blank");
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
            <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => downloadFile(f.id)}>Télécharger</button>
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

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onEdit}>Modifier</button>
        <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && onDelete()}>Supprimer</button>
      </div>
    </div>
  );
}
