import { fmtCAD } from "../../utils/constants";

export default function RevenueChart({ chartData }) {
  if (!chartData || chartData.length === 0) return null;

  const chartMax = Math.max(...chartData.map(d => Math.max(d.ca, d.target)), 1);

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Évolution du chiffre d'affaires</div>
      <svg viewBox={`0 0 ${Math.max(chartData.length * 160, 400)} 220`} style={{ width: "100%", height: 220 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <g key={i}>
            <line x1="60" y1={180 - p * 160} x2={60 + chartData.length * 140} y2={180 - p * 160} stroke="#f1f5f9" strokeWidth="1" />
            <text x="55" y={184 - p * 160} textAnchor="end" fontSize="10" fill="#94a3b8">{fmtCAD(chartMax * p).replace(" $ CAD", "")}</text>
          </g>
        ))}
        {chartData.map((d, i) => {
          const x = 80 + i * 140;
          const barH = (d.ca / chartMax) * 160;
          const targetH = (d.target / chartMax) * 160;
          return (
            <g key={d.label}>
              <rect x={x} y={180 - targetH} width="40" height={targetH} rx="4" fill="#e2e8f0" opacity="0.5" />
              <rect x={x} y={180 - barH} width="40" height={barH} rx="4" fill={d.ca >= d.target ? "url(#greenGrad)" : "url(#blueGrad)"} />
              <text x={x + 20} y={175 - barH} textAnchor="middle" fontSize="11" fontWeight="700" fill={d.ca >= d.target ? "#059669" : "#2563eb"}>{fmtCAD(d.ca).replace(" $ CAD", "")}</text>
              <text x={x + 20} y={198} textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">{d.label}</text>
              <text x={x + 20} y={212} textAnchor="middle" fontSize="9" fill="#94a3b8">Obj: {fmtCAD(d.target).replace(" $ CAD", "")}</text>
            </g>
          );
        })}
        {chartData.length > 1 && (
          <polyline fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeDasharray="6,3"
            points={chartData.map((d, i) => `${80 + i * 140 + 20},${180 - (d.ca / chartMax) * 160}`).join(" ")} />
        )}
        {chartData.map((d, i) => (
          <circle key={i} cx={80 + i * 140 + 20} cy={180 - (d.ca / chartMax) * 160} r="4" fill="#2563eb" stroke="white" strokeWidth="2" />
        ))}
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
          <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: "linear-gradient(#3b82f6, #93c5fd)" }} /> CA réalisé
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: "#e2e8f0" }} /> Objectif
        </div>
      </div>
    </div>
  );
}
