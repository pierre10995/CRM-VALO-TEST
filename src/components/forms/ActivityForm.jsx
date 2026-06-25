import { useState } from "react";
import { ACTIVITY_TYPES } from "../../utils/constants";
import Field from "../common/Field";
import SearchSelect from "../common/SearchSelect";

// Convertit une date stockée (ISO ou autre) au format attendu par
// <input type="datetime-local"> : "YYYY-MM-DDTHH:mm". Renvoie "" si invalide.
function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return typeof value === "string" ? value.slice(0, 16) : "";
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ActivityForm({ form, setForm, onSave, onCancel, contacts, missions, saving }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [errors, setErrors] = useState({});

  const handleSave = () => {
    const errs = {};
    if (!form.subject?.trim()) errs.subject = "Le sujet est requis";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave();
  };

  const contactOptions = contacts.map(c => ({ value: c.id, label: c.name, sub: [c.status, c.company].filter(Boolean).join(" — ") }));
  const missionOptions = missions.map(m => ({ value: m.id, label: m.title, sub: m.company }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Type *">
          <select className="input" value={form.type || "Appel"} onChange={e => f("type", e.target.value)}>{ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="Sujet *" error={errors.subject}><input className="input" value={form.subject || ""} onChange={e => f("subject", e.target.value)} placeholder="Objet de l'activité" /></Field>
      </div>
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Contact">
          <SearchSelect value={form.contactId || ""} onChange={v => f("contactId", v)} options={contactOptions} placeholder="Rechercher un contact..." />
        </Field>
        <Field label="Mission">
          <SearchSelect value={form.missionId || ""} onChange={v => f("missionId", v)} options={missionOptions} placeholder="Rechercher une mission..." />
        </Field>
      </div>
      <Field label="Description"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.description || ""} onChange={e => f("description", e.target.value)} placeholder="Détails..." /></Field>
      <Field label="Échéance"><input className="input" type="datetime-local" value={toLocalInput(form.dueDate)} onChange={e => f("dueDate", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving && <span className="spinner" />}{saving ? "Enregistrement..." : form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}
