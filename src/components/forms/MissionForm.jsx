import { CONTRACT_TYPES, MISSION_STATUSES, PRIORITIES } from "../../utils/constants";
import Field from "../common/Field";

export default function MissionForm({ form, setForm, onSave, onCancel, contacts, users, fiscalYears }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const clientContacts = contacts.filter(c => c.status === "Client" || c.status === "Prospect");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Titre du poste *"><input className="input" value={form.title || ""} onChange={e => f("title", e.target.value)} placeholder="Développeur Full Stack" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Entreprise *"><input className="input" value={form.company || ""} onChange={e => f("company", e.target.value)} placeholder="Nom entreprise" /></Field>
        <Field label="Lieu"><input className="input" value={form.location || ""} onChange={e => f("location", e.target.value)} placeholder="Montréal" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Field label="Type de contrat">
          <select className="input" value={form.contractType || "CDI"} onChange={e => f("contractType", e.target.value)}>{CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="Statut">
          <select className="input" value={form.status || "Ouverte"} onChange={e => f("status", e.target.value)}>{MISSION_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Priorité">
          <select className="input" value={form.priority || "Normale"} onChange={e => f("priority", e.target.value)}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
        </Field>
        <Field label="Année fiscale">
          <select className="input" value={form.fiscalYearId || ""} onChange={e => f("fiscalYearId", e.target.value)}>
            <option value="">— Aucune —</option>
            {fiscalYears.map(fy => <option key={fy.id} value={fy.id}>{fy.label}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Salaire min ($)"><input className="input" type="number" value={form.salaryMin || ""} onChange={e => f("salaryMin", e.target.value)} placeholder="50000" /></Field>
        <Field label="Salaire max ($)"><input className="input" type="number" value={form.salaryMax || ""} onChange={e => f("salaryMax", e.target.value)} placeholder="80000" /></Field>
        <Field label="Commission ($)"><input className="input" type="number" value={form.commission || ""} onChange={e => f("commission", e.target.value)} placeholder="5000" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Contact client">
          <select className="input" value={form.clientContactId || ""} onChange={e => f("clientContactId", e.target.value)}>
            <option value="">— Aucun —</option>
            {clientContacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
          </select>
        </Field>
        <Field label="Assigné à">
          <select className="input" value={form.assignedTo || ""} onChange={e => f("assignedTo", e.target.value)}>
            <option value="">— Non assigné —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.description || ""} onChange={e => f("description", e.target.value)} placeholder="Description du poste..." /></Field>
      <Field label="Pré-requis"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.requirements || ""} onChange={e => f("requirements", e.target.value)} placeholder="Compétences requises..." /></Field>
      <Field label="Date limite"><input className="input" type="date" value={form.deadline || ""} onChange={e => f("deadline", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave}>{form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}
