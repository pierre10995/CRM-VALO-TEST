import { fmtCAD } from "../../utils/constants";

export default function UserCAGrid({ caByUser, label = "" }) {
  if (!caByUser || caByUser.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>
        CA par utilisateur {label ? `— ${label}` : ""}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(caByUser.length, 4)}, 1fr)`, gap: 12 }}>
        {caByUser.map(u => (
          <div key={u.id} style={{ padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>
                {u.fullName?.[0] || "?"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{u.fullName}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>{fmtCAD(u.ca)}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{u.count} poste{u.count > 1 ? "s" : ""} gagné{u.count > 1 ? "s" : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
