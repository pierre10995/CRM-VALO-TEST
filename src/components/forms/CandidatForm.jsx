import { useState } from "react";
import api from "../../services/api";
import Field from "../common/Field";

const COLOR_PRESETS = [
  { bg: "#d1fae5", color: "#059669", name: "Vert" },
  { bg: "#fef3c7", color: "#d97706", name: "Orange" },
  { bg: "#e0e7ff", color: "#4f46e5", name: "Indigo" },
  { bg: "#fee2e2", color: "#dc2626", name: "Rouge" },
  { bg: "#fce7f3", color: "#be185d", name: "Rose" },
  { bg: "#dbeafe", color: "#2563eb", name: "Bleu" },
  { bg: "#f1f5f9", color: "#64748b", name: "Gris" },
];

export default function CandidatForm({ form, setForm, onSave, onCancel, sectors = [], validationStatuses = [], onStatusesChanged }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [showStatusMgr, setShowStatusMgr] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColorIdx, setNewColorIdx] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const refreshStatuses = async () => { if (onStatusesChanged) await onStatusesChanged(); };

  const addStatus = async () => {
    if (!newLabel.trim()) return;
    const preset = COLOR_PRESETS[newColorIdx];
    const res = await api.post("/api/validation-statuses", { label: newLabel.trim(), bg: preset.bg, color: preset.color });
    if (res.ok) {
      setNewLabel("");
      setNewColorIdx(0);
      await refreshStatuses();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur");
    }
  };

  const deleteStatus = async (id, label) => {
    if (!window.confirm(`Supprimer le statut « ${label} » ?`)) return;
    await api.del(`/api/validation-statuses/${id}`);
    if (form.validationStatus === label) f("validationStatus", "");
    await refreshStatuses();
  };

  const startEditStatus = (s) => {
    setEditingId(s.id);
    setEditLabel(s.label);
  };

  const saveEditStatus = async (s) => {
    if (!editLabel.trim() || editLabel.trim() === s.label) { setEditingId(null); return; }
    const res = await api.put(`/api/validation-statuses/${s.id}`, { label: editLabel.trim(), bg: s.bg, color: s.color });
    if (res.ok) {
      if (form.validationStatus === s.label) f("validationStatus", editLabel.trim());
      setEditingId(null);
      await refreshStatuses();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nom *"><input className="input" value={form.name || ""} onChange={e => f("name", e.target.value)} placeholder="Prénom Nom" /></Field>
        <Field label="Email"><input className="input" type="email" value={form.email || ""} onChange={e => f("email", e.target.value)} placeholder="email@exemple.ca" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Telephone"><input className="input" value={form.phone || ""} onChange={e => f("phone", e.target.value)} placeholder="(514) 555-0000" /></Field>
        <Field label="Ville"><input className="input" value={form.city || ""} onChange={e => f("city", e.target.value)} placeholder="Montréal" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Salaire souhaité ($ CAD)"><input className="input" type="number" value={form.salaryExpectation || ""} onChange={e => f("salaryExpectation", e.target.value)} placeholder="75000" /></Field>
        <Field label="Disponibilité"><input className="input" value={form.availability || ""} onChange={e => f("availability", e.target.value)} placeholder="Immédiate, 2 semaines..." /></Field>
      </div>
      <Field label="Secteur">
        <input className="input" list="sectors-candidat-list" value={form.sector || ""} onChange={e => f("sector", e.target.value)} placeholder="Taper ou choisir..." />
        <datalist id="sectors-candidat-list">{sectors.map(s => <option key={s} value={s} />)}</datalist>
      </Field>
      <Field label="LinkedIn (URL)"><input className="input" type="url" value={form.linkedin || ""} onChange={e => f("linkedin", e.target.value)} placeholder="https://linkedin.com/in/prenom-nom" /></Field>
      <Field label="Poste ciblé"><input className="input" value={form.targetPosition || ""} onChange={e => f("targetPosition", e.target.value)} placeholder="Développeur Full Stack, Chef de projet..." /></Field>
      <Field label="Compétences (séparées par virgules)"><input className="input" value={form.skills || ""} onChange={e => f("skills", e.target.value)} placeholder="React, Node.js, PostgreSQL..." /></Field>

      {/* Statut de validation + gestionnaire */}
      <Field label="Statut de validation">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select className="input" style={{ flex: 1 }} value={form.validationStatus || ""} onChange={e => f("validationStatus", e.target.value)}>
            <option value="">— Non défini —</option>
            {validationStatuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>
          <button type="button" className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 11, whiteSpace: "nowrap" }} onClick={() => setShowStatusMgr(!showStatusMgr)}>
            {showStatusMgr ? "Fermer" : "Gérer"}
          </button>
        </div>
      </Field>

      {showStatusMgr && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Gérer les statuts</div>

          {/* Liste des statuts existants */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {validationStatuses.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: s.bg }}>
                {editingId === s.id ? (
                  <>
                    <input className="input" style={{ flex: 1, fontSize: 12, padding: "4px 8px", background: "white" }} value={editLabel} onChange={e => setEditLabel(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveEditStatus(s); if (e.key === "Escape") setEditingId(null); }} autoFocus />
                    <button type="button" className="btn btn-primary" style={{ padding: "3px 8px", fontSize: 10 }} onClick={() => saveEditStatus(s)}>OK</button>
                    <button type="button" className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 10 }} onClick={() => setEditingId(null)}>X</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                    <button type="button" onClick={() => startEditStatus(s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: s.color, opacity: 0.7, padding: "2px 4px" }} title="Modifier">Modifier</button>
                    <button type="button" onClick={() => deleteStatus(s.id, s.label)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: s.color, opacity: 0.5, padding: 0, lineHeight: 1 }} title="Supprimer">×</button>
                  </>
                )}
              </div>
            ))}
            {validationStatuses.length === 0 && <span style={{ fontSize: 12, color: "#94a3b8" }}>Aucun statut défini</span>}
          </div>

          {/* Ajout */}
          <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 3, display: "block" }}>Nouveau statut</label>
              <input className="input" style={{ fontSize: 12, padding: "6px 8px" }} value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Ex: En attente..." onKeyDown={e => e.key === "Enter" && addStatus()} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 3, display: "block" }}>Couleur</label>
              <div style={{ display: "flex", gap: 3 }}>
                {COLOR_PRESETS.map((cp, i) => (
                  <button type="button" key={i} onClick={() => setNewColorIdx(i)} style={{
                    width: 24, height: 24, borderRadius: 5, background: cp.bg, border: newColorIdx === i ? `2px solid ${cp.color}` : "2px solid transparent",
                    cursor: "pointer", fontSize: 9, fontWeight: 700, color: cp.color,
                  }} title={cp.name}>{cp.name[0]}</button>
                ))}
              </div>
            </div>
            <button type="button" className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 11 }} onClick={addStatus}>+</button>
          </div>
        </div>
      )}

      <Field label="Notes"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.notes || ""} onChange={e => f("notes", e.target.value)} placeholder="Informations..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave}>{form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}
