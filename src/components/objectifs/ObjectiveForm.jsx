const PERIODS = [
  { id: "mensuel", label: "Mensuel" },
  { id: "trimestriel", label: "Trimestriel" },
  { id: "semestriel", label: "Semestriel" },
  { id: "annuel", label: "Annuel" },
];

const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function periodSubOptions(period, year) {
  if (period === "annuel") return [{ month: null, label: `${year}` }];
  if (period === "semestriel") return [{ month: 1, label: `S1 ${year} (Jan-Juin)` }, { month: 7, label: `S2 ${year} (Juil-Déc)` }];
  if (period === "trimestriel") return [
    { month: 1, label: `T1 (Jan-Mars)` }, { month: 4, label: `T2 (Avr-Juin)` },
    { month: 7, label: `T3 (Juil-Sept)` }, { month: 10, label: `T4 (Oct-Déc)` },
  ];
  return MONTH_NAMES.map((n, i) => ({ month: i + 1, label: n }));
}

export default function ObjectiveForm({ form, setForm, users, selectedPeriod, selectedYear, onSubmit, onCancel }) {
  return (
    <div className="card" style={{ marginBottom: 20, padding: 20, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Nouvel objectif</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Utilisateur *</label>
          <select className="input" value={form.userId || ""} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}>
            <option value="">— Sélectionner —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Période</label>
          <select className="input" value={form.period || selectedPeriod} onChange={e => setForm(p => ({ ...p, period: e.target.value, month: null }))}>
            {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Année</label>
          <input className="input" type="number" value={form.year || selectedYear} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Sous-période</label>
          <select className="input" value={form.month ?? ""} onChange={e => setForm(p => ({ ...p, month: e.target.value === "" ? null : Number(e.target.value) }))}>
            {periodSubOptions(form.period || selectedPeriod, form.year || selectedYear).map(sp => (
              <option key={sp.month ?? "null"} value={sp.month ?? ""}>{sp.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Obj. nouveaux clients</label>
          <input className="input" type="number" value={form.targetNewClients || ""} onChange={e => setForm(p => ({ ...p, targetNewClients: e.target.value }))} placeholder="5" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Obj. CA ($)</label>
          <input className="input" type="number" value={form.targetCA || ""} onChange={e => setForm(p => ({ ...p, targetCA: e.target.value }))} placeholder="50000" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Obj. Total ($)</label>
          <input className="input" type="number" value={form.targetTotal || ""} onChange={e => setForm(p => ({ ...p, targetTotal: e.target.value }))} placeholder="75000" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Notes</label>
          <input className="input" value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Commentaire..." />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSubmit}>Créer l'objectif</button>
      </div>
    </div>
  );
}
