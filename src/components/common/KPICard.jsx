export default function KPICard({ label, value, subtitle, bg = "#f8fafc", color = "#0f172a" }) {
  return (
    <div className="card" style={{ background: bg }}>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color, marginTop: 6 }}>{value}</p>
      {subtitle && <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{subtitle}</p>}
    </div>
  );
}
