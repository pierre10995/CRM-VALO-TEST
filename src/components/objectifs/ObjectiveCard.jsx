import { fmtCAD } from "../../utils/constants";
import ProgressBar from "../common/ProgressBar";

const pct = (actual, target) => target > 0 ? Math.min(Math.round((actual / target) * 100), 999) : 0;
const pctColor = (p) => p >= 100 ? "#059669" : p >= 50 ? "#2563eb" : "#d97706";

export default function ObjectiveCard({ obj, actuals, userCA, periodLabel, onEdit, onDelete, isEditing, editForm, setEditForm, onSaveEdit, onCancelEdit, clients }) {
  const pctClients = pct(actuals.newClients, obj.targetNewClients);
  const pctCA = pct(actuals.caRealized, obj.targetCA);
  const pctTotal = pct(actuals.totalRealized, obj.targetTotal);

  return (
    <div className="card" style={{ padding: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#1d4ed8" }}>
            {obj.userName?.[0] || "?"}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{obj.userName}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {periodLabel}
              {userCA ? ` — CA: ${fmtCAD(userCA.ca)}` : ""}
            </div>
          </div>
        </div>
        {!isEditing && (
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={onEdit}>Modifier</button>
            <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={onDelete}>Suppr.</button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Nouveaux clients</label>
              <input className="input" type="number" style={{ fontSize: 12, padding: "6px 8px" }} value={editForm.targetNewClients || ""} onChange={e => setEditForm(p => ({ ...p, targetNewClients: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>CA ($)</label>
              <input className="input" type="number" style={{ fontSize: 12, padding: "6px 8px" }} value={editForm.targetCA || ""} onChange={e => setEditForm(p => ({ ...p, targetCA: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Total ($)</label>
              <input className="input" type="number" style={{ fontSize: 12, padding: "6px 8px" }} value={editForm.targetTotal || ""} onChange={e => setEditForm(p => ({ ...p, targetTotal: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Notes</label>
            <input className="input" style={{ fontSize: 12, padding: "6px 8px" }} value={editForm.notes || ""} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Commentaire..." />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={onCancelEdit}>Annuler</button>
            <button className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={onSaveEdit}>Sauver</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Nouveaux clients */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Nouveaux clients</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: pctColor(pctClients) }}>{actuals.newClients} / {obj.targetNewClients} ({pctClients}%)</span>
            </div>
            <ProgressBar value={actuals.newClients} max={obj.targetNewClients} />
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>sur {clients} clients actuels</div>
          </div>

          {/* CA en cours */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>CA en cours</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: pctColor(pctCA) }}>{fmtCAD(actuals.caRealized)} / {fmtCAD(obj.targetCA)} ({pctCA}%)</span>
            </div>
            <ProgressBar value={actuals.caRealized} max={obj.targetCA} />
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{actuals.missionsCount} poste{actuals.missionsCount > 1 ? "s" : ""} gagné{actuals.missionsCount > 1 ? "s" : ""}</div>
          </div>

          {/* Objectif total */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Objectif total</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: pctColor(pctTotal) }}>{fmtCAD(actuals.totalRealized)} / {fmtCAD(obj.targetTotal)} ({pctTotal}%)</span>
            </div>
            <ProgressBar value={actuals.totalRealized} max={obj.targetTotal} height={8} />
          </div>

          {/* Notes */}
          {obj.notes && (
            <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", padding: "6px 10px", background: "#f8fafc", borderRadius: 6, borderLeft: "3px solid #e2e8f0" }}>
              {obj.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
