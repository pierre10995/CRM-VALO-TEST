import { useState, useEffect } from "react";
import api from "../../services/api";

const STAGE_COLORS = {
  "En attente": { bg: "var(--tint-amber)", color: "var(--c-amber)" },
  "Proposition partenaire": { bg: "var(--tint-green)", color: "var(--c-green)" },
  "Présélectionné": { bg: "var(--tint-blue)", color: "var(--c-blue)" },
  "Soumis": { bg: "var(--line)", color: "var(--muted)" },
  "Entretien": { bg: "var(--tint-amber)", color: "var(--c-amber)" },
  "Finaliste": { bg: "var(--tint-violet)", color: "var(--c-violet)" },
  "Placé": { bg: "var(--tint-green)", color: "var(--c-green)" },
  "Refusé": { bg: "var(--tint-red)", color: "var(--c-red)" },
  "Archivé": { bg: "var(--surface-3)", color: "var(--muted)" },
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

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>Chargement...</div>;
  if (!stats) return <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>Impossible de charger les statistiques.</div>;

  const kpis = [
    { label: "Candidats soumis", value: stats.totalSubmissions, color: "#3b82f6", bg: "var(--tint-blue-soft)" },
    { label: "En cours", value: stats.inProgress, color: "var(--c-amber)", bg: "var(--tint-amber-soft)" },
    { label: "Places", value: stats.placed, color: "var(--c-green)", bg: "var(--tint-green-soft)" },
    { label: "Taux d'acceptation", value: `${stats.acceptanceRate}%`, color: "var(--c-violet)", bg: "var(--tint-violet-soft)" },
    { label: "Taux de placement", value: `${stats.placementRate}%`, color: "var(--c-green)", bg: "var(--tint-green-soft)" },
    { label: "Missions affiliees", value: stats.affiliatedMissions, color: "var(--c-blue)", bg: "var(--tint-blue-soft)" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>Tableau de bord</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>Vue d'ensemble de votre activite</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: "var(--surface)", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color, marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Pipeline breakdown */}
      {stats.stages && Object.keys(stats.stages).length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>Repartition par etape</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(stats.stages).map(([stage, count]) => {
              const sc = STAGE_COLORS[stage] || { bg: "var(--surface-3)", color: "var(--muted)" };
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
        <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>Activite recente</div>
          <div style={{ display: "grid", gap: 6 }}>
            {stats.recentActivity.map(a => {
              const sc = STAGE_COLORS[a.stage] || { bg: "var(--surface-3)", color: "var(--muted)" };
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface-2)", borderRadius: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: sc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: sc.color, flexShrink: 0 }}>
                    {a.candidateName?.[0] || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.candidateName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.missionTitle}</div>
                  </div>
                  <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color, flexShrink: 0 }}>{a.stage}</span>
                  <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{new Date(a.createdAt).toLocaleDateString("fr-CA")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
