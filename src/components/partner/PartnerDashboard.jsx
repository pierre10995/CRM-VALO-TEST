import { useState, useEffect } from "react";
import api from "../../services/api";

const STAGE_COLORS = {
  "En attente": { bg: "#fef3c7", color: "#d97706" },
  "Proposition partenaire": { bg: "#d1fae5", color: "#059669" },
  "Présélectionné": { bg: "#dbeafe", color: "#2563eb" },
  "Soumis": { bg: "#e2e8f0", color: "#64748b" },
  "Entretien": { bg: "#fef3c7", color: "#d97706" },
  "Finaliste": { bg: "#ede9fe", color: "#7c3aed" },
  "Placé": { bg: "#d1fae5", color: "#059669" },
  "Refusé": { bg: "#fee2e2", color: "#dc2626" },
  "Archivé": { bg: "#f1f5f9", color: "#94a3b8" },
};

export default function PartnerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/partner/stats")
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Chargement...</div>;
  if (!stats) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Impossible de charger les statistiques.</div>;

  const kpis = [
    { label: "Candidats soumis", value: stats.totalSubmissions, color: "#3b82f6", bg: "#eff6ff" },
    { label: "En cours", value: stats.inProgress, color: "#d97706", bg: "#fffbeb" },
    { label: "Places", value: stats.placed, color: "#059669", bg: "#ecfdf5" },
    { label: "Taux d'acceptation", value: `${stats.acceptanceRate}%`, color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Taux de placement", value: `${stats.placementRate}%`, color: "#059669", bg: "#ecfdf5" },
    { label: "Missions affiliees", value: stats.affiliatedMissions, color: "#2563eb", bg: "#eff6ff" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Tableau de bord</h2>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>Vue d'ensemble de votre activite</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: "white", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color, marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Pipeline breakdown */}
      {stats.stages && Object.keys(stats.stages).length > 0 && (
        <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Repartition par etape</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(stats.stages).map(([stage, count]) => {
              const sc = STAGE_COLORS[stage] || { bg: "#f1f5f9", color: "#64748b" };
              return (
                <div key={stage} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                  background: sc.bg, borderRadius: 10,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: sc.color }}>{stage}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: sc.color }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Activite recente</div>
          <div style={{ display: "grid", gap: 6 }}>
            {stats.recentActivity.map(a => {
              const sc = STAGE_COLORS[a.stage] || { bg: "#f1f5f9", color: "#64748b" };
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: sc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: sc.color, flexShrink: 0 }}>
                    {a.candidateName?.[0] || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.candidateName}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.missionTitle}</div>
                  </div>
                  <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color, flexShrink: 0 }}>{a.stage}</span>
                  <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>{new Date(a.createdAt).toLocaleDateString("fr-CA")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
