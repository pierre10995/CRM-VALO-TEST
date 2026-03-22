import { useState } from "react";
import { fmtCAD } from "../../utils/constants";

export default function ClientsPage({ contacts, missions, candidatures, users, search, setSearch, filterStatus, setFilterStatus, onAdd, onEdit, onDelete, onDetail, detailId, setDetailId }) {
  const [filterOwner, setFilterOwner] = useState("");
  // Compute total commissions from placed candidates per company
  const companyRevenue = {};
  (candidatures || []).filter(cd => cd.stage === "Placé").forEach(cd => {
    const mission = (missions || []).find(m => m.id === cd.missionId);
    if (mission && mission.company) {
      const key = mission.company.toLowerCase();
      companyRevenue[key] = (companyRevenue[key] || 0) + (mission.commission || 0);
    }
  });
  const getRevenue = (c) => companyRevenue[c.company?.toLowerCase()] || 0;

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Tous" || c.status === filterStatus;
    const matchOwner = !filterOwner || c.owner === filterOwner;
    return matchSearch && matchStatus && matchOwner;
  });
  const detail = contacts.find(c => c.id === detailId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Clients & Prospects</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{filtered.length} entreprise{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Ajouter</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input className="input" style={{ flex: 1 }} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        {["Tous", "Client", "Prospect"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className="btn" style={{ padding: "9px 14px", background: filterStatus === s ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white", color: filterStatus === s ? "white" : "#64748b", border: filterStatus === s ? "none" : "1.5px solid #e2e8f0" }}>{s}</button>
        ))}
        <select className="input" style={{ width: "auto", minWidth: 180 }} value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
          <option value="">Tous les propriétaires</option>
          {(users || []).map(u => <option key={u.id} value={u.fullName}>{u.fullName}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {["Entreprise", "Secteur", "Statut", "CA ($ CAD)", "Actions"].map(h => (
              <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucune entreprise</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }} onClick={() => onDetail(c.id)}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: "#dbeafe", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>{(c.company || c.name)[0]}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{c.company}</div>
                      {c.name && <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.name}{c.email ? ` · ${c.email}` : ""}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px" }}><span style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "3px 9px", borderRadius: 6 }}>{c.sector}</span></td>
                <td style={{ padding: "14px 20px" }}><span className="tag" style={{ background: c.status === "Client" ? "#d1fae5" : "#dbeafe", color: c.status === "Client" ? "#059669" : "#2563eb" }}>{c.status}</span></td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, fontWeight: 700, color: getRevenue(c) > 0 ? "#0f172a" : "#cbd5e1" }}>{getRevenue(c) > 0 ? fmtCAD(getRevenue(c)) : "—"}</td>
                <td style={{ padding: "14px 20px" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onEdit(c)}>Modifier</button>
                    <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && onDelete(c.id)}>Suppr.</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setDetailId(null)}>
          <div className="card" style={{ width: 420, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{detail.company}</h2>
                {detail.name && <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{detail.name}</p>}
              </div>
              <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={() => setDetailId(null)}>X</button>
            </div>
            <span className="tag" style={{ background: detail.status === "Client" ? "#d1fae5" : "#dbeafe", color: detail.status === "Client" ? "#059669" : "#2563eb", marginBottom: 16, display: "inline-flex" }}>{detail.status}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {detail.email && <div style={{ fontSize: 13.5, color: "#374151" }}>Email: {detail.email}</div>}
              {detail.phone && <div style={{ fontSize: 13.5, color: "#374151" }}>Tel: {detail.phone}</div>}
              {detail.city && <div style={{ fontSize: 13.5, color: "#374151" }}>Ville: {detail.city}</div>}
              <div style={{ fontSize: 13.5, color: "#374151" }}>Secteur: {detail.sector}</div>
              {getRevenue(detail) > 0 && <div style={{ fontSize: 15, fontWeight: 700, color: "#059669", marginTop: 8 }}>CA (placements): {fmtCAD(getRevenue(detail))}</div>}
              {detail.notes && <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", marginTop: 8 }}><p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>NOTES</p><p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{detail.notes}</p></div>}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => { onEdit(detail); setDetailId(null); }}>Modifier</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && onDelete(detail.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
