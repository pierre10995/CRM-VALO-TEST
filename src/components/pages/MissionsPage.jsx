import { useState } from "react";
import { fmtCAD } from "../../utils/constants";
import FicheMission from "./FicheMission";

export default function MissionsPage({ missions, contacts, users, candidatures, onAdd, onEdit, onDelete }) {
  const [detailMission, setDetailMission] = useState(null);
  const statusColors = { "Ouverte": { bg: "#dbeafe", color: "#2563eb" }, "En cours": { bg: "#fef3c7", color: "#d97706" }, "Gagné": { bg: "#d1fae5", color: "#059669" }, "Pourvue": { bg: "#d1fae5", color: "#059669" }, "Fermée": { bg: "#f1f5f9", color: "#64748b" } };
  const priorityColors = { "Basse": "#94a3b8", "Normale": "#3b82f6", "Haute": "#f59e0b", "Urgente": "#dc2626" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Postes Ouverts</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{missions.length} mission{missions.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Nouveau poste</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {missions.map(m => {
          const sc = statusColors[m.status] || statusColors["Ouverte"];
          const mCandidatures = candidatures.filter(cd => cd.missionId === m.id);
          return (
            <div key={m.id} className="card" style={{ cursor: "pointer" }} onClick={() => setDetailMission(m)}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{m.title}</h3>
                  <p style={{ fontSize: 13, color: "#64748b" }}>{m.company} - {m.location}</p>
                </div>
                <span className="tag" style={{ background: sc.bg, color: sc.color }}>{m.status}</span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "#64748b", marginBottom: 10 }}>
                <span>{m.contractType}</span>
                <span>{m.salaryMin > 0 ? `${fmtCAD(m.salaryMin)} - ${fmtCAD(m.salaryMax)}` : "—"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: priorityColors[m.priority] || "#3b82f6" }}>{m.priority}</span>
                  {m.assignedName && <span style={{ fontSize: 11, color: "#94a3b8" }}>Assigné: {m.assignedName}</span>}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{mCandidatures.length} candidature{mCandidatures.length > 1 ? "s" : ""}</span>
                  {m.commission > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{fmtCAD(m.commission)}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => onEdit(m)}>Modifier</button>
                <button className="btn btn-danger" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && onDelete(m.id)}>Suppr.</button>
              </div>
            </div>
          );
        })}
      </div>
      {missions.length === 0 && <div className="card" style={{ textAlign: "center", color: "#94a3b8" }}>Aucune mission</div>}

      {detailMission && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setDetailMission(null)}>
          <FicheMission mission={detailMission} onClose={() => setDetailMission(null)} onEdit={() => { onEdit(detailMission); setDetailMission(null); }} onDelete={() => { onDelete(detailMission.id); setDetailMission(null); }} candidatures={candidatures} />
        </div>
      )}
    </div>
  );
}
