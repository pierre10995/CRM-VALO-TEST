import { STAGES } from "../../utils/constants";
import Field from "../common/Field";

export default function CandidatureForm({ form, setForm, onSave, onCancel, candidates, missions, saving }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Candidat *">
        <select className="input" value={form.candidateId || ""} onChange={e => f("candidateId", e.target.value)}>
          <option value="">-- Sélectionner --</option>
          {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Poste *">
        <select className="input" value={form.missionId || ""} onChange={e => f("missionId", e.target.value)}>
          <option value="">-- Sélectionner --</option>
          {missions.map(m => <option key={m.id} value={m.id}>{m.title} — {m.company}</option>)}
        </select>
      </Field>
      <Field label="Étape">
        <select className="input" value={form.stage || "Présélectionné"} onChange={e => f("stage", e.target.value)}>{STAGES.map(s => <option key={s}>{s}</option>)}</select>
      </Field>
      <Field label="Note (1-5)">
        <select className="input" value={form.rating || 0} onChange={e => f("rating", Number(e.target.value))}>
          {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? "—" : n}</option>)}
        </select>
      </Field>
      <Field label="Date entretien"><input className="input" type="datetime-local" value={form.interviewDate || ""} onChange={e => f("interviewDate", e.target.value)} /></Field>
      <Field label="Notes"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.notes || ""} onChange={e => f("notes", e.target.value)} placeholder="Commentaires..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? "Enregistrement..." : form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}
