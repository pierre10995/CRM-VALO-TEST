import { useConfirm } from "../common/ConfirmDialog";
import { ACTIVITY_TYPES } from "../../utils/constants";
import usePersistedState from "../../hooks/usePersistedState";

const typeIcons = { "Appel": "T", "Email": "@", "Réunion": "R", "Note": "N" };
const typeColors = { "Appel": "#3b82f6", "Email": "#10b981", "Réunion": "#f59e0b", "Note": "#8b5cf6" };

// Bornes de la journée courante — calculées dans le composant (et non au
// chargement du module) pour rester justes après minuit sans recharger.
function dayBounds() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  return { todayStart, tomorrowStart };
}

function bucketOf(a, { todayStart, tomorrowStart }) {
  if (a.completed) return "done";
  if (!a.dueDate) return "nodate";
  const d = new Date(a.dueDate);
  if (isNaN(d.getTime())) return "nodate";
  if (d < todayStart) return "overdue";
  if (d < tomorrowStart) return "today";
  return "upcoming";
}

function fmtDue(dueDate, { todayStart }) {
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return "";
  const diffDays = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - todayStart) / 86400000);
  const time = d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
  const hasTime = !(d.getHours() === 0 && d.getMinutes() === 0);
  if (diffDays === 0) return hasTime ? `Aujourd'hui ${time}` : "Aujourd'hui";
  if (diffDays === 1) return hasTime ? `Demain ${time}` : "Demain";
  if (diffDays === -1) return "Hier";
  const date = d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
  if (diffDays < 0) return `${date} · retard ${-diffDays} j`;
  return date;
}

const GROUPS = [
  { key: "overdue", label: "En retard", color: "#dc2626", bg: "#fef2f2" },
  { key: "today", label: "Aujourd'hui", color: "#2563eb", bg: "#eff6ff" },
  { key: "upcoming", label: "À venir", color: "#0891b2", bg: "#ecfeff" },
  { key: "nodate", label: "Sans échéance", color: "#64748b", bg: "#f8fafc" },
];

export default function ActivitesPage({ activities, contacts, missions, users, currentUser, onAdd, onEdit, onToggle, onDelete, goToContact }) {
  const confirm = useConfirm();
  const [scope, setScope] = usePersistedState("activites.scope", "all"); // "all" | "me"
  const [typeFilter, setTypeFilter] = usePersistedState("activites.type", "");
  const [showDone, setShowDone] = usePersistedState("activites.showDone", false);

  const uid = currentUser?.id;
  const bounds = dayBounds();
  const bucket = (a) => bucketOf(a, bounds);
  const due = (d) => fmtDue(d, bounds);
  const filtered = activities.filter(a => {
    if (scope === "me" && String(a.userId) !== String(uid)) return false;
    if (typeFilter && a.type !== typeFilter) return false;
    return true;
  });

  // Répartition en groupes
  const buckets = { overdue: [], today: [], upcoming: [], nodate: [], done: [] };
  filtered.forEach(a => buckets[bucket(a)].push(a));
  // Tri par échéance croissante dans les groupes datés
  const byDue = (a, b) => new Date(a.dueDate) - new Date(b.dueDate);
  buckets.overdue.sort(byDue); buckets.today.sort(byDue); buckets.upcoming.sort(byDue);

  const overdueCount = buckets.overdue.length;
  const todayCount = buckets.today.length;
  const openCount = buckets.overdue.length + buckets.today.length + buckets.upcoming.length + buckets.nodate.length;

  const renderRow = (a) => {
    const clickable = a.contactId && goToContact;
    return (
      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: "1px solid var(--line-soft, #eef2f8)" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: a.completed ? "#d1fae5" : `${typeColors[a.type]}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: a.completed ? "#059669" : typeColors[a.type] }}>
          {typeIcons[a.type] || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", textDecoration: a.completed ? "line-through" : "none" }}>{a.subject}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {a.type}
            {a.contactName && <> · <span onClick={clickable ? (e) => { e.stopPropagation(); goToContact(a.contactId); } : undefined} style={{ color: clickable ? "#2563eb" : "#64748b", cursor: clickable ? "pointer" : "default" }}>{a.contactName}</span></>}
            {a.userName ? ` · ${a.userName}` : ""}
          </div>
          {a.description && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{a.description}</div>}
        </div>
        {a.dueDate && !a.completed && (
          <span style={{ fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", padding: "3px 10px", borderRadius: 999, background: bucket(a) === "overdue" ? "#fef2f2" : bucket(a) === "today" ? "#eff6ff" : "#f1f5f9", color: bucket(a) === "overdue" ? "#dc2626" : bucket(a) === "today" ? "#2563eb" : "#64748b" }}>
            {due(a.dueDate)}
          </span>
        )}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button className={`btn ${a.completed ? "btn-ghost" : "btn-success"}`} style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => onToggle(a)}>
            {a.completed ? "Réactiver" : "Terminer"}
          </button>
          {onEdit && <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => onEdit(a)}>Modifier</button>}
          <button className="btn btn-danger" style={{ padding: "5px 10px", fontSize: 11 }} onClick={async () => (await confirm("Cette suppression est définitive. Voulez-vous continuer ?", { title: "Supprimer définitivement", confirmLabel: "Supprimer" })) && onDelete(a.id)}>Suppr.</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Activités</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>
            {overdueCount > 0 && <span style={{ color: "#dc2626", fontWeight: 600 }}>{overdueCount} en retard · </span>}
            <span style={{ color: todayCount > 0 ? "#2563eb" : "#64748b", fontWeight: todayCount > 0 ? 600 : 400 }}>{todayCount} aujourd'hui</span>
            {` · ${openCount} à faire`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Nouvelle activité</button>
      </div>

      {/* Filtres */}
      <div className="page-header-actions" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
          {[{ k: "all", l: "Toutes" }, { k: "me", l: "Les miennes" }].map(o => (
            <button key={o.k} type="button" aria-pressed={scope === o.k} onClick={() => setScope(o.k)} style={{ padding: "7px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", background: scope === o.k ? "#fff" : "transparent", color: scope === o.k ? "#1d4ed8" : "#64748b", boxShadow: scope === o.k ? "0 1px 3px rgba(15,23,42,0.08)" : "none" }}>{o.l}</button>
          ))}
        </div>
        <select className="input" style={{ width: "auto", minWidth: 150 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Tous les types</option>
          {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn btn-ghost" style={{ fontSize: 12.5, marginLeft: "auto" }} onClick={() => setShowDone(v => !v)}>
          {showDone ? "Masquer les terminées" : `Afficher les terminées (${buckets.done.length})`}
        </button>
      </div>

      {openCount === 0 && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#64748b" }}>Aucune activité à faire 🎉</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={onAdd}>+ Planifier une activité</button>
        </div>
      )}

      {/* Groupes */}
      {GROUPS.map(g => buckets[g.key].length > 0 && (
        <div key={g.key} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: g.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{g.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: g.color, background: g.bg, padding: "1px 9px", borderRadius: 999 }}>{buckets[g.key].length}</span>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {buckets[g.key].map(renderRow)}
          </div>
        </div>
      ))}

      {/* Terminées */}
      {showDone && buckets.done.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Terminées ({buckets.done.length})</div>
          <div className="card" style={{ padding: 0, overflow: "hidden", opacity: 0.72 }}>
            {buckets.done.map(renderRow)}
          </div>
        </div>
      )}
    </div>
  );
}
