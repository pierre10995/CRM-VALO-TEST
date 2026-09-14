export default function PartnerMissionList({ missions, onSelect }) {
  if (missions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>-</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-soft)" }}>Aucune mission affiliée</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Contactez VALO pour être affilié à des missions.</div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Vos missions</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Cliquez sur une mission pour voir les détails et proposer un candidat.</p>

      <div style={{ display: "grid", gap: 14 }}>
        {missions.map(m => (
          <div
            key={m.id}
            onClick={() => onSelect(m)}
            style={{
              background: "var(--surface)", borderRadius: 14, padding: "18px 20px", cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid var(--line)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,185,129,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{m.title}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{m.company}{m.location ? ` — ${m.location}` : ""}</div>
              </div>
              <span style={{
                padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: m.status === "Ouverte" ? "var(--tint-green)" : m.status === "En cours" ? "var(--tint-blue)" : "var(--surface-3)",
                color: m.status === "Ouverte" ? "var(--c-green)" : m.status === "En cours" ? "var(--c-blue)" : "var(--muted)",
              }}>
                {m.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
              <span>{m.contractType}</span>
              {m.salaryMin > 0 && <span>{m.salaryMin.toLocaleString()}$ — {m.salaryMax.toLocaleString()}$</span>}
              {m.workMode && <span>{m.workMode}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
