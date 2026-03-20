import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtCAD } from "../../utils/constants";

export default function DashboardPage({ stats, activities, contacts, missions, candidatures }) {
  const [reminders, setReminders] = useState([]);
  const [dismissedKeys, setDismissedKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm_dismissed_reminders") || "[]"); } catch { return []; }
  });
  const [partnerSubmissions, setPartnerSubmissions] = useState([]);

  useEffect(() => {
    api.get("/api/auto-reminders").then(setReminders).catch(() => {});
    api.get("/api/partners/submissions").then(setPartnerSubmissions).catch(() => {});
  }, []);

  const reminderKey = (r) => `${r.type}-${r.contactId || ""}-${r.missionId || ""}`;

  const dismissReminder = (r) => {
    const key = reminderKey(r);
    const updated = [...dismissedKeys, key];
    setDismissedKeys(updated);
    localStorage.setItem("crm_dismissed_reminders", JSON.stringify(updated));
  };

  const visibleReminders = reminders.filter(r => !dismissedKeys.includes(reminderKey(r)));

  // Partner proposals: only show "Proposition partenaire" stage (not yet accepted/archived)
  const pendingPartnerProposals = partnerSubmissions.filter(s => s.stage === "Proposition partenaire");

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

      {/* Partner proposal notifications */}
      {pendingPartnerProposals.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: "#f0fdf4", border: "1px solid #a7f3d0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#059669", marginBottom: 14 }}>Propositions partenaires ({pendingPartnerProposals.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingPartnerProposals.slice(0, 8).map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "white", borderRadius: 8, border: "1px solid #d1fae5" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#059669" }}>
                  {s.candidateName?.[0] || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{s.candidateName}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{s.missionTitle} — {s.missionCompany} | par {s.partnerName}</div>
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(s.createdAt).toLocaleDateString("fr-CA")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {visibleReminders.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: "#fffbeb", border: "1px solid #fde68a" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#d97706", marginBottom: 14 }}>Relances suggérées ({visibleReminders.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleReminders.slice(0, 8).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "white", borderRadius: 8, border: "1px solid #fef3c7" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: r.type === "prospect" ? "#dbeafe" : r.type === "candidature" ? "#fef3c7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: r.type === "prospect" ? "#2563eb" : r.type === "candidature" ? "#d97706" : "#dc2626" }}>
                  {r.type === "prospect" ? "P" : r.type === "candidature" ? "C" : "M"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "#0f172a" }}>{r.message}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.days >= 14 ? "#dc2626" : "#d97706", background: r.days >= 14 ? "#fef2f2" : "#fffbeb", padding: "2px 8px", borderRadius: 8 }}>{r.days}j</span>
                <button
                  onClick={() => dismissReminder(r)}
                  title="Marquer comme fait"
                  style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#94a3b8", flexShrink: 0 }}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
