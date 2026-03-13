import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtCAD } from "../../utils/constants";

const PERIODS = [
  { id: "mensuel", label: "Mensuel", months: 1 },
  { id: "trimestriel", label: "Trimestriel (3 mois)", months: 3 },
  { id: "semestriel", label: "Semestriel (6 mois)", months: 6 },
  { id: "annuel", label: "Annuel", months: 12 },
];

const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function getQuarterLabel(month) { return `T${Math.ceil(month / 3)}`; }
function getSemesterLabel(month) { return month <= 6 ? "S1" : "S2"; }

function periodLabel(period, month, year) {
  if (period === "annuel") return `${year}`;
  if (period === "semestriel") return `${getSemesterLabel(month)} ${year}`;
  if (period === "trimestriel") return `${getQuarterLabel(month)} ${year}`;
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function periodOptions(period, year) {
  if (period === "annuel") return [{ month: null, label: `${year}` }];
  if (period === "semestriel") return [{ month: 1, label: `S1 ${year} (Jan-Juin)` }, { month: 7, label: `S2 ${year} (Juil-Déc)` }];
  if (period === "trimestriel") return [
    { month: 1, label: `T1 ${year} (Jan-Mars)` }, { month: 4, label: `T2 ${year} (Avr-Juin)` },
    { month: 7, label: `T3 ${year} (Juil-Sept)` }, { month: 10, label: `T4 ${year} (Oct-Déc)` },
  ];
  return MONTH_NAMES.map((n, i) => ({ month: i + 1, label: `${n} ${year}` }));
}

// Check if a date falls within a period
function dateInPeriod(date, period, year, month) {
  if (!date) return false;
  const d = new Date(date);
  const dy = d.getFullYear();
  const dm = d.getMonth() + 1;
  if (period === "annuel") return dy === year;
  if (period === "semestriel") return dy === year && (month <= 6 ? dm <= 6 : dm >= 7);
  if (period === "trimestriel") return dy === year && dm >= month && dm < month + 3;
  return dy === year && dm === month;
}

export default function ObjectifsPage({ contacts, missions, candidatures, users }) {
  const [objectives, setObjectives] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("mensuel");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const loadObjectives = async () => {
    const data = await api.get("/api/objectives");
    setObjectives(data);
  };
  useEffect(() => { loadObjectives(); }, []);

  const clients = contacts.filter(c => c.status === "Client" || c.status === "Prospect");
  const wonMissions = missions.filter(m => m.status === "Gagné");

  // Compute actual results for a user in a given period
  const getActuals = (userId, period, year, month) => {
    // New clients: contacts created in period with status Client
    const newClients = clients.filter(c => {
      if (!c.createdAt) return false;
      return dateInPeriod(c.createdAt, period, year, month);
    }).length;

    // CA: commissions from won missions assigned to user in period
    const userWonMissions = wonMissions.filter(m => {
      const matchUser = !userId || m.assignedTo === userId;
      const matchPeriod = dateInPeriod(m.createdAt, period, year, month);
      return matchUser && matchPeriod;
    });
    const caRealized = userWonMissions.reduce((s, m) => s + (m.commission || 0), 0);

    // Total = CA here as well (could be expanded)
    return { newClients, caRealized, totalRealized: caRealized, missionsCount: userWonMissions.length };
  };

  const handleAdd = async () => {
    if (!addForm.userId || !addForm.period) return;
    const res = await api.post("/api/objectives", {
      userId: Number(addForm.userId),
      period: addForm.period,
      year: Number(addForm.year) || selectedYear,
      month: addForm.month != null ? Number(addForm.month) : null,
      targetNewClients: Number(addForm.targetNewClients) || 0,
      targetCA: Number(addForm.targetCA) || 0,
      targetTotal: Number(addForm.targetTotal) || 0,
    });
    if (res.id || res.ok !== false) {
      setShowAddForm(false);
      setAddForm({});
      await loadObjectives();
    }
  };

  const handleSaveEdit = async (id) => {
    const res = await api.put(`/api/objectives/${id}`, editForm);
    if (res.id || res.ok !== false) {
      setEditingId(null);
      setEditForm({});
      await loadObjectives();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet objectif ?")) return;
    await api.del(`/api/objectives/${id}`);
    await loadObjectives();
  };

  const startEdit = (obj) => {
    setEditingId(obj.id);
    setEditForm({ targetNewClients: obj.targetNewClients, targetCA: obj.targetCA, targetTotal: obj.targetTotal, notes: obj.notes });
  };

  // Filter objectives for selected period and year
  const filteredObjectives = objectives.filter(o => o.period === selectedPeriod && o.year === selectedYear);

  // Period sub-options for the year
  const subPeriods = periodOptions(selectedPeriod, selectedYear);

  const years = [selectedYear - 1, selectedYear, selectedYear + 1];

  const totalClients = clients.length;

  const pct = (actual, target) => target > 0 ? Math.min(Math.round((actual / target) * 100), 999) : 0;
  const pctColor = (p) => p >= 100 ? "#059669" : p >= 50 ? "#2563eb" : "#d97706";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Objectifs</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>Suivi des objectifs par utilisateur et période</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAddForm(!showAddForm); setAddForm({ period: selectedPeriod, year: selectedYear }); }}>
          {showAddForm ? "Annuler" : "+ Définir un objectif"}
        </button>
      </div>

      {/* KPIs globaux */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ background: "#eff6ff" }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Clients actuels</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", marginTop: 6 }}>{totalClients}</p>
        </div>
        <div className="card" style={{ background: "#ecfdf5" }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>CA Total (Gagné)</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#059669", marginTop: 6 }}>{fmtCAD(wonMissions.reduce((s, m) => s + (m.commission || 0), 0))}</p>
        </div>
        <div className="card" style={{ background: "#f5f3ff" }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Objectifs définis</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#8b5cf6", marginTop: 6 }}>{objectives.length}</p>
        </div>
      </div>

      {/* Sélecteurs période + année */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setSelectedPeriod(p.id)} className="btn" style={{
              padding: "8px 16px", fontSize: 13,
              background: selectedPeriod === p.id ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white",
              color: selectedPeriod === p.id ? "white" : "#64748b",
              border: selectedPeriod === p.id ? "none" : "1.5px solid #e2e8f0",
              boxShadow: selectedPeriod === p.id ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
            }}>{p.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {years.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)} className="btn" style={{
              padding: "6px 16px", fontSize: 13,
              background: selectedYear === y ? "#0f172a" : "white",
              color: selectedYear === y ? "white" : "#64748b",
              border: selectedYear === y ? "none" : "1.5px solid #e2e8f0",
            }}>{y}</button>
          ))}
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: 20, padding: 20, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Nouvel objectif</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Utilisateur *</label>
              <select className="input" value={addForm.userId || ""} onChange={e => setAddForm(p => ({ ...p, userId: e.target.value }))}>
                <option value="">— Sélectionner —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Période</label>
              <select className="input" value={addForm.period || selectedPeriod} onChange={e => setAddForm(p => ({ ...p, period: e.target.value, month: null }))}>
                {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Sous-période</label>
              <select className="input" value={addForm.month ?? ""} onChange={e => setAddForm(p => ({ ...p, month: e.target.value === "" ? null : Number(e.target.value) }))}>
                {periodOptions(addForm.period || selectedPeriod, addForm.year || selectedYear).map(sp => (
                  <option key={sp.month ?? "null"} value={sp.month ?? ""}>{sp.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Obj. nouveaux clients</label>
              <input className="input" type="number" value={addForm.targetNewClients || ""} onChange={e => setAddForm(p => ({ ...p, targetNewClients: e.target.value }))} placeholder="5" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Obj. CA ($)</label>
              <input className="input" type="number" value={addForm.targetCA || ""} onChange={e => setAddForm(p => ({ ...p, targetCA: e.target.value }))} placeholder="50000" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Obj. Total ($)</label>
              <input className="input" type="number" value={addForm.targetTotal || ""} onChange={e => setAddForm(p => ({ ...p, targetTotal: e.target.value }))} placeholder="75000" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleAdd}>Créer l'objectif</button>
          </div>
        </div>
      )}

      {/* Objectifs par sous-période */}
      {subPeriods.map(sp => {
        const periodObjs = filteredObjectives.filter(o => {
          if (selectedPeriod === "annuel") return true;
          return o.month === sp.month;
        });

        if (periodObjs.length === 0 && !showAddForm) return null;

        return (
          <div key={sp.month ?? "year"} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 12, padding: "8px 0", borderBottom: "2px solid #e2e8f0" }}>
              {sp.label}
            </div>

            {periodObjs.length === 0 && (
              <div className="card" style={{ padding: 20, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>Aucun objectif défini pour cette période</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {periodObjs.map(obj => {
                const actuals = getActuals(obj.userId, selectedPeriod, selectedYear, sp.month);
                const pctClients = pct(actuals.newClients, obj.targetNewClients);
                const pctCA = pct(actuals.caRealized, obj.targetCA);
                const pctTotal = pct(actuals.totalRealized, obj.targetTotal);
                const isEditing = editingId === obj.id;

                return (
                  <div key={obj.id} className="card" style={{ padding: 18 }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#1d4ed8" }}>
                          {obj.userName?.[0] || "?"}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{obj.userName}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{periodLabel(obj.period, obj.month, obj.year)}</div>
                        </div>
                      </div>
                      {!isEditing && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => startEdit(obj)}>Modifier</button>
                          <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleDelete(obj.id)}>Suppr.</button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Nouveaux clients</label>
                            <input className="input" type="number" style={{ fontSize: 12, padding: "6px 8px" }} value={editForm.targetNewClients || ""} onChange={e => setEditForm(p => ({ ...p, targetNewClients: e.target.value }))} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>CA ($)</label>
                            <input className="input" type="number" style={{ fontSize: 12, padding: "6px 8px" }} value={editForm.targetCA || ""} onChange={e => setEditForm(p => ({ ...p, targetCA: e.target.value }))} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Total ($)</label>
                            <input className="input" type="number" style={{ fontSize: 12, padding: "6px 8px" }} value={editForm.targetTotal || ""} onChange={e => setEditForm(p => ({ ...p, targetTotal: e.target.value }))} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setEditingId(null)}>Annuler</button>
                          <button className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => handleSaveEdit(obj.id)}>Sauver</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Nouveaux clients */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>Nouveaux clients</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: pctColor(pctClients) }}>{actuals.newClients} / {obj.targetNewClients} ({pctClients}%)</span>
                          </div>
                          <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                            <div style={{ width: `${Math.min(pctClients, 100)}%`, height: "100%", background: pctClients >= 100 ? "linear-gradient(90deg, #059669, #34d399)" : "linear-gradient(90deg, #3b82f6, #93c5fd)", borderRadius: 3, transition: "width 0.3s" }} />
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>sur {totalClients} clients actuels</div>
                        </div>

                        {/* CA en cours */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>CA en cours</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: pctColor(pctCA) }}>{fmtCAD(actuals.caRealized)} / {fmtCAD(obj.targetCA)} ({pctCA}%)</span>
                          </div>
                          <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                            <div style={{ width: `${Math.min(pctCA, 100)}%`, height: "100%", background: pctCA >= 100 ? "linear-gradient(90deg, #059669, #34d399)" : "linear-gradient(90deg, #3b82f6, #93c5fd)", borderRadius: 3, transition: "width 0.3s" }} />
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{actuals.missionsCount} poste{actuals.missionsCount > 1 ? "s" : ""} gagné{actuals.missionsCount > 1 ? "s" : ""}</div>
                        </div>

                        {/* Objectif total */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Objectif total</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: pctColor(pctTotal) }}>{fmtCAD(actuals.totalRealized)} / {fmtCAD(obj.targetTotal)} ({pctTotal}%)</span>
                          </div>
                          <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4 }}>
                            <div style={{ width: `${Math.min(pctTotal, 100)}%`, height: "100%", background: pctTotal >= 100 ? "linear-gradient(90deg, #059669, #34d399)" : pctTotal >= 50 ? "linear-gradient(90deg, #3b82f6, #93c5fd)" : "linear-gradient(90deg, #d97706, #fbbf24)", borderRadius: 4, transition: "width 0.3s" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filteredObjectives.length === 0 && !showAddForm && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>Aucun objectif défini pour {selectedYear} en mode {PERIODS.find(p => p.id === selectedPeriod)?.label.toLowerCase()}</p>
          <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>Cliquez sur « + Définir un objectif » pour commencer</p>
        </div>
      )}
    </div>
  );
}
