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
  { id: "annuel", label: "Annuel" },
];

const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function fySubPeriods(fy, period) {
  if (!fy || period === "annuel") return [{ value: null, label: fy ? `${fy.label} — Année complète` : "Année complète" }];

  const start = new Date(fy.startDate);
  const end = new Date(fy.endDate);
  const months = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
    d.setMonth(d.getMonth() + 1);
  }

  if (period === "mensuel") {
    return months.map(m => ({ value: m.month, year: m.year, label: m.label }));
  }

  if (period === "trimestriel") {
    const quarters = [];
    for (let i = 0; i < months.length; i += 3) {
      const chunk = months.slice(i, i + 3);
      if (chunk.length === 0) continue;
      const qNum = Math.floor(i / 3) + 1;
      quarters.push({ value: qNum, label: `T${qNum} — ${chunk[0].label} à ${chunk[chunk.length - 1].label}`, months: chunk });
    }
    return quarters;
  }

  return [{ value: null, label: "Année complète" }];
}

function missionInSubPeriod(m, fy, period, sp) {
  if (!m.createdAt || !fy) return false;
  const d = new Date(m.createdAt);
  const fyStart = new Date(fy.startDate);
  const fyEnd = new Date(fy.endDate);
  if (d < fyStart || d > fyEnd) return false;

  if (period === "annuel") return true;

  if (period === "mensuel") {
    return d.getFullYear() === sp.year && (d.getMonth() + 1) === sp.value;
  }

  if (period === "trimestriel" && sp.months) {
    const first = sp.months[0];
    const last = sp.months[sp.months.length - 1];
    const startQ = new Date(first.year, first.month - 1, 1);
    const endQ = new Date(last.year, last.month, 0, 23, 59, 59);
    return d >= startQ && d <= endQ;
  }

  return true;
}

export default function ObjectifsPage({ contacts, missions, candidatures, users, fiscalYears = [], loadAll }) {
  const [selectedPeriod, setSelectedPeriod] = useState("annuel");
  const [selectedFY, setSelectedFY] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { objectives, add, update, remove } = useObjectives();
  const { wonMissions, activeFY, globalCA, caByUser } = useRevenue(missions, users, fiscalYears, selectedFY);

  const clients = contacts.filter(c => c.status === "Client");

  const getActuals = (userId, period, sp) => {
    let userWonMissions = wonMissions.filter(m => !userId || m.assignedTo === userId);
    if (activeFY) {
      userWonMissions = userWonMissions.filter(m => String(m.fiscalYearId) === String(activeFY.id));
      if (period !== "annuel" && sp) {
        userWonMissions = userWonMissions.filter(m => missionInSubPeriod(m, activeFY, period, sp));
      }
    }
    const caRealized = userWonMissions.reduce((s, m) => s + (m.commission || 0), 0);
    const newClients = activeFY ? clients.filter(c => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      return d >= new Date(activeFY.startDate) && d <= new Date(activeFY.endDate);
    }).length : clients.length;
    return { newClients, caRealized, totalRealized: caRealized, missionsCount: userWonMissions.length };
  };

  const handleAdd = async () => {
    if (!addForm.userId || !addForm.fiscalYearId) return;
    const period = addForm.period || selectedPeriod;
    const fyObj = fiscalYears.find(fy => String(fy.id) === String(addForm.fiscalYearId));
    await add({
      userId: Number(addForm.userId),
      period,
      year: fyObj ? new Date(fyObj.startDate).getFullYear() : new Date().getFullYear(),
      month: addForm.month != null ? Number(addForm.month) : null,
      targetNewClients: Number(addForm.targetNewClients) || 0,
      targetCA: Number(addForm.targetCA) || 0,
      targetTotal: Number(addForm.targetTotal) || 0,
      notes: addForm.notes || "",
      fiscalYearId: Number(addForm.fiscalYearId),
    });
    setShowAddForm(false);
    setAddForm({});
  };

  const startEdit = (obj) => {
    setEditingId(obj.id);
    setEditForm({ targetNewClients: obj.targetNewClients, targetCA: obj.targetCA, targetTotal: obj.targetTotal, notes: obj.notes });
  };

  const filteredObjectives = objectives.filter(o => {
    if (o.period !== selectedPeriod) return false;
    if (activeFY) return String(o.fiscalYearId) === String(activeFY.id);
    return true;
  });

  const subPeriods = fySubPeriods(activeFY, selectedPeriod);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Objectifs</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>Suivi des objectifs par utilisateur, connecté au chiffre d'affaires</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAddForm(!showAddForm); setAddForm({ period: selectedPeriod, fiscalYearId: activeFY?.id || "" }); }}>
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

      {/* Period selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
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
      </div>

      {/* CA by user */}
      <UserCAGrid caByUser={caByUser} label={activeFY?.label} />

      {/* Add form */}
      {showAddForm && (
        <ObjectiveForm
          form={addForm} setForm={setAddForm} users={users}
          fiscalYears={fiscalYears} selectedPeriod={selectedPeriod} activeFY={activeFY}
          onSubmit={handleAdd} onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Objectives by sub-period */}
      {activeFY ? subPeriods.map(sp => {
        const periodObjs = filteredObjectives.filter(o => {
          if (selectedPeriod === "annuel") return true;
          return o.month === sp.value;
        });

        return (
          <div key={sp.value ?? "year"} style={{ marginBottom: 24 }}>
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
                  actuals={getActuals(obj.userId, selectedPeriod, sp)}
                  userCA={caByUser.find(u => u.id === obj.userId)}
                  periodLabel={sp.label}
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
      }) : (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>Sélectionnez une année fiscale pour voir les objectifs</p>
          <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>Les années fiscales sont créées dans la page Chiffre d'affaires</p>
        </div>
      )}

      {activeFY && filteredObjectives.length === 0 && !showAddForm && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>Aucun objectif défini pour {activeFY.label} en mode {PERIODS.find(p => p.id === selectedPeriod)?.label.toLowerCase()}</p>
          <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>Cliquez sur « + Définir un objectif » pour commencer</p>
        </div>
      )}
    </div>
  );
}
