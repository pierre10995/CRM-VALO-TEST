export default function PipelinePage({ candidatures, candidates, missions, onEdit, onAdd, onDelete }) {
  const partnerCol = { key: "Candidat proposé", color: "#059669", bg: "#f0fdf4", border: "#a7f3d0" };
  const stageConfig = [
    { key: "Présélectionné", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    { key: "Soumis", color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
    { key: "Entretien", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    { key: "Finaliste", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
    { key: "Placé", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    { key: "Refusé", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  ];

  const partnerItems = candidatures.filter(cd => cd.partnerId && cd.stage === "Soumis");
  const allCols = [partnerCol, ...stageConfig];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Pipeline</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>Suivi des candidatures</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Nouvelle candidature</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${allCols.length}, 1fr)`, gap: 12, overflowX: "auto" }}>
        {/* Partner column */}
        <div style={{ background: partnerCol.bg, border: `1.5px solid ${partnerCol.border}`, borderRadius: 14, padding: 12, minWidth: 160 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: partnerCol.color }}>Proposé partenaire</h3>
            <span style={{ background: partnerCol.color, color: "white", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{partnerItems.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {partnerItems.length === 0 && <div style={{ padding: "16px 0", textAlign: "center", fontSize: 11, color: "#94a3b8" }}>Vide</div>}
            {partnerItems.map(cd => (
              <div key={cd.id} style={{ background: "white", borderRadius: 10, padding: 10, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} onClick={() => onEdit(cd)}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{cd.candidateName}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{cd.missionTitle}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{cd.missionCompany}</div>
                {cd.partnerName && (
                  <span style={{ display: "inline-block", padding: "1px 7px", background: "#d1fae5", borderRadius: 6, fontSize: 10, fontWeight: 600, color: "#059669" }}>
                    {cd.partnerName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Standard pipeline columns */}
        {stageConfig.map(col => {
          const items = candidatures.filter(cd => cd.stage === col.key);
          return (
            <div key={col.key} style={{ background: col.bg, border: `1.5px solid ${col.border}`, borderRadius: 14, padding: 12, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.key}</h3>
                <span style={{ background: col.color, color: "white", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.length === 0 && <div style={{ padding: "16px 0", textAlign: "center", fontSize: 11, color: "#94a3b8" }}>Vide</div>}
                {items.map(cd => (
                  <div key={cd.id} style={{ background: "white", borderRadius: 10, padding: 10, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} onClick={() => onEdit(cd)}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{cd.candidateName}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{cd.missionTitle}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{cd.missionCompany}</div>
                    {cd.partnerName && (
                      <span style={{ display: "inline-block", marginTop: 4, padding: "1px 7px", background: "#d1fae5", borderRadius: 6, fontSize: 10, fontWeight: 600, color: "#059669" }}>
                        {cd.partnerName}
                      </span>
                    )}
                    {cd.rating > 0 && <div style={{ marginTop: 4, fontSize: 11, color: "#f59e0b" }}>{"*".repeat(cd.rating)}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
