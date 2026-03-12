import { fmtCAD } from "../../utils/constants";

export default function DashboardPage({ stats, activities, contacts, missions, candidatures }) {
  const totalClients = contacts.filter(c => c.status === "Client").length;
  const totalCandidats = contacts.filter(c => c.status === "Candidat").length;
  const missionsOuvertes = missions.filter(m => m.status === "Ouverte" || m.status === "En cours").length;
  const placements = candidatures.filter(cd => cd.stage === "Placé").length;
  const totalRevenue = contacts.filter(c => c.status === "Client").reduce((s, c) => s + (c.revenue || 0), 0);
  const placedMissionIds = new Set(candidatures.filter(cd => cd.stage === "Placé").map(cd => cd.missionId));
  const totalCommissions = missions.filter(m => placedMissionIds.has(m.id)).reduce((s, m) => s + (m.commission || 0), 0);
  const recentActivities = activities.slice(0, 8);

  const kpis = [
    { label: "Clients", value: totalClients, color: "#10b981", bg: "#ecfdf5" },
    { label: "Candidats", value: totalCandidats, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Missions actives", value: missionsOuvertes, color: "#3b82f6", bg: "#eff6ff" },
    { label: "Placements", value: placements, color: "#8b5cf6", bg: "#f5f3ff" },
    { label: "CA Total (placements)", value: fmtCAD(totalCommissions), color: "#059669", bg: "#ecfdf5" },
    { label: "CA Clients", value: fmtCAD(totalRevenue), color: "#dc2626", bg: "#fef2f2" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Dashboard</h1>
        <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{new Date().toLocaleDateString("fr-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="card" style={{ background: kpi.bg }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: kpi.color, marginTop: 8 }}>{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Activités récentes</h3>
        {recentActivities.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13 }}>Aucune activité</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentActivities.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: a.completed ? "#d1fae5" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {a.type === "Appel" ? "T" : a.type === "Email" ? "@" : a.type === "Réunion" ? "R" : "N"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", textDecoration: a.completed ? "line-through" : "none" }}>{a.subject}</div>
                <div style={{ fontSize: 11.5, color: "#64748b" }}>{a.contactName && `${a.contactName} - `}{a.type} - {new Date(a.createdAt).toLocaleDateString("fr-CA")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
