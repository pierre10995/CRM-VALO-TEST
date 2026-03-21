export default function PartnerMissionList({ missions, onSelect }) {
  if (missions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>-</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#475569" }}>Aucune mission affiliée</div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>Contactez VALO pour être affilié à des missions.</div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Vos missions</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Cliquez sur une mission pour voir les détails et proposer un candidat.</p>

      <div style={{ display: "grid", gap: 14 }}>
        {missions.map(m => (
          <div
            key={m.id}
            onClick={() => onSelect(m)}
            style={{
              background: "white", borderRadius: 14, padding: "18px 20px", cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,185,129,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{m.title}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{m.company}{m.location ? ` — ${m.location}` : ""}</div>
              </div>
              <span style={{
                padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: m.status === "Ouverte" ? "#d1fae5" : m.status === "En cours" ? "#dbeafe" : "#f1f5f9",
                color: m.status === "Ouverte" ? "#059669" : m.status === "En cours" ? "#2563eb" : "#64748b",
              }}>
                {m.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "#94a3b8" }}>
              <span>{m.contractType}</span>
              {m.salaryMin > 0 && <span>{m.salaryMin.toLocaleString()}$ — {m.salaryMax.toLocaleString()}$</span>}
              {m.workMode && <span>{m.workMode}</span>}
              <span>{m.candidatureCount} candidature{m.candidatureCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
