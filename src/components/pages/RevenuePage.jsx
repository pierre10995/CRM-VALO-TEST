import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtCAD } from "../../utils/constants";
import useRevenue from "../../hooks/useRevenue";
import KPICard from "../common/KPICard";
import RevenueChart from "../revenue/RevenueChart";
import FiscalYearTable from "../revenue/FiscalYearTable";

export default function RevenuePage({ contacts, missions, candidatures, users, fiscalYears: propFiscalYears, loadAll }) {
  const [activeOnglet, setActiveOnglet] = useState("total");
  const [fiscalYears, setFiscalYears] = useState(propFiscalYears || []);
  const [selectedYear, setSelectedYear] = useState("all");
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYear, setNewYear] = useState({ label: "", startDate: "", endDate: "", target: 0 });
  const [editingYear, setEditingYear] = useState(null);
  const [editYearForm, setEditYearForm] = useState({});

  useEffect(() => { setFiscalYears(propFiscalYears || []); }, [propFiscalYears]);

  const { wonMissions, activeFY, globalCA, caByUser, fyWithCA, filteredWonMissions } = useRevenue(missions, users, fiscalYears, selectedYear);

  const addFiscalYear = async () => {
    if (!newYear.label || !newYear.startDate || !newYear.endDate) return;
    const res = await api.post("/api/fiscal-years", newYear);
    if (res.ok) {
      setNewYear({ label: "", startDate: "", endDate: "", target: 0 });
      setShowAddYear(false);
      if (loadAll) await loadAll();
    }
  };

  const updateFiscalYear = async () => {
    if (!editYearForm.label || !editYearForm.startDate || !editYearForm.endDate) return;
    const res = await api.put(`/api/fiscal-years/${editingYear}`, editYearForm);
    if (res.ok) {
      setEditingYear(null);
      setEditYearForm({});
      if (loadAll) await loadAll();
    }
  };

  const deleteFiscalYear = async (id) => {
    if (!window.confirm("Supprimer cette année fiscale ?")) return;
    await api.del(`/api/fiscal-years/${id}`);
    if (selectedYear === String(id)) setSelectedYear("all");
    if (loadAll) await loadAll();
  };

  const startEditYear = (fy) => {
    setEditingYear(fy.id);
    setEditYearForm({
      label: fy.label,
      startDate: fy.startDate ? fy.startDate.split("T")[0] : "",
      endDate: fy.endDate ? fy.endDate.split("T")[0] : "",
      target: fy.target,
    });
  };

  const maxCommission = Math.max(...filteredWonMissions.map(m => m.commission || 0), 1);

  const onglets = [
    { id: "total", label: "Total" },
    ...users.map(u => ({ id: `user-${u.id}`, label: u.fullName })),
  ];

  let currentCA, currentMissions, currentLabel;
  if (activeOnglet === "total") {
    currentCA = globalCA;
    currentMissions = [...filteredWonMissions].sort((a, b) => (b.commission || 0) - (a.commission || 0));
    currentLabel = "Global";
  } else {
    const userId = Number(activeOnglet.replace("user-", ""));
    const userData = caByUser.find(u => u.id === userId);
    currentCA = userData?.ca || 0;
    currentMissions = [...filteredWonMissions.filter(m => m.assignedTo === userId)].sort((a, b) => (b.commission || 0) - (a.commission || 0));
    currentLabel = userData?.fullName || "";
  }

  const chartData = fyWithCA.map(fy => ({ label: fy.label, ca: fy.ca, target: fy.target }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Chiffre d'affaires</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>CA basé sur les postes pourvus (candidats placés)</p>
        </div>
      </div>

      {/* Chart */}
      <RevenueChart chartData={chartData} />

      {/* Fiscal year management */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Années fiscales</div>
          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => { setShowAddYear(!showAddYear); setEditingYear(null); }}>
            {showAddYear ? "Annuler" : "+ Ajouter une année"}
          </button>
        </div>

        {/* Add form */}
        {showAddYear && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, marginBottom: 16, padding: 14, background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Libellé</label>
              <input className="input" placeholder="2027-2028" value={newYear.label} onChange={e => setNewYear(p => ({ ...p, label: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Début</label>
              <input className="input" type="date" value={newYear.startDate} onChange={e => setNewYear(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Fin</label>
              <input className="input" type="date" value={newYear.endDate} onChange={e => setNewYear(p => ({ ...p, endDate: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Objectif ($)</label>
              <input className="input" type="number" value={newYear.target || ""} onChange={e => setNewYear(p => ({ ...p, target: e.target.value }))} />
            </div>
            <button className="btn btn-primary" style={{ alignSelf: "end", padding: "10px 16px" }} onClick={addFiscalYear}>Ajouter</button>
          </div>
        )}

        {/* Year selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={() => setSelectedYear("all")} className="btn" style={{
            padding: "8px 16px",
            background: selectedYear === "all" ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white",
            color: selectedYear === "all" ? "white" : "#64748b",
            border: selectedYear === "all" ? "none" : "1.5px solid #e2e8f0",
            boxShadow: selectedYear === "all" ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
            fontSize: 13,
          }}>Toutes les années</button>
          {fyWithCA.map(fy => (
            <button key={fy.id} onClick={() => setSelectedYear(String(fy.id))} className="btn" style={{
              padding: "8px 16px",
              background: selectedYear === String(fy.id) ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white",
              color: selectedYear === String(fy.id) ? "white" : "#64748b",
              border: selectedYear === String(fy.id) ? "none" : "1.5px solid #e2e8f0",
              boxShadow: selectedYear === String(fy.id) ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
              fontSize: 13,
            }}>
              {fy.label}
              <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.8 }}>{fmtCAD(fy.ca)}</span>
            </button>
          ))}
        </div>

        {/* Years table */}
        <FiscalYearTable
          fyWithCA={fyWithCA}
          editingYear={editingYear}
          editYearForm={editYearForm}
          setEditYearForm={setEditYearForm}
          onStartEdit={(fy) => { startEditYear(fy); setShowAddYear(false); }}
          onSaveEdit={updateFiscalYear}
          onCancelEdit={() => setEditingYear(null)}
          onDelete={deleteFiscalYear}
        />

        {fyWithCA.length === 0 && !showAddYear && (
          <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: 20 }}>Aucune année fiscale. Cliquez sur « + Ajouter une année » pour commencer.</p>
        )}
      </div>

      {/* User tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setActiveOnglet(o.id)} className="btn" style={{
            padding: "10px 20px",
            background: activeOnglet === o.id ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white",
            color: activeOnglet === o.id ? "white" : "#64748b",
            border: activeOnglet === o.id ? "none" : "1.5px solid #e2e8f0",
            boxShadow: activeOnglet === o.id ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
            fontSize: 13.5,
          }}>{o.label}</button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: activeFY ? "repeat(4, 1fr)" : "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <KPICard label={`CA ${currentLabel}`} value={fmtCAD(currentCA)} bg="#ecfdf5" color="#059669" />
        <KPICard label="Postes gagnés" value={currentMissions.length} bg="#eff6ff" color="#2563eb" />
        <KPICard label="Postes ouverts" value={missions.filter(m => m.status === "Ouverte" || m.status === "En cours").length} bg="#f5f3ff" color="#8b5cf6" />
        {activeFY && (
          <KPICard
            label={`Objectif ${activeFY.label}`}
            value={`${activeFY.target > 0 ? Math.round((currentCA / activeFY.target) * 100) : 0}%`}
            subtitle={`${fmtCAD(currentCA)} / ${fmtCAD(activeFY.target)}`}
            bg={currentCA >= activeFY.target ? "#ecfdf5" : "#fffbeb"}
            color={currentCA >= activeFY.target ? "#059669" : "#d97706"}
          />
        )}
      </div>

      {/* User summary (total tab) */}
      {activeOnglet === "total" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {caByUser.map(u => (
            <div key={u.id} className="card" style={{ cursor: "pointer", border: "1.5px solid transparent", transition: "border 0.2s" }} onClick={() => setActiveOnglet(`user-${u.id}`)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#1d4ed8" }}>{u.fullName[0]}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{u.fullName}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{u.count} poste{u.count > 1 ? "s" : ""} gagné{u.count > 1 ? "s" : ""}</div>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#059669" }}>{fmtCAD(u.ca)}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Voir le détail →</div>
            </div>
          ))}
        </div>
      )}

      {/* Won missions list */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
          {activeOnglet === "total" ? "Postes gagnés" : `Postes gagnés — ${currentLabel}`}
          {activeFY && ` (${activeFY.label})`}
        </h3>
        {currentMissions.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13 }}>Aucun poste gagné</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {currentMissions.map(m => (
            <div key={m.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{m.title}</div>
                  <div style={{ fontSize: 12.5, color: "#64748b" }}>{m.company} — {m.location || "—"}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", whiteSpace: "nowrap" }}>{fmtCAD(m.commission)}</div>
              </div>
              <div style={{ height: 7, background: "#f1f5f9", borderRadius: 4 }}>
                <div style={{ width: `${((m.commission || 0) / maxCommission) * 100}%`, height: "100%", background: "linear-gradient(90deg, #059669, #34d399)", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
