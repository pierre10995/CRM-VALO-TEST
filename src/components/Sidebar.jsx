import { useState, useMemo, useRef, useEffect } from "react";
import { userTitle } from "../utils/userTitles";
import { getThemePref, applyTheme } from "../utils/theme";

const THEME_OPTIONS = [
  { value: "auto", label: "Auto", title: "Suivre le réglage du système" },
  { value: "light", label: "☀", title: "Thème clair" },
  { value: "dark", label: "☾", title: "Thème sombre" },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "clients", label: "Clients", icon: "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" },
  { id: "candidats", label: "Candidats", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
  { id: "missions", label: "Postes Ouverts", icon: "M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m-5 4h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" },
  { id: "pipeline", label: "Pipeline", icon: "M9 17V7m0 10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10V7" },
  { id: "activites", label: "Activités", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" },
  { id: "evaluation", label: "Évaluation IA", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { id: "placements", label: "Suivi Placements", icon: "M9 12l2 2 4-4M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" },
  { id: "revenue", label: "Chiffre d'affaires", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", adminOnly: true },
  { id: "objectifs", label: "Objectifs", icon: "M13 10V3L4 14h7v7l9-11h-7z", adminOnly: true },
  { id: "partenaires", label: "Partenaires", icon: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M20 8v6M23 11h-6M12.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z", superAdminOnly: true },
  { id: "profil", label: "Mon Profil", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  { id: "admin", label: "Administration", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z", adminOnly: true },
];

// Regroupement de la navigation par usage
const SECTIONS = [
  { key: "suivi", label: "Suivi", ids: ["dashboard", "clients", "candidats", "missions", "pipeline", "activites", "evaluation"] },
  { key: "analyse", label: "Analyse", ids: ["placements", "revenue", "objectifs"] },
  { key: "espace", label: "Espace", ids: ["partenaires", "profil", "admin"] },
];

const TYPE_LABELS = { contact: "Client", candidat: "Candidat", mission: "Poste", activity: "Activité" };
const TYPE_COLORS = { contact: "var(--c-blue)", candidat: "var(--c-green)", mission: "var(--c-amber)", activity: "var(--c-violet)" };
const TYPE_BG = { contact: "var(--tint-blue-soft)", candidat: "var(--tint-green-soft)", mission: "var(--tint-amber-soft)", activity: "var(--tint-violet-soft)" };

const QUICK_ADD = [
  { type: "candidat", label: "Candidat" },
  { type: "client", label: "Client / Prospect" },
  { type: "mission", label: "Poste" },
  { type: "candidature", label: "Candidature (pipeline)" },
  { type: "activity", label: "Activité / Suivi" },
];

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, setDetailId, setSearch, setFilterStatus, contacts = [], missions = [], activities = [], onQuickAdd }) {
  const isAdmin = ["admin", "superadmin"].includes(currentUser?.userRole);
  const isSuperAdmin = currentUser?.userRole === "superadmin";
  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (item.adminOnly) return isAdmin;
    return true;
  });

  // Badge « en retard » sur Activités (tâches non terminées dont l'échéance est passée)
  const overdueCount = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return activities.filter(a => !a.completed && a.dueDate && new Date(a.dueDate) < todayStart).length;
  }, [activities]);

  const [globalQuery, setGlobalQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [theme, setTheme] = useState(getThemePref);
  const changeTheme = (v) => setTheme(applyTheme(v));
  const resultsRef = useRef(null);
  const inputRef = useRef(null);
  const quickAddRef = useRef(null);

  // Fermer le menu d'ajout rapide au clic extérieur / Échap
  useEffect(() => {
    if (!showQuickAdd) return;
    const onDown = (e) => { if (quickAddRef.current && !quickAddRef.current.contains(e.target)) setShowQuickAdd(false); };
    const onKey = (e) => { if (e.key === "Escape") setShowQuickAdd(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [showQuickAdd]);

  // Close results on outside click
  useEffect(() => {
    const handler = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { results, moreCount } = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (q.length < 2) return { results: [], moreCount: 0 };
    const all = [];
    for (const c of contacts) {
      const searchable = `${c.name} ${c.company} ${c.email} ${c.city}`.toLowerCase();
      if (searchable.includes(q)) {
        all.push({
          id: c.id,
          type: c.status === "Candidat" ? "candidat" : "contact",
          tab: c.status === "Candidat" ? "candidats" : "clients",
          name: c.name || c.company,
          detail: c.status === "Candidat" ? (c.skills || c.city || c.email) : (c.company || c.email),
        });
      }
    }
    for (const m of missions) {
      const searchable = `${m.title} ${m.company} ${m.location}`.toLowerCase();
      if (searchable.includes(q)) {
        all.push({
          id: m.id,
          type: "mission",
          tab: "missions",
          name: m.title,
          detail: `${m.company}${m.location ? ` — ${m.location}` : ""}`,
        });
      }
    }
    for (const a of activities) {
      const searchable = `${a.subject} ${a.contactName || ""} ${a.description || ""}`.toLowerCase();
      if (searchable.includes(q)) {
        all.push({
          id: a.id,
          type: "activity",
          tab: "activites",
          name: a.subject,
          detail: [a.type, a.contactName, a.completed ? "terminée" : null].filter(Boolean).join(" — "),
        });
      }
    }
    return { results: all.slice(0, 10), moreCount: Math.max(0, all.length - 10) };
  }, [globalQuery, contacts, missions, activities]);

  const handleSelect = (result) => {
    setActiveTab(result.tab);
    // Les activités n'ont pas de fiche détail : on ouvre simplement l'onglet
    setDetailId(result.type === "activity" ? null : result.id);
    setSearch("");
    setFilterStatus("Tous");
    setGlobalQuery("");
    setShowResults(false);
  };

  return (
    <aside className="app-sidebar" style={{ width: 220, background: "var(--sidebar-bg)", backdropFilter: "blur(12px)", padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "1px 0 0 var(--line-soft), 6px 0 28px rgba(15,23,42,0.04)", flexShrink: 0 }}>
      <div style={{ padding: "0 6px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo-valo.svg" alt="VALO" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
          <div className="sidebar-text">
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>VALO Recrutement</div>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>CRM v2.0</div>
          </div>
        </div>
      </div>

      {/* Ajout rapide (accessible depuis n'importe quelle page — raccourci « n ») */}
      {onQuickAdd && (
        <div ref={quickAddRef} className="sidebar-text" style={{ padding: "0 4px 10px", position: "relative" }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", fontSize: 13 }}
            aria-haspopup="menu"
            aria-expanded={showQuickAdd}
            title="Ajouter rapidement (raccourci : n)"
            onClick={() => setShowQuickAdd(v => !v)}
          >
            ＋ Ajouter
          </button>
          {showQuickAdd && (
            <div role="menu" aria-label="Ajout rapide" style={{
              position: "absolute", top: "100%", left: 4, right: 4, zIndex: 999, marginTop: 4,
              background: "var(--surface)", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid var(--line)", padding: 4,
            }}>
              {QUICK_ADD.map(q => (
                <button
                  key={q.type}
                  type="button"
                  role="menuitem"
                  className="nav-item"
                  style={{ padding: "8px 12px", fontSize: 13 }}
                  onClick={() => { setShowQuickAdd(false); onQuickAdd(q.type); }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global search */}
      <div className="sidebar-text" style={{ padding: "0 4px 12px", position: "relative" }}>
        <div style={{ position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="input"
            value={globalQuery}
            onChange={e => { setGlobalQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            id="global-search"
            placeholder="Rechercher...  ( / )"
            aria-label="Recherche globale (contacts, candidats, postes, activités) — raccourci /"
            style={{ paddingLeft: 32, fontSize: 12.5, padding: "8px 10px 8px 32px" }}
          />
        </div>
        {showResults && results.length > 0 && (
          <div ref={resultsRef} style={{
            position: "absolute", top: "100%", left: 4, right: 4, zIndex: 999,
            background: "var(--surface)", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            border: "1px solid var(--line)", maxHeight: 340, overflowY: "auto", marginTop: 4,
          }}>
            {results.map(r => (
              <div
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  cursor: "pointer", borderBottom: "1px solid var(--line-soft)",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{
                  fontSize: 9.5, fontWeight: 700, padding: "2px 6px", borderRadius: 5,
                  background: TYPE_BG[r.type], color: TYPE_COLORS[r.type], textTransform: "uppercase",
                  letterSpacing: "0.04em", flexShrink: 0,
                }}>
                  {TYPE_LABELS[r.type]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.detail}</div>
                </div>
              </div>
            ))}
            {moreCount > 0 && (
              <div style={{ padding: "8px 12px", fontSize: 11, color: "var(--muted)", textAlign: "center", background: "var(--surface-2)" }}>
                + {moreCount} autre{moreCount > 1 ? "s" : ""} résultat{moreCount > 1 ? "s" : ""} — affinez votre recherche
              </div>
            )}
          </div>
        )}
        {showResults && globalQuery.trim().length >= 2 && results.length === 0 && (
          <div ref={resultsRef} style={{
            position: "absolute", top: "100%", left: 4, right: 4, zIndex: 999,
            background: "var(--surface)", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            border: "1px solid var(--line)", padding: "14px 12px", textAlign: "center",
            fontSize: 12, color: "var(--muted)", marginTop: 4,
          }}>
            Aucun résultat
          </div>
        )}
      </div>

      <nav aria-label="Navigation principale" style={{ display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", minHeight: 0 }}>
        {SECTIONS.map(section => {
          const items = visibleItems.filter(i => section.ids.includes(i.id));
          if (items.length === 0) return null;
          return (
            <div key={section.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div className="sidebar-text" style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", padding: "8px 8px 4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{section.label}</div>
              {items.map(item => {
                const badge = item.id === "activites" && overdueCount > 0 ? overdueCount : 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                    title={badge ? `${item.label} — ${badge} en retard` : item.label}
                    aria-label={badge ? `${item.label}, ${badge} en retard` : item.label}
                    aria-current={activeTab === item.id ? "page" : undefined}
                    onClick={() => { setActiveTab(item.id); setDetailId(null); setSearch(""); setFilterStatus("Tous"); }}
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={item.icon}/></svg>
                    <span className="sidebar-text" style={{ flex: 1 }}>{item.label}</span>
                    {badge > 0 && (
                      <span aria-hidden="true" style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: activeTab === item.id ? "rgba(255,255,255,0.25)" : "var(--tint-red)", color: activeTab === item.id ? "#fff" : "var(--c-red)", fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-text" style={{ marginTop: "auto" }}>
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--line-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{currentUser?.fullName?.[0] || "?"}</div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{currentUser?.fullName || "Utilisateur"}</div>
              {userTitle(currentUser) && <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--c-blue)" }}>{userTitle(currentUser)}</div>}
              <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{currentUser?.login || ""}</div>
            </div>
          </div>
          <div role="group" aria-label="Thème d'affichage" style={{ display: "flex", gap: 3, background: "var(--surface-3)", borderRadius: 8, padding: 3, marginBottom: 8 }}>
            {THEME_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                title={o.title}
                aria-label={o.title}
                aria-pressed={theme === o.value}
                onClick={() => changeTheme(o.value)}
                style={{ flex: 1, padding: "5px 0", fontSize: 12, fontWeight: 600, borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", background: theme === o.value ? "var(--surface)" : "transparent", color: theme === o.value ? "var(--brand)" : "var(--muted)", boxShadow: theme === o.value ? "var(--shadow-xs)" : "none" }}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 12.5, padding: "7px 12px" }} onClick={onLogout}>Déconnexion</button>
        </div>
      </div>
    </aside>
  );
}
