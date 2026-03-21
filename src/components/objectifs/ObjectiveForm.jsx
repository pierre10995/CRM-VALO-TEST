const PERIODS = [
  { id: "mensuel", label: "Mensuel" },
  { id: "trimestriel", label: "Trimestriel" },
  { id: "annuel", label: "Annuel" },
];

const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function fySubOptions(fy, period) {
  if (!fy || period === "annuel") return [{ value: null, label: "Année complète" }];

  const start = new Date(fy.startDate);
  const end = new Date(fy.endDate);
  const months = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
    d.setMonth(d.getMonth() + 1);
  }

  if (period === "mensuel") {
    return months.map(m => ({ value: m.month, label: m.label }));
  }

  if (period === "trimestriel") {
    const quarters = [];
    for (let i = 0; i < months.length; i += 3) {
      const chunk = months.slice(i, i + 3);
      if (chunk.length === 0) continue;
      const qNum = Math.floor(i / 3) + 1;
      quarters.push({ value: qNum, label: `T${qNum} — ${chunk[0].label} à ${chunk[chunk.length - 1].label}` });
    }
    return quarters;
  }

  return [{ value: null, label: "Année complète" }];
}

export default function ObjectiveForm({ form, setForm, users, fiscalYears, selectedPeriod, activeFY, onSubmit, onCancel }) {
  const selectedFYObj = fiscalYears.find(fy => String(fy.id) === String(form.fiscalYearId)) || activeFY;

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
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Année fiscale *</label>
          <select className="input" value={form.fiscalYearId || ""} onChange={e => setForm(p => ({ ...p, fiscalYearId: e.target.value, month: null }))}>
            <option value="">— Sélectionner —</option>
            {fiscalYears.map(fy => <option key={fy.id} value={fy.id}>{fy.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Période</label>
          <select className="input" value={form.period || selectedPeriod} onChange={e => setForm(p => ({ ...p, period: e.target.value, month: null }))}>
            {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Sous-période</label>
          <select className="input" value={form.month ?? ""} onChange={e => setForm(p => ({ ...p, month: e.target.value === "" ? null : Number(e.target.value) }))}>
            {fySubOptions(selectedFYObj, form.period || selectedPeriod).map((sp, i) => (
              <option key={sp.value ?? `null-${i}`} value={sp.value ?? ""}>{sp.label}</option>
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
