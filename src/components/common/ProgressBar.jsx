export default function ProgressBar({ value, max = 100, height = 6, showLabel = false }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const color = pct >= 100
    ? "linear-gradient(90deg, #059669, #34d399)"
    : pct >= 50
      ? "linear-gradient(90deg, #3b82f6, #93c5fd)"
      : "linear-gradient(90deg, #d97706, #fbbf24)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height, background: "#f1f5f9", borderRadius: height / 2 }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: color, borderRadius: height / 2,
          transition: "width 0.3s",
        }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? "#059669" : pct >= 50 ? "#2563eb" : "#d97706", minWidth: 36 }}>
          {pct}%
        </span>
      )}
    </div>
  );
}
