import { useState, useEffect } from "react";
import api from "../../services/api";

export default function PlacementsPage({ candidatures, candidates, missions }) {
  const [placements, setPlacements] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({});

  const loadPlacements = async () => {
    const data = await api.get("/api/placements");
    setPlacements(data);
  };

  useEffect(() => { loadPlacements(); }, []);

  // Candidatures with stage "Placé" that don't already have a placement
  const placedCandidatures = candidatures.filter(cd =>
    cd.stage === "Placé" && !placements.some(p => p.candidatureId === cd.id)
  );

  const handleAdd = async () => {
    if (!addForm.candidatureId) return;
    const cd = candidatures.find(c => c.id === Number(addForm.candidatureId));
    if (!cd) return;
    const res = await api.post("/api/placements", {
      candidatureId: cd.id,
      candidateId: cd.candidateId,
      missionId: cd.missionId,
      company: cd.missionCompany || "",
      startDate: addForm.startDate || null,
      probationDate: addForm.probationDate || null,
    });
    if (res.ok) {
      setShowAdd(false);
      setAddForm({});
      await loadPlacements();
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    const res = await api.put(`/api/placements/${editing}`, form);
    if (res.ok) {
      setEditing(null);
      setForm({});
      await loadPlacements();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?")) return;
    await api.del(`/api/placements/${id}`);
    await loadPlacements();
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      startDate: p.startDate ? p.startDate.split("T")[0] : "",
      probationDate: p.probationDate ? p.probationDate.split("T")[0] : "",
      startInvoiceSent: p.startInvoiceSent,
      startInvoiceName: p.startInvoiceName,
      probationInvoiceSent: p.probationInvoiceSent,
      probationInvoiceName: p.probationInvoiceName,
      notes: p.notes,
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Suivi des placements</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{placements.length} candidat{placements.length !== 1 ? "s" : ""} placé{placements.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setAddForm({}); }} disabled={placedCandidatures.length === 0}>
          + Ajouter un placement
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Nouveau placement</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4, display: "block" }}>CANDIDATURE PLACÉE *</label>
              <select className="input" value={addForm.candidatureId || ""} onChange={e => setAddForm(p => ({ ...p, candidatureId: e.target.value }))}>
                <option value="">— Sélectionner —</option>
                {placedCandidatures.map(cd => (
                  <option key={cd.id} value={cd.id}>{cd.candidateName} → {cd.missionTitle} ({cd.missionCompany})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4, display: "block" }}>DATE DE DÉMARRAGE</label>
              <input className="input" type="date" value={addForm.startDate || ""} onChange={e => setAddForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4, display: "block" }}>FIN PÉRIODE D'ESSAI</label>
              <input className="input" type="date" value={addForm.probationDate || ""} onChange={e => setAddForm(p => ({ ...p, probationDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleAdd}>Créer</button>
          </div>
        </div>
      )}

      {placedCandidatures.length === 0 && placements.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>Aucun candidat placé pour le moment.</p>
          <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>Les candidatures avec le statut « Placé » dans le pipeline apparaîtront ici.</p>
        </div>
      )}

      {/* Placements list */}
      {placements.map(p => (
        <div key={p.id} className="card" style={{ padding: 20, marginBottom: 14 }}>
          {editing === p.id ? (
            /* Edit mode */
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #d1fae5, #6ee7b7)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#059669" }}>{p.candidateName?.[0] || "?"}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{p.candidateName}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{p.missionTitle} — {p.company || p.missionCompany}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                {/* Start section */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", marginBottom: 10 }}>DÉMARRAGE</div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 3 }}>Date de démarrage</label>
                    <input className="input" type="date" value={form.startDate || ""} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <input type="checkbox" checked={form.startInvoiceSent || false} onChange={e => setForm(f => ({ ...f, startInvoiceSent: e.target.checked }))} />
                    <label style={{ fontSize: 12, color: "#0f172a" }}>Facture envoyée</label>
                  </div>
                  {form.startInvoiceSent && (
                    <div>
                      <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 3 }}>Nom de la facture</label>
                      <input className="input" value={form.startInvoiceName || ""} onChange={e => setForm(f => ({ ...f, startInvoiceName: e.target.value }))} placeholder="FAC-2026-001" />
                    </div>
                  )}
                </div>
                {/* Probation section */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", marginBottom: 10 }}>VALIDATION PÉRIODE D'ESSAI</div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 3 }}>Date de validation</label>
                    <input className="input" type="date" value={form.probationDate || ""} onChange={e => setForm(f => ({ ...f, probationDate: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <input type="checkbox" checked={form.probationInvoiceSent || false} onChange={e => setForm(f => ({ ...f, probationInvoiceSent: e.target.checked }))} />
                    <label style={{ fontSize: 12, color: "#0f172a" }}>Facture envoyée</label>
                  </div>
                  {form.probationInvoiceSent && (
                    <div>
                      <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 3 }}>Nom de la facture</label>
                      <input className="input" value={form.probationInvoiceName || ""} onChange={e => setForm(f => ({ ...f, probationInvoiceName: e.target.value }))} placeholder="FAC-2026-002" />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 3 }}>Notes</label>
                <textarea className="input" style={{ resize: "vertical", minHeight: 50 }} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes..." />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #d1fae5, #6ee7b7)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#059669" }}>{p.candidateName?.[0] || "?"}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{p.candidateName}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{p.missionTitle} — {p.company || p.missionCompany}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => startEdit(p)}>Modifier</button>
                  <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => handleDelete(p.id)}>Suppr.</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Start info */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", marginBottom: 8 }}>DÉMARRAGE</div>
                  <div style={{ fontSize: 13, color: "#0f172a", marginBottom: 6 }}>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>Date : </span>
                    {p.startDate ? new Date(p.startDate).toLocaleDateString("fr-CA") : "—"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>Facture : </span>
                    <span className="tag" style={{ background: p.startInvoiceSent ? "#d1fae5" : "#fee2e2", color: p.startInvoiceSent ? "#059669" : "#dc2626", fontSize: 11 }}>
                      {p.startInvoiceSent ? "Envoyée" : "Non envoyée"}
                    </span>
                    {p.startInvoiceSent && p.startInvoiceName && (
                      <span style={{ fontSize: 11, color: "#64748b" }}>{p.startInvoiceName}</span>
                    )}
                  </div>
                </div>
                {/* Probation info */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", marginBottom: 8 }}>VALIDATION PÉRIODE D'ESSAI</div>
                  <div style={{ fontSize: 13, color: "#0f172a", marginBottom: 6 }}>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>Date : </span>
                    {p.probationDate ? new Date(p.probationDate).toLocaleDateString("fr-CA") : "—"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>Facture : </span>
                    <span className="tag" style={{ background: p.probationInvoiceSent ? "#d1fae5" : "#fee2e2", color: p.probationInvoiceSent ? "#059669" : "#dc2626", fontSize: 11 }}>
                      {p.probationInvoiceSent ? "Envoyée" : "Non envoyée"}
                    </span>
                    {p.probationInvoiceSent && p.probationInvoiceName && (
                      <span style={{ fontSize: 11, color: "#64748b" }}>{p.probationInvoiceName}</span>
                    )}
                  </div>
                </div>
              </div>
              {p.notes && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>{p.notes}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
