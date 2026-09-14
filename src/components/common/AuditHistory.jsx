import { useState, useEffect } from "react";
import api from "../../services/api";

const ACTION_STYLES = {
  "Création": { bg: "var(--tint-green)", color: "var(--c-green)" },
  "Créer": { bg: "var(--tint-green)", color: "var(--c-green)" },
  "Modification": { bg: "var(--tint-blue)", color: "var(--c-blue)" },
  "Modifier": { bg: "var(--tint-blue)", color: "var(--c-blue)" },
  "Suppression": { bg: "var(--tint-red)", color: "var(--c-red)" },
  "Supprimer": { bg: "var(--tint-red)", color: "var(--c-red)" },
};

export default function AuditHistory({ entityType, entityId }) {
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!entityId) return;
    api.get(`/api/audit-log?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`).then(data => {
      setLogs(data);
    }).catch(() => {});
  }, [entityType, entityId]);

  if (logs.length === 0) return null;

  const displayed = expanded ? logs : logs.slice(0, 5);

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Historique ({logs.length})
      </div>
      <div style={{ position: "relative", paddingLeft: 18 }}>
        {/* Timeline line */}
        <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 2, background: "var(--line)", borderRadius: 1 }} />

        {displayed.map((log, i) => {
          const as = ACTION_STYLES[log.action] || { bg: "var(--surface-3)", color: "var(--muted)" };
          const date = new Date(log.createdAt);
          return (
            <div key={log.id} style={{ position: "relative", paddingBottom: i < displayed.length - 1 ? 14 : 0 }}>
              {/* Timeline dot */}
              <div style={{
                position: "absolute", left: -15, top: 5, width: 8, height: 8,
                borderRadius: "50%", background: as.color, border: "2px solid white",
                boxShadow: "0 0 0 2px " + as.bg,
              }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                  background: as.bg, color: as.color, flexShrink: 0,
                }}>
                  {log.action}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 500 }}>{log.userName}</span>
                <span style={{ fontSize: 10.5, color: "var(--muted)", marginLeft: "auto" }}>
                  {date.toLocaleDateString("fr-CA")} {date.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {log.details && (
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, lineHeight: 1.4 }}>
                  {log.details}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {logs.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 11.5,
            color: "var(--c-blue)", fontWeight: 600, marginTop: 10, fontFamily: "inherit",
            padding: "4px 0",
          }}
        >
          {expanded ? "Voir moins" : `Voir tout (${logs.length})`}
        </button>
      )}
    </div>
  );
}
