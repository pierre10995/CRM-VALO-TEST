import { useState } from "react";
import { fmtCAD, VALIDATION_STATUSES, VALIDATION_COLORS } from "../../utils/constants";
import FicheCandidat from "./FicheCandidat";

export default function CandidatsPage({ contacts, search, setSearch, onAdd, onEdit, onDelete, onDetail, detailId, setDetailId, candidatures, missions, loadAll }) {
  const [filterSkill, setFilterSkill] = useState("");
  const [filterValidation, setFilterValidation] = useState("");

  const allSkills = [...new Set(contacts.flatMap(c => (c.skills || "").split(",").map(s => s.trim()).filter(Boolean)))].sort();

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.skills || "").toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q);
    const matchSkill = !filterSkill || (c.skills || "").toLowerCase().includes(filterSkill.toLowerCase());
    const matchValidation = !filterValidation || c.validationStatus === filterValidation;
    return matchSearch && matchSkill && matchValidation;
  });
  const detail = contacts.find(c => c.id === detailId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Candidats</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{filtered.length} candidat{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Ajouter un candidat</button>
      </div>
      <input className="input" style={{ marginBottom: 12 }} placeholder="Rechercher par nom, competences, ville..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select className="input" style={{ width: "auto", minWidth: 180 }} value={filterSkill} onChange={e => setFilterSkill(e.target.value)}>
          <option value="">Toutes les compétences</option>
          {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" style={{ width: "auto", minWidth: 200 }} value={filterValidation} onChange={e => setFilterValidation(e.target.value)}>
          <option value="">Tous les statuts validation</option>
          {VALIDATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterSkill || filterValidation) && <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => { setFilterSkill(""); setFilterValidation(""); }}>Réinitialiser filtres</button>}
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {["Candidat", "Ville", "Compétences", "Statut", "Salaire", "Actions"].map(h => (
              <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucun candidat</td></tr>}
            {filtered.map(c => {
              const vc = VALIDATION_COLORS[c.validationStatus];
              return (
              <tr key={c.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }} onClick={() => onDetail(c.id)}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: "#fef3c7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#d97706" }}>{c.name[0]}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.email} {c.phone && `- ${c.phone}`}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: "#374151" }}>{c.city || "—"}</td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(c.skills || "").split(",").filter(Boolean).slice(0, 3).map((s, i) => (
                      <span key={i} style={{ fontSize: 11, background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: 12, fontWeight: 500 }}>{s.trim()}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  {c.validationStatus ? <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: vc?.bg || "#f1f5f9", color: vc?.color || "#64748b" }}>{c.validationStatus}</span> : <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>}
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, fontWeight: 600, color: c.salaryExpectation > 0 ? "#0f172a" : "#cbd5e1" }}>{c.salaryExpectation > 0 ? fmtCAD(c.salaryExpectation) : "—"}</td>
                <td style={{ padding: "14px 20px" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onEdit(c)}>Modifier</button>
                    <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onDelete(c.id)}>Suppr.</button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setDetailId(null)}>
          <FicheCandidat contact={detail} onClose={() => setDetailId(null)} onEdit={() => { onEdit(detail); setDetailId(null); }} onDelete={() => onDelete(detail.id)} candidatures={candidatures} missions={missions} loadAll={loadAll} />
        </div>
      )}
    </div>
  );
}
