const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "clients", label: "Clients", icon: "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" },
  { id: "candidats", label: "Candidats", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
  { id: "missions", label: "Postes Ouverts", icon: "M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m-5 4h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" },
  { id: "pipeline", label: "Pipeline", icon: "M9 17V7m0 10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10V7" },
  { id: "activites", label: "Activités", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" },
  { id: "evaluation", label: "Évaluation IA", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { id: "placements", label: "Suivi Placements", icon: "M9 12l2 2 4-4M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" },
  { id: "revenue", label: "Chiffre d'affaires", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { id: "objectifs", label: "Objectifs", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { id: "partenaires", label: "Partenaires", icon: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M20 8v6M23 11h-6M12.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" },
  { id: "profil", label: "Mon Profil", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  { id: "admin", label: "Administration", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z", adminOnly: true },
];

const ADMIN_EMAIL = "pierre@valo-inno.com";

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, setDetailId, setSearch, setFilterStatus }) {
  const isAdmin = currentUser?.login === ADMIN_EMAIL;
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);
  return (
    <aside style={{ width: 220, background: "white", padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "1px 0 0 #e2e8f0", flexShrink: 0 }}>
      <div style={{ padding: "0 6px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>VALO Recrutement</div>
            <div style={{ fontSize: 10.5, color: "#94a3b8" }}>CRM v2.0</div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "0 8px 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Navigation</div>
      {visibleItems.map(item => (
        <div key={item.id} className={`nav-item ${activeTab === item.id ? "active" : ""}`} onClick={() => { setActiveTab(item.id); setDetailId(null); setSearch(""); setFilterStatus("Tous"); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
          {item.label}
        </div>
      ))}
      <div style={{ marginTop: "auto" }}>
        <div style={{ padding: "12px 8px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{currentUser?.fullName?.[0] || "?"}</div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{currentUser?.fullName || "Utilisateur"}</div>
              <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{currentUser?.login || ""}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 12.5, padding: "7px 12px" }} onClick={onLogout}>Déconnexion</button>
        </div>
      </div>
    </aside>
  );
}
