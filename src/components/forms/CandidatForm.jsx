import Field from "../common/Field";

export default function CandidatForm({ form, setForm, onSave, onCancel, sectors = [], validationStatuses = [] }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
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
      <Field label="Statut de validation">
        <select className="input" value={form.validationStatus || ""} onChange={e => f("validationStatus", e.target.value)}>
          <option value="">— Non défini —</option>
          {validationStatuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
        </select>
      </Field>
      <Field label="Notes"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.notes || ""} onChange={e => f("notes", e.target.value)} placeholder="Informations..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave}>{form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}
