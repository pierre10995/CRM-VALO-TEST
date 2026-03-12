import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtCAD } from "../../utils/constants";

export default function RevenuePage({ contacts, missions, candidatures, users, fiscalYears: propFiscalYears, loadAll }) {
  const [activeOnglet, setActiveOnglet] = useState("total");
  const [fiscalYears, setFiscalYears] = useState(propFiscalYears || []);
  const [selectedYear, setSelectedYear] = useState("all");
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYear, setNewYear] = useState({ label: "", startDate: "", endDate: "", target: 0 });

  useEffect(() => { setFiscalYears(propFiscalYears || []); }, [propFiscalYears]);

  const addFiscalYear = async () => {
    if (!newYear.label || !newYear.startDate || !newYear.endDate) return;
    const res = await api.post("/api/fiscal-years", newYear);
    if (res.ok) {
      setNewYear({ label: "", startDate: "", endDate: "", target: 0 });
      setShowAddYear(false);
      if (loadAll) await loadAll();
    }
  };

  const deleteFiscalYear = async (id) => {
    await api.del(`/api/fiscal-years/${id}`);
    if (selectedYear === String(id)) setSelectedYear("all");
    if (loadAll) await loadAll();
  };

  const wonMissions = missions.filter(m => m.status === "Gagné");

  const filterByYear = (missionList, fyId) => {
    if (!fyId) return missionList;
    return missionList.filter(m => String(m.fiscalYearId) === String(fyId));
  };

  const activeFY = selectedYear !== "all" ? fiscalYears.find(fy => String(fy.id) === selectedYear) : null;
  const filteredWonMissions = activeFY ? filterByYear(wonMissions, activeFY.id) : wonMissions;

  const caTotal = filteredWonMissions.reduce((s, m) => s + (m.commission || 0), 0);

  const caByUser = users.map(u => {
    const userWonMissions = filteredWonMissions.filter(m => m.assignedTo === u.id);
    const userCA = userWonMissions.reduce((s, m) => s + (m.commission || 0), 0);
    return { ...u, wonMissions: userWonMissions, ca: userCA };
  });

  const maxCommission = Math.max(...filteredWonMissions.map(m => m.commission || 0), 1);

  const onglets = [
    { id: "total", label: "Total" },
    ...users.map(u => ({ id: `user-${u.id}`, label: u.fullName })),
  ];

  let currentCA, currentMissions, currentLabel;
  if (activeOnglet === "total") {
    currentCA = caTotal;
    currentMissions = [...filteredWonMissions].sort((a, b) => (b.commission || 0) - (a.commission || 0));
    currentLabel = "Global";
  } else {
    const userId = Number(activeOnglet.replace("user-", ""));
    const userData = caByUser.find(u => u.id === userId);
    currentCA = userData?.ca || 0;
    currentMissions = [...(userData?.wonMissions || [])].sort((a, b) => (b.commission || 0) - (a.commission || 0));
    currentLabel = userData?.fullName || "";
  }

  const chartData = fiscalYears.map(fy => {
    const fyMissions = filterByYear(wonMissions, fy.id);
    const ca = fyMissions.reduce((s, m) => s + (m.commission || 0), 0);
    return { label: fy.label, ca, target: fy.target };
  });
  const chartMax = Math.max(...chartData.map(d => Math.max(d.ca, d.target)), 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Chiffre d'affaires</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>CA basé sur les postes pourvus (candidats placés)</p>
        </div>
      </div>

      {/* Graphique d'évolution */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Évolution du chiffre d'affaires</div>
          <svg viewBox={`0 0 ${Math.max(chartData.length * 160, 400)} 220`} style={{ width: "100%", height: 220 }}>
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <g key={i}>
                <line x1="60" y1={180 - p * 160} x2={60 + chartData.length * 140} y2={180 - p * 160} stroke="#f1f5f9" strokeWidth="1" />
                <text x="55" y={184 - p * 160} textAnchor="end" fontSize="10" fill="#94a3b8">{fmtCAD(chartMax * p).replace(" $ CAD", "")}</text>
              </g>
            ))}
            {chartData.map((d, i) => {
              const x = 80 + i * 140;
              const barH = (d.ca / chartMax) * 160;
              const targetH = (d.target / chartMax) * 160;
              return (
                <g key={d.label}>
                  <rect x={x} y={180 - targetH} width="40" height={targetH} rx="4" fill="#e2e8f0" opacity="0.5" />
                  <rect x={x} y={180 - barH} width="40" height={barH} rx="4" fill={d.ca >= d.target ? "url(#greenGrad)" : "url(#blueGrad)"} />
                  <text x={x + 20} y={175 - barH} textAnchor="middle" fontSize="11" fontWeight="700" fill={d.ca >= d.target ? "#059669" : "#2563eb"}>{fmtCAD(d.ca).replace(" $ CAD", "")}</text>
                  <text x={x + 20} y={198} textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">{d.label}</text>
                  <text x={x + 20} y={212} textAnchor="middle" fontSize="9" fill="#94a3b8">Obj: {fmtCAD(d.target).replace(" $ CAD", "")}</text>
                </g>
              );
            })}
            {chartData.length > 1 && (
              <polyline fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeDasharray="6,3"
                points={chartData.map((d, i) => `${80 + i * 140 + 20},${180 - (d.ca / chartMax) * 160}`).join(" ")} />
            )}
            {chartData.map((d, i) => (
              <circle key={i} cx={80 + i * 140 + 20} cy={180 - (d.ca / chartMax) * 160} r="4" fill="#2563eb" stroke="white" strokeWidth="2" />
            ))}
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#6ee7b7" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: "linear-gradient(#3b82f6, #93c5fd)" }} /> CA réalisé
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: "#e2e8f0" }} /> Objectif
            </div>
          </div>
        </div>
      )}

      {/* Sélecteur d'année + gestion */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Années fiscales</div>
          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => setShowAddYear(!showAddYear)}>
            {showAddYear ? "Annuler" : "+ Ajouter une année"}
          </button>
        </div>

        {showAddYear && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, marginBottom: 14, padding: 14, background: "#f8fafc", borderRadius: 10 }}>
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
            <button className="btn btn-success" style={{ alignSelf: "end", padding: "10px 16px" }} onClick={addFiscalYear}>Ajouter</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setSelectedYear("all")} className="btn" style={{
            padding: "8px 16px",
            background: selectedYear === "all" ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white",
            color: selectedYear === "all" ? "white" : "#64748b",
            border: selectedYear === "all" ? "none" : "1.5px solid #e2e8f0",
            boxShadow: selectedYear === "all" ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
            fontSize: 13,
          }}>Toutes les années</button>
          {fiscalYears.map(fy => (
            <div key={fy.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={() => setSelectedYear(String(fy.id))} className="btn" style={{
                padding: "8px 16px",
                background: selectedYear === String(fy.id) ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white",
                color: selectedYear === String(fy.id) ? "white" : "#64748b",
                border: selectedYear === String(fy.id) ? "none" : "1.5px solid #e2e8f0",
                boxShadow: selectedYear === String(fy.id) ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
                fontSize: 13,
              }}>{fy.label}</button>
              <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => deleteFiscalYear(fy.id)}>X</button>
            </div>
          ))}
        </div>
      </div>

      {/* Onglets utilisateurs */}
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
        <div className="card" style={{ background: "#ecfdf5" }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>CA {currentLabel}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#059669", marginTop: 6 }}>{fmtCAD(currentCA)}</p>
        </div>
        <div className="card" style={{ background: "#eff6ff" }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Postes gagnés</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", marginTop: 6 }}>{currentMissions.length}</p>
        </div>
        <div className="card" style={{ background: "#f5f3ff" }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Postes ouverts</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#8b5cf6", marginTop: 6 }}>{missions.filter(m => m.status === "Ouverte" || m.status === "En cours").length}</p>
        </div>
        {activeFY && (
          <div className="card" style={{ background: currentCA >= activeFY.target ? "#ecfdf5" : "#fffbeb" }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Objectif {activeFY.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: currentCA >= activeFY.target ? "#059669" : "#d97706", marginTop: 6 }}>{activeFY.target > 0 ? Math.round((currentCA / activeFY.target) * 100) : 0}%</p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{fmtCAD(currentCA)} / {fmtCAD(activeFY.target)}</p>
          </div>
        )}
      </div>

      {/* Résumé par utilisateur (onglet Total) */}
      {activeOnglet === "total" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {caByUser.map(u => (
            <div key={u.id} className="card" style={{ cursor: "pointer", border: "1.5px solid transparent", transition: "border 0.2s" }} onClick={() => setActiveOnglet(`user-${u.id}`)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#1d4ed8" }}>{u.fullName[0]}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{u.fullName}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{u.wonMissions.length} poste{u.wonMissions.length > 1 ? "s" : ""} gagné{u.wonMissions.length > 1 ? "s" : ""}</div>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#059669" }}>{fmtCAD(u.ca)}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Voir le détail →</div>
            </div>
          ))}
        </div>
      )}

      {/* Liste des postes gagnés */}
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
