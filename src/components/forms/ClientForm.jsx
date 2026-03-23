import Field from "../common/Field";

export default function ClientForm({ form, setForm, onSave, onCancel, sectors = [], users = [], saving }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Entreprise *"><input className="input" style={{ fontSize: 15, fontWeight: 600, padding: "12px 14px" }} value={form.company || ""} onChange={e => f("company", e.target.value)} placeholder="Nom de l'entreprise" /></Field>
      <Field label="Nom du contact"><input className="input" value={form.name || ""} onChange={e => f("name", e.target.value)} placeholder="Prénom Nom (optionnel)" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Email"><input className="input" type="email" value={form.email || ""} onChange={e => f("email", e.target.value)} placeholder="email@exemple.ca" /></Field>
        <Field label="Telephone"><input className="input" value={form.phone || ""} onChange={e => f("phone", e.target.value)} placeholder="(514) 555-0000" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Statut">
          <select className="input" value={form.status || "Prospect"} onChange={e => f("status", e.target.value)}><option>Prospect</option><option>Client</option></select>
        </Field>
        <Field label="Secteur">
          <input className="input" list="sectors-list" value={form.sector || ""} onChange={e => f("sector", e.target.value)} placeholder="Taper ou choisir..." />
          <datalist id="sectors-list">{sectors.map(s => <option key={s} value={s} />)}</datalist>
        </Field>
        <Field label="CA annuel ($ CAD)"><input className="input" type="number" value={form.revenue || ""} onChange={e => f("revenue", e.target.value)} placeholder="0" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Ville"><input className="input" value={form.city || ""} onChange={e => f("city", e.target.value)} placeholder="Montréal" /></Field>
        <Field label="Propriétaire">
          <select className="input" value={form.owner || ""} onChange={e => f("owner", e.target.value)}>
            <option value="">— Non assigné —</option>
            {users.map(u => <option key={u.id} value={u.fullName}>{u.fullName}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Notes"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.notes || ""} onChange={e => f("notes", e.target.value)} placeholder="Informations..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? "Enregistrement..." : form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}
