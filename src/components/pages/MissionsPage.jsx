import { useState } from "react";
import { fmtCAD } from "../../utils/constants";
import { exportCsv } from "../../utils/exportCsv";
import FicheMission from "./FicheMission";

export default function MissionsPage({ missions, contacts, users, candidatures, onAdd, onEdit, onDelete }) {
  const [detailMission, setDetailMission] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");

  const statusColors = { "Ouverte": { bg: "#dbeafe", color: "#2563eb" }, "En cours": { bg: "#fef3c7", color: "#d97706" }, "Gagné": { bg: "#d1fae5", color: "#059669" }, "Pourvue": { bg: "#d1fae5", color: "#059669" }, "Fermée": { bg: "#f1f5f9", color: "#64748b" } };
  const priorityColors = { "Basse": "#94a3b8", "Normale": "#3b82f6", "Haute": "#f59e0b", "Urgente": "#dc2626" };
  const statuses = ["Tous", "Ouverte", "En cours", "Gagné", "Pourvue", "Fermée"];

  const filtered = missions.filter(m => {
    const matchStatus = filterStatus === "Tous" || m.status === filterStatus;
    if (!matchStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return m.title.toLowerCase().includes(q) || m.company.toLowerCase().includes(q)
      || (m.location || "").toLowerCase().includes(q) || (m.assignedName || "").toLowerCase().includes(q);
  }).sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "company") return a.company.localeCompare(b.company);
    if (sortBy === "salary") return (b.salaryMax || 0) - (a.salaryMax || 0);
    return new Date(b.createdAt) - new Date(a.createdAt); // date desc
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Postes Ouverts</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{filtered.length} mission{filtered.length > 1 ? "s" : ""}{filterStatus !== "Tous" ? ` (${filterStatus})` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => exportCsv(filtered, [
            { key: "title", label: "Titre" }, { key: "company", label: "Entreprise" }, { key: "location", label: "Ville" },
            { key: "contractType", label: "Type contrat" }, { key: "workMode", label: "Mode" },
            { key: "salaryMin", label: "Salaire min" }, { key: "salaryMax", label: "Salaire max" },
            { key: "status", label: "Statut" }, { key: "priority", label: "Priorité" },
            { key: "assignedName", label: "Assigné à" }, { key: "commission", label: "Commission" },
          ], `missions_${new Date().toISOString().slice(0, 10)}.csv`)}>Exporter CSV</button>
          <button className="btn btn-primary" onClick={onAdd}>+ Nouveau poste</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {statuses.map(s => {
          const active = filterStatus === s;
          const sc = s === "Tous" ? { bg: "#f1f5f9", color: "#64748b" } : statusColors[s] || { bg: "#f1f5f9", color: "#64748b" };
          const count = s === "Tous" ? missions.length : missions.filter(m => m.status === s).length;
          return (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", background: active ? sc.bg : "#f8fafc", color: active ? sc.color : "#94a3b8", outline: active ? `2px solid ${sc.color}` : "1px solid #e2e8f0" }}>
              {s} ({count})
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <input className="input" style={{ flex: 1 }} placeholder="Rechercher par titre, entreprise, ville, recruteur..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" style={{ width: "auto", minWidth: 160 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date">Trier : Plus récent</option>
          <option value="title">Trier : Titre A-Z</option>
          <option value="company">Trier : Entreprise A-Z</option>
          <option value="salary">Trier : Salaire décroissant</option>
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {filtered.map(m => {
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
                {m.workMode && <span>{m.workMode}</span>}
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
      {filtered.length === 0 && <div className="card" style={{ textAlign: "center", color: "#94a3b8" }}>{search ? `Aucun résultat pour « ${search} »` : filterStatus === "Tous" ? "Aucune mission" : `Aucune mission avec le statut « ${filterStatus} »`}</div>}

      {detailMission && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setDetailMission(null)}>
          <FicheMission mission={detailMission} onClose={() => setDetailMission(null)} onEdit={() => { onEdit(detailMission); setDetailMission(null); }} onDelete={() => { onDelete(detailMission.id); setDetailMission(null); }} candidatures={candidatures} />
        </div>
      )}
    </div>
  );
}
