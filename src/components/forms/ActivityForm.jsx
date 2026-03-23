import { ACTIVITY_TYPES } from "../../utils/constants";
import Field from "../common/Field";

export default function ActivityForm({ form, setForm, onSave, onCancel, contacts, missions, saving }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Type *">
          <select className="input" value={form.type || "Appel"} onChange={e => f("type", e.target.value)}>{ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="Sujet *"><input className="input" value={form.subject || ""} onChange={e => f("subject", e.target.value)} placeholder="Objet de l'activité" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Contact">
          <select className="input" value={form.contactId || ""} onChange={e => f("contactId", e.target.value)}>
            <option value="">— Aucun —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Mission">
          <select className="input" value={form.missionId || ""} onChange={e => f("missionId", e.target.value)}>
            <option value="">— Aucune —</option>
            {missions.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.description || ""} onChange={e => f("description", e.target.value)} placeholder="Détails..." /></Field>
      <Field label="Échéance"><input className="input" type="datetime-local" value={form.dueDate || ""} onChange={e => f("dueDate", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? "Enregistrement..." : form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}
