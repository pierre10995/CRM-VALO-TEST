export default function ActivitesPage({ activities, contacts, missions, users, currentUser, onAdd, onToggle, onDelete }) {
  const typeIcons = { "Appel": "T", "Email": "@", "Réunion": "R", "Note": "N" };
  const typeColors = { "Appel": "#3b82f6", "Email": "#10b981", "Réunion": "#f59e0b", "Note": "#8b5cf6" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Activités</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{activities.length} activité{activities.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Nouvelle activité</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {activities.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucune activité</div>}
        {activities.map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: a.completed ? "#d1fae5" : `${typeColors[a.type]}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: a.completed ? "#059669" : typeColors[a.type] }}>
              {typeIcons[a.type] || "?"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", textDecoration: a.completed ? "line-through" : "none" }}>{a.subject}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {a.type}{a.contactName ? ` - ${a.contactName}` : ""}{a.userName ? ` (${a.userName})` : ""} - {new Date(a.createdAt).toLocaleDateString("fr-CA")}
              </div>
              {a.description && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{a.description}</div>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={`btn ${a.completed ? "btn-ghost" : "btn-success"}`} style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => onToggle(a)}>
                {a.completed ? "Réactiver" : "Terminer"}
              </button>
              <button className="btn btn-danger" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && onDelete(a.id)}>Suppr.</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
