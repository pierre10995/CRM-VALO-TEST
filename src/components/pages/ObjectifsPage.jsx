import { useState } from "react";
import { fmtCAD } from "../../utils/constants";
import useObjectives from "../../hooks/useObjectives";
import useRevenue from "../../hooks/useRevenue";
import KPICard from "../common/KPICard";
import FiscalYearSelector from "../common/FiscalYearSelector";
import UserCAGrid from "../common/UserCAGrid";
import ObjectiveCard from "../objectifs/ObjectiveCard";
import ObjectiveForm from "../objectifs/ObjectiveForm";

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

function periodLabel(period, month, year) {
  if (period === "annuel") return `${year}`;
  if (period === "semestriel") return `${month <= 6 ? "S1" : "S2"} ${year}`;
  if (period === "trimestriel") return `T${Math.ceil(month / 3)} ${year}`;
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function dateInSubPeriod(dateStr, period, year, month) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const dy = d.getFullYear();
  const dm = d.getMonth() + 1;
  if (period === "annuel") return dy === year;
  if (period === "semestriel") return dy === year && (month <= 6 ? dm >= 1 && dm <= 6 : dm >= 7 && dm <= 12);
  if (period === "trimestriel") return dy === year && dm >= month && dm < month + 3;
  return dy === year && dm === month;
}

export default function ObjectifsPage({ contacts, missions, candidatures, users, fiscalYears = [], loadAll }) {
  const [selectedPeriod, setSelectedPeriod] = useState("annuel");
  const [selectedFY, setSelectedFY] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { objectives, add, update, remove } = useObjectives();
  const { wonMissions, activeFY, globalCA, caByUser } = useRevenue(missions, users, fiscalYears, selectedFY);

  const clients = contacts.filter(c => c.status === "Client" || c.status === "Prospect");

  const getActuals = (userId, period, year, month) => {
    let userWonMissions = wonMissions.filter(m => !userId || m.assignedTo === userId);
    if (activeFY) {
      userWonMissions = userWonMissions.filter(m => String(m.fiscalYearId) === String(activeFY.id));
    }
    if (period !== "annuel" || !activeFY) {
      userWonMissions = userWonMissions.filter(m => dateInSubPeriod(m.createdAt, period, year, month));
    }
    const caRealized = userWonMissions.reduce((s, m) => s + (m.commission || 0), 0);
    const newClients = clients.filter(c => dateInSubPeriod(c.createdAt, period, year, month)).length;
    return { newClients, caRealized, totalRealized: caRealized, missionsCount: userWonMissions.length };
  };

  const handleAdd = async () => {
    if (!addForm.userId || !addForm.period) return;
    await add({
      userId: Number(addForm.userId),
      period: addForm.period,
      year: Number(addForm.year) || selectedYear,
      month: addForm.month != null ? Number(addForm.month) : null,
      targetNewClients: Number(addForm.targetNewClients) || 0,
      targetCA: Number(addForm.targetCA) || 0,
      targetTotal: Number(addForm.targetTotal) || 0,
      notes: addForm.notes || "",
    });
    setShowAddForm(false);
    setAddForm({});
  };

  const startEdit = (obj) => {
    setEditingId(obj.id);
    setEditForm({ targetNewClients: obj.targetNewClients, targetCA: obj.targetCA, targetTotal: obj.targetTotal, notes: obj.notes });
  };

  const filteredObjectives = objectives.filter(o => o.period === selectedPeriod && o.year === selectedYear);
  const subPeriods = periodSubOptions(selectedPeriod, selectedYear);
  const years = [selectedYear - 1, selectedYear, selectedYear + 1];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Objectifs</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>Suivi des objectifs par utilisateur, connecté au chiffre d'affaires</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAddForm(!showAddForm); setAddForm({ period: selectedPeriod, year: selectedYear }); }}>
          {showAddForm ? "Annuler" : "+ Définir un objectif"}
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <KPICard label="Clients actuels" value={clients.length} bg="#eff6ff" color="#2563eb" />
        <KPICard label={`CA ${activeFY ? activeFY.label : "Total"}`} value={fmtCAD(globalCA)} bg="#ecfdf5" color="#059669" />
        <KPICard
          label={activeFY && activeFY.target > 0 ? `Progression ${activeFY.label}` : "Objectifs définis"}
          value={activeFY && activeFY.target > 0 ? `${Math.round((globalCA / activeFY.target) * 100)}%` : objectives.length}
          subtitle={activeFY && activeFY.target > 0 ? `${fmtCAD(globalCA)} / ${fmtCAD(activeFY.target)}` : undefined}
          bg={activeFY && activeFY.target > 0 ? (globalCA >= activeFY.target ? "#ecfdf5" : "#fffbeb") : "#f5f3ff"}
          color={activeFY && activeFY.target > 0 ? (globalCA >= activeFY.target ? "#059669" : "#d97706") : "#8b5cf6"}
        />
        <KPICard
          label="Postes gagnés"
          value={activeFY ? wonMissions.filter(m => String(m.fiscalYearId) === String(activeFY.id)).length : wonMissions.length}
          bg="#fdf2f8" color="#db2777"
        />
      </div>

      {/* Fiscal year selector */}
      <FiscalYearSelector fiscalYears={fiscalYears} selectedFY={selectedFY} onSelect={setSelectedFY} wonMissions={wonMissions} />

      {/* Period + year selector */}
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

      {/* CA by user */}
      <UserCAGrid caByUser={caByUser} label={activeFY?.label} />

      {/* Add form */}
      {showAddForm && (
        <ObjectiveForm
          form={addForm} setForm={setAddForm} users={users}
          selectedPeriod={selectedPeriod} selectedYear={selectedYear}
          onSubmit={handleAdd} onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Objectives by sub-period */}
      {subPeriods.map(sp => {
        const periodObjs = filteredObjectives.filter(o => {
          if (selectedPeriod === "annuel") return true;
          return o.month === sp.month;
        });

        return (
          <div key={sp.month ?? "year"} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 12, padding: "8px 0", borderBottom: "2px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{sp.label}</span>
              {periodObjs.length > 0 && (
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                  {periodObjs.length} objectif{periodObjs.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {periodObjs.length === 0 && (
              <div className="card" style={{ padding: 20, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>Aucun objectif défini pour cette période</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {periodObjs.map(obj => (
                <ObjectiveCard
                  key={obj.id}
                  obj={obj}
                  actuals={getActuals(obj.userId, selectedPeriod, selectedYear, sp.month)}
                  userCA={caByUser.find(u => u.id === obj.userId)}
                  periodLabel={periodLabel(obj.period, obj.month, obj.year)}
                  onEdit={() => startEdit(obj)}
                  onDelete={() => remove(obj.id)}
                  isEditing={editingId === obj.id}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onSaveEdit={() => { update(obj.id, editForm); setEditingId(null); setEditForm({}); }}
                  onCancelEdit={() => setEditingId(null)}
                  clients={clients.length}
                />
              ))}
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
