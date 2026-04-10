import { useState, useRef } from "react";
import { exportCsv } from "../../utils/exportCsv";
import api from "../../services/api";

export default function PipelinePage({ candidatures, candidates, missions, users, onEdit, onAdd, onDelete, loadAll }) {
  const [draggedId, setDraggedId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [filterOwner, setFilterOwner] = useState("all");
  const dragRef = useRef(null);

  const partnerCol = { key: "Proposition partenaire", label: "Proposition partenaire", color: "#059669", bg: "#f0fdf4", border: "#a7f3d0" };
  const stageConfig = [
    { key: "Présélectionné", label: "Présélectionné", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    { key: "Soumis", label: "Soumis", color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
    { key: "Entretien", label: "Entretien", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    { key: "Finaliste", label: "Finaliste", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
    { key: "Placé", label: "Placé", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    { key: "Refusé", label: "Refusé", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  ];

  const allCols = [partnerCol, ...stageConfig];

  // Owners who have at least one candidature via assigned missions
  const ownerOptions = (users || []).filter(u => candidatures.some(cd => cd.missionAssignedTo === u.id));
  const filteredCandidatures = filterOwner === "all" ? candidatures : candidatures.filter(cd => String(cd.missionAssignedTo) === filterOwner);

  const handleDragStart = (e, cd) => {
    setDraggedId(cd.id);
    dragRef.current = cd;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(stageKey);
  };

  const handleDragLeave = () => setDropTarget(null);

  const handleDrop = async (e, stageKey) => {
    e.preventDefault();
    setDropTarget(null);
    const cd = dragRef.current;
    if (!cd || cd.stage === stageKey) { setDraggedId(null); return; }

    if (!window.confirm(`Déplacer cette candidature vers "${stageKey}" ?`)) { setDraggedId(null); dragRef.current = null; return; }

    try {
      await api.put(`/api/candidatures/${cd.id}`, {
        stage: stageKey, rating: cd.rating || 0, notes: cd.notes || "", interviewDate: cd.interviewDate || null,
      });
      if (loadAll) await loadAll();
    } catch { /* silent */ }
    setDraggedId(null);
    dragRef.current = null;
  };

  const handleDragEnd = () => { setDraggedId(null); setDropTarget(null); dragRef.current = null; };

  const quickMove = async (cd, newStage) => {
    if (!window.confirm(`Déplacer cette candidature vers "${newStage}" ?`)) return;
    try {
      await api.put(`/api/candidatures/${cd.id}`, {
        stage: newStage, rating: cd.rating || 0, notes: cd.notes || "", interviewDate: cd.interviewDate || null,
      });
      if (loadAll) await loadAll();
    } catch { /* silent */ }
  };

  const renderCard = (cd, col) => {
    // Quick-action: show next logical stage buttons
    const nextStages = {
      "Proposition partenaire": ["Présélectionné", "Refusé"],
      "Présélectionné": ["Soumis", "Refusé"],
      "Soumis": ["Entretien", "Refusé"],
      "Entretien": ["Finaliste", "Refusé"],
      "Finaliste": ["Placé", "Refusé"],
    };
    const actions = nextStages[cd.stage] || [];

    return (
      <div
        key={cd.id}
        draggable
        onDragStart={e => handleDragStart(e, cd)}
        onDragEnd={handleDragEnd}
        style={{
          background: "white", borderRadius: 10, padding: 10, cursor: "grab",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          opacity: draggedId === cd.id ? 0.4 : 1,
          transition: "opacity 0.15s",
        }}
        onClick={() => onEdit(cd)}
      >
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{cd.candidateName}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{cd.missionTitle}</div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>{cd.missionCompany}</div>
        {cd.partnerName && (
          <span style={{ display: "inline-block", marginTop: 4, padding: "1px 7px", background: "#d1fae5", borderRadius: 6, fontSize: 10, fontWeight: 600, color: "#059669" }}>
            {cd.partnerName}
          </span>
        )}
        {cd.rating > 0 && <div style={{ marginTop: 4, fontSize: 11, color: "#f59e0b" }}>{"★".repeat(cd.rating)}</div>}
        {actions.length > 0 && (
          <div style={{ display: "flex", gap: 3, marginTop: 6 }} onClick={e => e.stopPropagation()}>
            {actions.map(stage => (
              <button key={stage} onClick={() => quickMove(cd, stage)} style={{
                padding: "2px 6px", fontSize: 9, fontWeight: 600, borderRadius: 4, border: "none", cursor: "pointer",
                background: stage === "Refusé" ? "#fee2e2" : "#f0fdf4",
                color: stage === "Refusé" ? "#dc2626" : "#059669",
              }}>{stage === "Refusé" ? "✕" : "→"} {stage}</button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Pipeline</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>Glissez-déposez les candidatures entre les colonnes</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {ownerOptions.length > 0 && (
            <select
              value={filterOwner}
              onChange={e => setFilterOwner(e.target.value)}
              style={{
                padding: "8px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                fontSize: 13, fontWeight: 600, color: "#0f172a", background: "white",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <option value="all">Tous les propriétaires</option>
              {ownerOptions.map(u => (
                <option key={u.id} value={String(u.id)}>{u.fullName || u.name}</option>
              ))}
            </select>
          )}
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowStats(s => !s)}>{showStats ? "Masquer stats" : "Analytique"}</button>
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => exportCsv(filteredCandidatures, [
            { key: "candidateName", label: "Candidat" }, { key: "missionTitle", label: "Mission" },
            { key: "missionCompany", label: "Entreprise" }, { key: "stage", label: "Étape" },
            { key: "rating", label: "Note" }, { key: "partnerName", label: "Partenaire" },
            { key: "createdAt", label: "Créé le" },
          ], `pipeline_${new Date().toISOString().slice(0, 10)}.csv`)}>Exporter CSV</button>
          <button className="btn btn-primary" onClick={onAdd}>+ Nouvelle candidature</button>
        </div>
      </div>
      {showStats && (() => {
        const total = filteredCandidatures.length;
        const placed = filteredCandidatures.filter(c => c.stage === "Placé").length;
        const refused = filteredCandidatures.filter(c => c.stage === "Refusé").length;
        const active = total - placed - refused;
        const convRate = total > 0 ? ((placed / total) * 100).toFixed(1) : 0;
        const stageCounts = {};
        allCols.forEach(col => { stageCounts[col.key] = filteredCandidatures.filter(c => c.stage === col.key).length; });
        return (
          <div className="card" style={{ marginBottom: 20, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Analytique Pipeline</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
              {[
                { label: "Total candidatures", value: total, color: "#3b82f6" },
                { label: "En cours", value: active, color: "#f59e0b" },
                { label: "Placés", value: placed, color: "#10b981" },
                { label: "Taux de conversion", value: `${convRate}%`, color: "#8b5cf6" },
              ].map(s => (
                <div key={s.label} style={{ background: "#f8fafc", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Répartition par étape</div>
            <div style={{ display: "flex", gap: 4, height: 28, borderRadius: 8, overflow: "hidden" }}>
              {allCols.filter(col => stageCounts[col.key] > 0).map(col => (
                <div key={col.key} title={`${col.label}: ${stageCounts[col.key]}`} style={{
                  flex: stageCounts[col.key], background: col.color, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "white", minWidth: stageCounts[col.key] > 0 ? 24 : 0,
                }}>{stageCounts[col.key]}</div>
              ))}
            </div>
          </div>
        );
      })()}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${allCols.length}, 1fr)`, gap: 12, overflowX: "auto" }}>
        {allCols.map(col => {
          const items = filteredCandidatures.filter(cd => cd.stage === col.key);
          const isOver = dropTarget === col.key;
          return (
            <div
              key={col.key}
              onDragOver={e => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.key)}
              style={{
                background: isOver ? `${col.color}15` : col.bg,
                border: `1.5px ${isOver ? "dashed" : "solid"} ${isOver ? col.color : col.border}`,
                borderRadius: 14, padding: 12, minWidth: 160,
                transition: "background 0.15s, border 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: col.color, textTransform: "uppercase" }}>{col.label}</h3>
                <span style={{ background: col.color, color: "white", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
                {items.length === 0 && !isOver && <div style={{ padding: "16px 0", textAlign: "center", fontSize: 11, color: "#94a3b8" }}>Vide</div>}
                {isOver && items.length === 0 && <div style={{ padding: "16px 0", textAlign: "center", fontSize: 11, color: col.color, fontWeight: 600 }}>Déposer ici</div>}
                {items.map(cd => renderCard(cd, col))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
