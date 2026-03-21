import { fmtCAD } from "../../utils/constants";
import ProgressBar from "../common/ProgressBar";

export default function FiscalYearTable({ fyWithCA, editingYear, editYearForm, setEditYearForm, onStartEdit, onSaveEdit, onCancelEdit, onDelete }) {
  if (!fyWithCA || fyWithCA.length === 0) return null;

  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11 }}>ANNÉE</th>
            <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11 }}>PÉRIODE</th>
            <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#64748b", fontSize: 11 }}>OBJECTIF</th>
            <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#64748b", fontSize: 11 }}>CA RÉALISÉ</th>
            <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#64748b", fontSize: 11 }}>PROGRESSION</th>
            <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#64748b", fontSize: 11 }}>POSTES</th>
            <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#64748b", fontSize: 11 }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {fyWithCA.map(fy => {
            const pct = fy.target > 0 ? Math.round((fy.ca / fy.target) * 100) : 0;
            const isEditing = editingYear === fy.id;

            if (isEditing) {
              return (
                <tr key={fy.id} style={{ background: "#fffbeb", borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <input className="input" style={{ fontSize: 12, padding: "6px 8px" }} value={editYearForm.label || ""} onChange={e => setEditYearForm(p => ({ ...p, label: e.target.value }))} />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input className="input" type="date" style={{ fontSize: 11, padding: "6px 6px" }} value={editYearForm.startDate || ""} onChange={e => setEditYearForm(p => ({ ...p, startDate: e.target.value }))} />
                      <span style={{ color: "#94a3b8" }}>&rarr;</span>
                      <input className="input" type="date" style={{ fontSize: 11, padding: "6px 6px" }} value={editYearForm.endDate || ""} onChange={e => setEditYearForm(p => ({ ...p, endDate: e.target.value }))} />
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input className="input" type="number" style={{ fontSize: 12, padding: "6px 8px", textAlign: "right" }} value={editYearForm.target || ""} onChange={e => setEditYearForm(p => ({ ...p, target: e.target.value }))} />
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#059669" }}>{fmtCAD(fy.ca)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>&mdash;</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>{fy.count}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 11 }} onClick={onSaveEdit}>Sauver</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={onCancelEdit}>Annuler</button>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={fy.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>{fy.label}</td>
                <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12 }}>
                  {fy.startDate ? new Date(fy.startDate).toLocaleDateString("fr-CA") : "—"} &rarr; {fy.endDate ? new Date(fy.endDate).toLocaleDateString("fr-CA") : "—"}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#64748b" }}>{fmtCAD(fy.target)}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#059669" }}>{fmtCAD(fy.ca)}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                    <div style={{ flex: 1, maxWidth: 80 }}>
                      <ProgressBar value={fy.ca} max={fy.target} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? "#059669" : pct >= 50 ? "#2563eb" : "#d97706" }}>{pct}%</span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: "#0f172a" }}>{fy.count}</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => onStartEdit(fy)}>Modifier</button>
                    <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => onDelete(fy.id)}>Suppr.</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
