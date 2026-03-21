import { useState } from "react";
import { fmtCAD } from "../../utils/constants";
import { exportCsv } from "../../utils/exportCsv";
import api from "../../services/api";
import FicheCandidat from "./FicheCandidat";
import BulkCvUpload from "../BulkCvUpload";

const COLOR_PRESETS = [
  { bg: "#d1fae5", color: "#059669", name: "Vert" },
  { bg: "#fef3c7", color: "#d97706", name: "Orange" },
  { bg: "#e0e7ff", color: "#4f46e5", name: "Indigo" },
  { bg: "#fee2e2", color: "#dc2626", name: "Rouge" },
  { bg: "#fce7f3", color: "#be185d", name: "Rose" },
  { bg: "#dbeafe", color: "#2563eb", name: "Bleu" },
  { bg: "#f1f5f9", color: "#64748b", name: "Gris" },
];

export default function CandidatsPage({ contacts, search, setSearch, onAdd, onEdit, onDelete, onDetail, detailId, setDetailId, candidatures, missions, loadAll, validationStatuses = [], users = [] }) {
  const [filterSkill, setFilterSkill] = useState("");
  const [filterValidation, setFilterValidation] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColorIdx, setNewStatusColorIdx] = useState(0);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: "", login: "", password: "" });
  const [addUserError, setAddUserError] = useState("");

  // Build color map from dynamic statuses
  const VALIDATION_COLORS = {};
  validationStatuses.forEach(s => { VALIDATION_COLORS[s.label] = { bg: s.bg, color: s.color }; });

  const addStatus = async () => {
    if (!newStatusLabel.trim()) return;
    const preset = COLOR_PRESETS[newStatusColorIdx];
    const res = await api.post("/api/validation-statuses", { label: newStatusLabel.trim(), bg: preset.bg, color: preset.color });
    if (res.ok) {
      setNewStatusLabel("");
      setNewStatusColorIdx(0);
      if (loadAll) await loadAll();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur");
    }
  };

  const deleteStatus = async (id) => {
    if (!window.confirm("Supprimer ce statut de validation ?")) return;
    await api.del(`/api/validation-statuses/${id}`);
    if (loadAll) await loadAll();
  };

  const addUser = async () => {
    setAddUserError("");
    if (!newUser.fullName.trim()) return setAddUserError("Nom complet requis");
    if (!newUser.login.trim()) return setAddUserError("Email requis");
    if (!newUser.password || newUser.password.length < 6) return setAddUserError("Mot de passe requis (min. 6 caractères)");
    const res = await api.post("/api/users", newUser);
    if (res.ok) {
      setNewUser({ fullName: "", login: "", password: "" });
      setShowAddUser(false);
      if (loadAll) await loadAll();
    } else {
      const err = await res.json();
      setAddUserError(err.error || "Erreur");
    }
  };

  const allSkills = [...new Set(contacts.flatMap(c => (c.skills || "").split(",").map(s => s.trim()).filter(Boolean)))].sort();

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.skills || "").toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q);
    const matchSkill = !filterSkill || (c.skills || "").toLowerCase().includes(filterSkill.toLowerCase());
    const matchValidation = !filterValidation || c.validationStatus === filterValidation;
    const matchOwner = !filterOwner || c.owner === filterOwner;
    return matchSearch && matchSkill && matchValidation && matchOwner;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortBy === "name") cmp = a.name.localeCompare(b.name);
    else if (sortBy === "city") cmp = (a.city || "").localeCompare(b.city || "");
    else if (sortBy === "salary") cmp = (a.salaryExpectation || 0) - (b.salaryExpectation || 0);
    else if (sortBy === "date") cmp = new Date(a.createdAt) - new Date(b.createdAt);
    return sortDir === "desc" ? -cmp : cmp;
  });
  const detail = contacts.find(c => c.id === detailId);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };
  const sortIcon = (col) => sortBy === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const handleExportCsv = () => {
    exportCsv(filtered, [
      { key: "name", label: "Nom" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Téléphone" },
      { key: "city", label: "Ville" },
      { key: "skills", label: "Compétences" },
      { key: "validationStatus", label: "Statut validation" },
      { key: "salaryExpectation", label: "Salaire souhaité" },
      { key: "availability", label: "Disponibilité" },
      { key: "owner", label: "Propriétaire" },
      { key: "targetPosition", label: "Poste ciblé" },
    ], `candidats_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Candidats</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{filtered.length} candidat{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className={`btn ${showBulkUpload ? "btn-ghost" : "btn-primary"}`}
            style={{ fontSize: 13 }}
            onClick={() => setShowBulkUpload(!showBulkUpload)}
          >
            {showBulkUpload ? "Fermer l'import CV" : "Import CV en masse"}
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleExportCsv}>Exporter CSV</button>
          <button className="btn btn-primary" onClick={onAdd}>+ Ajouter un candidat</button>
        </div>
      </div>
      {showBulkUpload && (
        <BulkCvUpload onComplete={() => { if (loadAll) loadAll(); }} />
      )}
      <input className="input" style={{ marginBottom: 12 }} placeholder="Rechercher par nom, competences, ville..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select className="input" style={{ width: "auto", minWidth: 180 }} value={filterSkill} onChange={e => setFilterSkill(e.target.value)}>
          <option value="">Toutes les compétences</option>
          {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" style={{ width: "auto", minWidth: 200 }} value={filterValidation} onChange={e => setFilterValidation(e.target.value)}>
          <option value="">Tous les statuts validation</option>
          {validationStatuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
        </select>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <select className="input" style={{ width: "auto", minWidth: 180 }} value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
            <option value="">Tous les propriétaires</option>
            {users.map(u => <option key={u.id} value={u.fullName}>{u.fullName}</option>)}
          </select>
          <button className="btn btn-ghost" style={{ padding: "7px 10px", fontSize: 14, fontWeight: 700, lineHeight: 1 }} onClick={() => { setShowAddUser(!showAddUser); setAddUserError(""); }} title="Ajouter un utilisateur">+</button>
        </div>
        {(filterSkill || filterValidation || filterOwner) && <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => { setFilterSkill(""); setFilterValidation(""); setFilterOwner(""); }}>Réinitialiser filtres</button>}
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px", marginLeft: "auto" }} onClick={() => setShowStatusManager(!showStatusManager)}>
          {showStatusManager ? "Fermer" : "Gérer les statuts"}
        </button>
      </div>

      {/* Add User Panel */}
      {showAddUser && (
        <div className="card" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Ajouter un utilisateur</div>
          <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Nom complet *</label>
              <input className="input" value={newUser.fullName} onChange={e => setNewUser(u => ({ ...u, fullName: e.target.value }))} placeholder="Prénom Nom" />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Email (login) *</label>
              <input className="input" type="email" value={newUser.login} onChange={e => setNewUser(u => ({ ...u, login: e.target.value }))} placeholder="prenom@entreprise.com" />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Mot de passe *</label>
              <input className="input" type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} placeholder="Min. 6 caractères" onKeyDown={e => e.key === "Enter" && addUser()} />
            </div>
            <button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 12 }} onClick={addUser}>Ajouter</button>
          </div>
          {addUserError && <div style={{ marginTop: 8, fontSize: 12, color: "#dc2626", fontWeight: 500 }}>{addUserError}</div>}
        </div>
      )}

      {/* Status Manager */}
      {showStatusManager && (
        <div className="card" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Gestion des statuts de validation</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {validationStatuses.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: s.bg, border: `1px solid ${s.color}20` }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                <button onClick={() => deleteStatus(s.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: s.color, opacity: 0.6, padding: 0, lineHeight: 1 }} title="Supprimer">×</button>
              </div>
            ))}
            {validationStatuses.length === 0 && <span style={{ fontSize: 12, color: "#94a3b8" }}>Aucun statut défini</span>}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Nouveau statut</label>
              <input className="input" value={newStatusLabel} onChange={e => setNewStatusLabel(e.target.value)} placeholder="Ex: En attente, Approuvé..." onKeyDown={e => e.key === "Enter" && addStatus()} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Couleur</label>
              <div style={{ display: "flex", gap: 4 }}>
                {COLOR_PRESETS.map((cp, i) => (
                  <button key={i} onClick={() => setNewStatusColorIdx(i)} style={{
                    width: 28, height: 28, borderRadius: 6, background: cp.bg, border: newStatusColorIdx === i ? `2px solid ${cp.color}` : "2px solid transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: cp.color,
                  }} title={cp.name}>{cp.name[0]}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 12 }} onClick={addStatus}>Ajouter</button>
          </div>
        </div>
      )}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {[{ label: "Candidat", col: "name" }, { label: "Ville", col: "city" }, { label: "Compétences", col: null }, { label: "Statut", col: null }, { label: "Salaire", col: "salary" }, { label: "Actions", col: null }].map(h => (
              <th key={h.label} onClick={() => h.col && handleSort(h.col)} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", cursor: h.col ? "pointer" : "default", userSelect: "none" }}>
                {h.label}{h.col ? sortIcon(h.col) : ""}
              </th>
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
                    <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && onDelete(c.id)}>Suppr.</button>
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
          <FicheCandidat contact={detail} onClose={() => setDetailId(null)} onEdit={() => { onEdit(detail); setDetailId(null); }} onDelete={() => onDelete(detail.id)} candidatures={candidatures} missions={missions} loadAll={loadAll} validationStatuses={validationStatuses} />
        </div>
      )}
    </div>
  );
}
