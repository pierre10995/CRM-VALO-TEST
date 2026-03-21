import { fmtCAD } from "../../utils/constants";

export default function FiscalYearSelector({ fiscalYears, selectedFY, onSelect, wonMissions = [] }) {
  if (!fiscalYears || fiscalYears.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Année fiscale
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onSelect("all")} className="btn" style={{
          padding: "8px 16px", fontSize: 13,
          background: selectedFY === "all" ? "linear-gradient(135deg, #0f172a, #334155)" : "white",
          color: selectedFY === "all" ? "white" : "#64748b",
          border: selectedFY === "all" ? "none" : "1.5px solid #e2e8f0",
        }}>Toutes</button>
        {fiscalYears.map(fy => {
          const fyCA = wonMissions
            .filter(m => String(m.fiscalYearId) === String(fy.id))
            .reduce((s, m) => s + (m.commission || 0), 0);
          return (
            <button key={fy.id} onClick={() => onSelect(String(fy.id))} className="btn" style={{
              padding: "8px 16px", fontSize: 13,
              background: selectedFY === String(fy.id) ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white",
              color: selectedFY === String(fy.id) ? "white" : "#64748b",
              border: selectedFY === String(fy.id) ? "none" : "1.5px solid #e2e8f0",
              boxShadow: selectedFY === String(fy.id) ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
            }}>
              {fy.label}
              <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.8 }}>{fmtCAD(fyCA)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
