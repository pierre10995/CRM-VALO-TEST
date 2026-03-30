import { fmtCAD } from "../../utils/constants";

export default function ProfilePage({ currentUser, contacts, missions, candidatures, users, setActiveTab }) {
  const userName = currentUser?.fullName || "";
  const userId = currentUser?.id;

  // Candidats owned by current user
  const myCandidats = contacts.filter(c => c.status === "Candidat" && c.owner === userName);
  // Clients/Prospects owned by current user
  const myClients = contacts.filter(c => (c.status === "Client" || c.status === "Prospect") && c.owner === userName);
  // Missions assigned to current user (uses integer user ID)
  const myMissions = missions.filter(m => String(m.assignedTo) === String(userId));
  // Candidatures linked to my missions
  const myMissionIds = new Set(myMissions.map(m => m.id));
  const myCandidatures = (candidatures || []).filter(cd => myMissionIds.has(cd.missionId));
  const placedCount = myCandidatures.filter(cd => cd.stage === "Placé").length;
  const totalCommission = myMissions.reduce((sum, m) => sum + (m.commission || 0), 0);

  const Section = ({ title, count, color, children }) => (
    <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>{title}</h3>
        <span style={{ background: color, color: "white", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{count}</span>
      </div>
      {children}
    </div>
  );

  const EmptyRow = ({ cols, text }) => (
    <tr><td colSpan={cols} style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>{text}</td></tr>
  );

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ padding: 24, marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "white" }}>
          {userName[0] || "?"}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>{userName}</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{currentUser?.login}</p>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Stat label="Candidats" value={myCandidats.length} color="#8b5cf6" />
          <Stat label="Clients" value={myClients.length} color="#2563eb" />
          <Stat label="Postes" value={myMissions.length} color="#0891b2" />
          <Stat label="Placements" value={placedCount} color="#059669" />
        </div>
      </div>

      {/* Candidats */}
      <Section title="Mes Candidats" count={myCandidats.length} color="#8b5cf6">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {["Nom", "Ville", "Compétences", "Validation", "Disponibilité"].map(h => (
              <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {myCandidats.length === 0 && <EmptyRow cols={5} text="Aucun candidat assigné" />}
            {myCandidats.map(c => (
              <tr key={c.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                  {c.email && <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{c.email}</div>}
                </td>
                <td style={{ padding: "12px 20px", fontSize: 13, color: "#64748b" }}>{c.city || "—"}</td>
                <td style={{ padding: "12px 20px", fontSize: 13, color: "#64748b" }}>{c.skills || "—"}</td>
                <td style={{ padding: "12px 20px" }}>{c.validationStatus ? <span className="tag" style={{ fontSize: 11.5 }}>{c.validationStatus}</span> : "—"}</td>
                <td style={{ padding: "12px 20px", fontSize: 13, color: "#64748b" }}>{c.availability || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Clients */}
      <Section title="Mes Clients & Prospects" count={myClients.length} color="#2563eb">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {["Entreprise", "Contact", "Secteur", "Statut"].map(h => (
              <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {myClients.length === 0 && <EmptyRow cols={4} text="Aucun client assigné" />}
            {myClients.map(c => (
              <tr key={c.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{c.company}</div>
                </td>
                <td style={{ padding: "12px 20px", fontSize: 13, color: "#64748b" }}>{c.name || "—"}{c.email ? ` · ${c.email}` : ""}</td>
                <td style={{ padding: "12px 20px" }}><span style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "3px 9px", borderRadius: 6 }}>{c.sector}</span></td>
                <td style={{ padding: "12px 20px" }}><span className="tag" style={{ background: c.status === "Client" ? "#d1fae5" : "#dbeafe", color: c.status === "Client" ? "#059669" : "#2563eb" }}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Missions */}
      <Section title="Mes Postes Ouverts" count={myMissions.length} color="#0891b2">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {["Poste", "Entreprise", "Statut", "Commission", "Candidatures"].map(h => (
              <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {myMissions.length === 0 && <EmptyRow cols={5} text="Aucun poste assigné" />}
            {myMissions.map(m => {
              const cdCount = (candidatures || []).filter(cd => cd.missionId === m.id).length;
              return (
                <tr key={m.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{m.title}</div>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 13, color: "#64748b" }}>{m.company}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span className="tag" style={{ background: m.status === "Ouverte" ? "#dbeafe" : m.status === "Gagné" ? "#d1fae5" : "#f1f5f9", color: m.status === "Ouverte" ? "#2563eb" : m.status === "Gagné" ? "#059669" : "#64748b" }}>{m.status}</span>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{m.commission ? fmtCAD(m.commission) : "—"}</td>
                  <td style={{ padding: "12px 20px", fontSize: 13, color: "#64748b" }}>{cdCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center", minWidth: 70 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{label}</div>
    </div>
  );
}
