export default function KPICard({ label, value, subtitle, bg = "var(--surface-2)", color = "var(--ink)" }) {
  return (
    <div className="card" style={{ background: bg }}>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color, marginTop: 6 }}>{value}</p>
      {subtitle && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{subtitle}</p>}
    </div>
  );
}
