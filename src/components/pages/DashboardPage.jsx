import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtCAD } from "../../utils/constants";
import { wonMissionsForFY, sumCommission, findCurrentFY } from "../../utils/revenue";
import usePersistedState from "../../hooks/usePersistedState";

export default function DashboardPage({ activities, contacts, missions, candidatures, fiscalYears, loaded = true, onNavigate, goToContact, goToMission, onPlanFollowUp, currentUser, isAdmin }) {
  const [reminders, setReminders] = useState([]);
  const [dismissedKeys, setDismissedKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm_dismissed_reminders") || "[]"); } catch { return []; }
  });
  const [partnerSubmissions, setPartnerSubmissions] = useState([]);
  const [scope, setScope] = usePersistedState("dashboard.scope", "all"); // "all" | "me"

  useEffect(() => {
    api.get("/api/auto-reminders").then(data => { if (Array.isArray(data)) setReminders(data); }).catch(() => {});
    api.get("/api/partners/submissions").then(data => { if (Array.isArray(data)) setPartnerSubmissions(data); }).catch(() => {});
  }, []);

  const reminderKey = (r) => `${r.type}-${r.contactId || ""}-${r.missionId || ""}`;

  const dismissReminder = (r) => {
    const key = reminderKey(r);
    const updated = [...dismissedKeys, key];
    setDismissedKeys(updated);
    localStorage.setItem("crm_dismissed_reminders", JSON.stringify(updated));
  };

  const visibleReminders = reminders.filter(r => !dismissedKeys.includes(reminderKey(r)));
  const pendingPartnerProposals = partnerSubmissions.filter(s => s.stage === "En attente");

  // ─── Périmètre : toute l'équipe ou uniquement mes éléments ──────────────────
  const mine = scope === "me";
  const uname = currentUser?.fullName;
  const uid = currentUser?.id;
  const sContacts = mine ? contacts.filter(c => c.owner === uname) : contacts;
  const sMissions = mine ? missions.filter(m => String(m.assignedTo) === String(uid)) : missions;
  const sMissionIds = new Set(sMissions.map(m => m.id));
  const sCandidatures = mine ? candidatures.filter(cd => sMissionIds.has(cd.missionId)) : candidatures;
  const sActivities = mine ? activities.filter(a => String(a.userId) === String(uid)) : activities;

  const totalClients = sContacts.filter(c => c.status === "Client").length;
  const totalCandidats = sContacts.filter(c => c.status === "Candidat").length;
  const missionsOuvertes = sMissions.filter(m => m.status === "Ouverte" || m.status === "En cours").length;
  const placements = sCandidatures.filter(cd => cd.stage === "Placé").length;

  const currentFY = findCurrentFY(fiscalYears);
  const caFYMissions = wonMissionsForFY(sMissions, currentFY ? currentFY.id : "all");
  const totalCommissions = sumCommission(caFYMissions);
  const recentActivities = sActivities.slice(0, 8);

  // ─── Agenda du jour ─────────────────────────────────────────────────────────
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
  const overdueTasks = sActivities.filter(a => !a.completed && a.dueDate && new Date(a.dueDate) < dayStart).length;
  const todayTasks = sActivities.filter(a => !a.completed && a.dueDate && new Date(a.dueDate) >= dayStart && new Date(a.dueDate) < dayEnd).length;

  const fyLabel = currentFY ? currentFY.label : "Année en cours";
  const kpis = [
    { label: "Clients", value: totalClients, color: "#10b981", bg: "var(--tint-green-soft)", tab: "clients" },
    { label: "Candidats", value: totalCandidats, color: "#f59e0b", bg: "var(--tint-amber-soft)", tab: "candidats" },
    { label: "Missions actives", value: missionsOuvertes, color: "#3b82f6", bg: "var(--tint-blue-soft)", tab: "missions" },
    { label: "Placements", value: placements, color: "#8b5cf6", bg: "var(--tint-violet-soft)", tab: "placements" },
    { label: `CA ${fyLabel}`, value: fmtCAD(totalCommissions), color: "var(--c-green)", bg: "var(--tint-green-soft)", tab: isAdmin ? "revenue" : null },
  ];

  // Rend un élément non-bouton activable au clavier (Entrée / Espace)
  const keyActivate = (fn) => (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };

  const goToReminder = (r) => {
    if (r.missionId && goToMission) goToMission(r.missionId);
    else if (r.contactId && goToContact) goToContact(r.contactId);
  };

  // Pastilles du bandeau « topo du jour »
  const topo = [
    { label: overdueTasks > 1 ? "en retard" : "en retard", value: overdueTasks, color: "var(--c-red)", bg: "var(--tint-red-soft)", onClick: () => onNavigate && onNavigate("activites") },
    { label: "à faire aujourd'hui", value: todayTasks, color: "var(--c-blue)", bg: "var(--tint-blue-soft)", onClick: () => onNavigate && onNavigate("activites") },
    { label: visibleReminders.length > 1 ? "relances" : "relance", value: visibleReminders.length, color: "var(--c-amber)", bg: "var(--tint-amber-soft)", onClick: null },
    { label: pendingPartnerProposals.length > 1 ? "propositions" : "proposition", value: pendingPartnerProposals.length, color: "var(--c-green)", bg: "var(--tint-green-soft)", onClick: () => onNavigate && onNavigate("partenaires") },
  ];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)" }}>Dashboard</h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 3 }}>{new Date().toLocaleDateString("fr-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--surface-3)", borderRadius: 10, padding: 4 }}>
          {[{ k: "all", l: "Équipe" }, { k: "me", l: "Moi" }].map(o => (
            <button key={o.k} type="button" aria-pressed={scope === o.k} onClick={() => setScope(o.k)} style={{ padding: "7px 18px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", background: scope === o.k ? "#fff" : "transparent", color: scope === o.k ? "#1d4ed8" : "var(--muted)", boxShadow: scope === o.k ? "0 1px 3px rgba(15,23,42,0.08)" : "none" }}>{o.l}</button>
          ))}
        </div>
      </div>

      {/* Mon topo du jour */}
      <div className="card" style={{ marginBottom: 20, padding: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        {topo.map((t, i) => (
          <div
            key={i}
            onClick={t.onClick || undefined}
            role={t.onClick ? "button" : undefined}
            tabIndex={t.onClick ? 0 : undefined}
            onKeyDown={t.onClick ? keyActivate(t.onClick) : undefined}
            className={t.onClick ? "row-hover" : undefined}
            style={{ flex: "1 1 150px", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: t.bg, cursor: t.onClick ? "pointer" : "default" }}
          >
            <span style={{ fontSize: 26, fontWeight: 800, color: t.color }}>{t.value}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)", lineHeight: 1.2 }}>{t.label}</span>
          </div>
        ))}
      </div>

      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {!loaded && kpis.map((kpi, i) => (
          <div key={i} className="card">
            <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 28, width: "40%" }} />
          </div>
        ))}
        {loaded && kpis.map((kpi, i) => {
          const clickable = kpi.tab && onNavigate;
          return (
            <div
              key={i}
              className={clickable ? "card row-hover" : "card"}
              onClick={clickable ? () => onNavigate(kpi.tab) : undefined}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? keyActivate(() => onNavigate(kpi.tab)) : undefined}
              style={{ background: kpi.bg, cursor: clickable ? "pointer" : "default" }}
              title={clickable ? "Voir le détail" : undefined}
            >
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: kpi.color, marginTop: 8 }}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Partner proposal notifications */}
      {pendingPartnerProposals.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: "var(--tint-green-soft)", border: "1px solid #a7f3d0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-green)", marginBottom: 14 }}>Propositions partenaires ({pendingPartnerProposals.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingPartnerProposals.slice(0, 8).map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface)", borderRadius: 8, border: "1px solid #d1fae5" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--tint-green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--c-green)" }}>
                  {s.candidateName?.[0] || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{s.candidateName}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.missionTitle} — {s.missionCompany} | par {s.partnerName}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(s.createdAt).toLocaleDateString("fr-CA")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {visibleReminders.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: "var(--tint-amber-soft)", border: "1px solid #fde68a" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-amber)", marginBottom: 14 }}>Relances suggérées ({visibleReminders.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleReminders.slice(0, 8).map((r, i) => {
              const clickable = (r.missionId && goToMission) || (r.contactId && goToContact);
              return (
              <div key={i} onClick={clickable ? () => goToReminder(r) : undefined} role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined} onKeyDown={clickable ? keyActivate(() => goToReminder(r)) : undefined} className={clickable ? "row-hover" : undefined} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface)", borderRadius: 8, border: "1px solid #fef3c7", cursor: clickable ? "pointer" : "default" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: r.type === "prospect" ? "var(--tint-blue)" : r.type === "candidature" ? "var(--tint-amber)" : "var(--tint-red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: r.type === "prospect" ? "var(--c-blue)" : r.type === "candidature" ? "var(--c-amber)" : "var(--c-red)" }}>
                  {r.type === "prospect" ? "P" : r.type === "candidature" ? "C" : "M"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "var(--ink)" }}>{r.message}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", color: r.days >= 14 ? "var(--c-red)" : "var(--c-amber)", background: r.days >= 14 ? "var(--tint-red-soft)" : "var(--tint-amber-soft)", padding: "2px 8px", borderRadius: 8 }}>{r.days}j</span>
                {onPlanFollowUp && (r.contactId || r.missionId) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPlanFollowUp(r); }}
                    title="Planifier un suivi"
                    className="btn btn-ghost"
                    style={{ padding: "4px 10px", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    Planifier
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); dismissReminder(r); }}
                  title="Marquer comme fait"
                  aria-label="Marquer la relance comme traitée"
                  type="button"
                  style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--muted)", flexShrink: 0 }}
                >
                  ✓
                </button>
              </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 18 }}>Activités récentes</h3>
        {recentActivities.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Aucune activité</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentActivities.map(a => {
            const clickable = a.contactId && goToContact;
            return (
            <div key={a.id} onClick={clickable ? () => goToContact(a.contactId) : undefined} role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined} onKeyDown={clickable ? keyActivate(() => goToContact(a.contactId)) : undefined} className={clickable ? "row-hover" : undefined} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--line)", cursor: clickable ? "pointer" : "default" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: a.completed ? "var(--tint-green)" : "var(--tint-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {a.type === "Appel" ? "T" : a.type === "Email" ? "@" : a.type === "Réunion" ? "R" : "N"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", textDecoration: a.completed ? "line-through" : "none" }}>{a.subject}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{a.contactName && `${a.contactName} - `}{a.type} - {new Date(a.createdAt).toLocaleDateString("fr-CA")}</div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
