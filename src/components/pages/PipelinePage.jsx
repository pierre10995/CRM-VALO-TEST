import { useState, useRef, useMemo } from "react";
import { exportCsv } from "../../utils/exportCsv";
import { fmtCAD } from "../../utils/constants";
import api from "../../services/api";
import { useToast } from "../common/Toast";
import usePersistedState from "../../hooks/usePersistedState";

// Au-delà de ce délai sans mouvement, une candidature active est signalée « stagnante »
const STALE_DAYS = 7;
const CLOSED_STAGES = ["Placé", "Refusé", "Archivé"];
const daysSince = (d) => (d ? Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000)) : 0);

export default function PipelinePage({ candidatures, candidates, missions, users, onEdit, onAdd, onDelete, loadAll }) {
  const toast = useToast();
  const [draggedId, setDraggedId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [filterOwner, setFilterOwner] = usePersistedState("pipeline.filterOwner", "all");
  const dragRef = useRef(null);
  const missionById = useMemo(() => new Map((missions || []).map(m => [m.id, m])), [missions]);

  const partnerCol = { key: "Proposition partenaire", label: "Proposition partenaire", color: "var(--c-green)", bg: "var(--tint-green-soft)", border: "#a7f3d0" };
  const stageConfig = [
    { key: "Présélectionné", label: "Présélectionné", color: "#3b82f6", bg: "var(--tint-blue-soft)", border: "#bfdbfe" },
    { key: "Soumis", label: "Soumis", color: "var(--muted)", bg: "var(--surface-2)", border: "var(--line)" },
    { key: "Entretien", label: "Entretien", color: "#f59e0b", bg: "var(--tint-amber-soft)", border: "#fde68a" },
    { key: "Finaliste", label: "Finaliste", color: "#8b5cf6", bg: "var(--tint-violet-soft)", border: "#ddd6fe" },
    { key: "Placé", label: "Placé", color: "#10b981", bg: "var(--tint-green-soft)", border: "#a7f3d0" },
    { key: "Refusé", label: "Refusé", color: "#ef4444", bg: "var(--tint-red-soft)", border: "#fecaca" },
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

  const moveStage = async (cd, newStage) => {
    const previousStage = cd.stage;
    try {
      const res = await api.put(`/api/candidatures/${cd.id}`, {
        stage: newStage, rating: cd.rating || 0, notes: cd.notes || "", interviewDate: cd.interviewDate || null,
      });
      if (res && res.ok === false) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Déplacement impossible");
      }
      if (loadAll) await loadAll();
      toast.success(`${cd.candidateName} → ${newStage}`);
      return previousStage;
    } catch (e) {
      toast.error(e.message || "Erreur lors du déplacement");
      return null;
    }
  };

  const handleDrop = async (e, stageKey) => {
    e.preventDefault();
    setDropTarget(null);
    const cd = dragRef.current;
    if (!cd || cd.stage === stageKey) { setDraggedId(null); return; }
    await moveStage(cd, stageKey);
    setDraggedId(null);
    dragRef.current = null;
  };

  const handleDragEnd = () => { setDraggedId(null); setDropTarget(null); dragRef.current = null; };

  const quickMove = (cd, newStage) => moveStage(cd, newStage);

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
    // Ancienneté dans l'étape (updatedAt bouge à chaque changement d'étape)
    const age = daysSince(cd.updatedAt || cd.createdAt);
    const stale = !CLOSED_STAGES.includes(cd.stage) && age >= STALE_DAYS;

    return (
      <div
        key={cd.id}
        draggable
        role="button"
        tabIndex={0}
        aria-label={`${cd.candidateName} — ${cd.missionTitle} (${cd.stage}, depuis ${age} jour${age > 1 ? "s" : ""}${stale ? ", à relancer" : ""}). Entrée pour ouvrir.`}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onEdit(cd); } }}
        onDragStart={e => handleDragStart(e, cd)}
        onDragEnd={handleDragEnd}
        style={{
          background: "var(--surface)", borderRadius: 10, padding: 10, cursor: "grab",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          borderLeft: stale ? "3px solid #f59e0b" : "3px solid transparent",
          opacity: draggedId === cd.id ? 0.4 : 1,
          transition: "opacity 0.15s",
        }}
        onClick={() => onEdit(cd)}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 2 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{cd.candidateName}</div>
          {!CLOSED_STAGES.includes(cd.stage) && (
            <span title={stale ? `Sans mouvement depuis ${age} jours — à relancer` : `Dans cette étape depuis ${age} jour${age > 1 ? "s" : ""}`} style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: stale ? "var(--tint-amber)" : "var(--surface-3)", color: stale ? "#b45309" : "var(--muted)" }}>
              {stale ? "⚠ " : ""}{age} j
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{cd.missionTitle}</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>{cd.missionCompany}</div>
        {cd.partnerName && (
          <span style={{ display: "inline-block", marginTop: 4, padding: "1px 7px", background: "var(--tint-green)", borderRadius: 6, fontSize: 10, fontWeight: 600, color: "var(--c-green)" }}>
            {cd.partnerName}
          </span>
        )}
        {cd.rating > 0 && <div style={{ marginTop: 4, fontSize: 11, color: "#f59e0b" }} aria-label={`Note ${cd.rating} sur 5`} role="img">{"★".repeat(cd.rating)}</div>}
        {/* Alternative clavier au glisser-déposer : changer d'étape via un select */}
        <div style={{ display: "flex", gap: 4, marginTop: 6, alignItems: "center", flexWrap: "wrap" }} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
          {actions.map(stage => (
            <button key={stage} type="button" onClick={() => quickMove(cd, stage)} aria-label={`Passer ${cd.candidateName} à l'étape ${stage}`} style={{
              padding: "4px 8px", minHeight: 24, fontSize: 11, fontWeight: 600, borderRadius: 6, border: "none", cursor: "pointer",
              background: stage === "Refusé" ? "var(--tint-red)" : "var(--tint-green-soft)",
              color: stage === "Refusé" ? "var(--c-red)" : "var(--c-green)",
            }}>{stage === "Refusé" ? "✕" : "→"} {stage}</button>
          ))}
          <select
            aria-label={`Changer l'étape de ${cd.candidateName}`}
            value={cd.stage}
            onChange={e => { if (e.target.value !== cd.stage) quickMove(cd, e.target.value); }}
            style={{ marginLeft: "auto", fontSize: 11, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-soft)", fontFamily: "inherit", minHeight: 24 }}
          >
            {allCols.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)" }}>Pipeline</h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 3 }}>Glissez-déposez les candidatures entre les colonnes</p>
        </div>
        <div className="page-header-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {ownerOptions.length > 0 && (
            <select
              value={filterOwner}
              onChange={e => setFilterOwner(e.target.value)}
              style={{
                padding: "8px 14px", borderRadius: 10, border: "1.5px solid var(--line)",
                fontSize: 13, fontWeight: 600, color: "var(--ink)", background: "var(--surface)",
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
        const staleCount = filteredCandidatures.filter(c => !CLOSED_STAGES.includes(c.stage) && daysSince(c.updatedAt || c.createdAt) >= STALE_DAYS).length;
        const stageCounts = {};
        allCols.forEach(col => { stageCounts[col.key] = filteredCandidatures.filter(c => c.stage === col.key).length; });
        return (
          <div className="card" style={{ marginBottom: 20, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>Analytique Pipeline</div>
            <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 16 }}>
              {[
                { label: "Total candidatures", value: total, color: "#3b82f6" },
                { label: "En cours", value: active, color: "#f59e0b" },
                { label: `Stagnantes (≥ ${STALE_DAYS} j)`, value: staleCount, color: "var(--c-red)" },
                { label: "Placés", value: placed, color: "#10b981" },
                { label: "Taux de conversion", value: `${convRate}%`, color: "#8b5cf6" },
              ].map(s => (
                <div key={s.label} style={{ background: "var(--surface-2)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Répartition par étape</div>
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
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${allCols.length}, 1fr)`, gap: 12, overflowX: "auto" }}>
        {allCols.map(col => {
          const items = filteredCandidatures.filter(cd => cd.stage === col.key);
          const isOver = dropTarget === col.key;
          // Commission VALO potentielle portée par les candidatures de la colonne
          const potential = col.key === "Refusé" ? 0 : items.reduce((s, cd) => s + (missionById.get(cd.missionId)?.commission || 0), 0);
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: potential > 0 ? 4 : 12 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: col.color, textTransform: "uppercase" }}>{col.label}</h3>
                <span style={{ background: col.color, color: "white", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{items.length}</span>
              </div>
              {potential > 0 && (
                <div title="Commission VALO potentielle (somme des postes concernés)" style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 10 }}>{fmtCAD(potential)}</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
                {items.length === 0 && !isOver && <div style={{ padding: "16px 0", textAlign: "center", fontSize: 11, color: "var(--muted)" }}>Vide</div>}
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
