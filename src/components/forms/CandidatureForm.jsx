import { STAGES } from "../../utils/constants";
import Field from "../common/Field";
import SearchSelect from "../common/SearchSelect";

export default function CandidatureForm({ form, setForm, onSave, onCancel, candidates, missions, saving }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const candidateOptions = candidates.map(c => ({ value: c.id, label: c.name, sub: [c.skills, c.city].filter(Boolean).join(" — ") }));
  const missionOptions = missions.map(m => ({ value: m.id, label: `${m.title} — ${m.company}`, sub: [m.location, m.contractType].filter(Boolean).join(" — ") }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Candidat *">
        <SearchSelect value={form.candidateId || ""} onChange={v => f("candidateId", v)} options={candidateOptions} placeholder="Rechercher un candidat..." />
      </Field>
      <Field label="Poste *">
        <SearchSelect value={form.missionId || ""} onChange={v => f("missionId", v)} options={missionOptions} placeholder="Rechercher un poste..." />
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
