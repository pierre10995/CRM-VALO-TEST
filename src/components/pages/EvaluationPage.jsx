import { useState, useEffect } from "react";
import api from "../../services/api";
import SearchSelect from "../common/SearchSelect";

export default function EvaluationPage({ candidates, missions, loadAll }) {
  const [candidateId, setCandidateId] = useState("");
  const [missionId, setMissionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [evaluations, setEvaluations] = useState([]);

  const loadEvaluations = async () => {
    const data = await api.get("/api/evaluations");
    setEvaluations(data);
  };

  useEffect(() => { loadEvaluations(); }, []);

  const generate = async () => {
    if (!candidateId || !missionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/evaluations/generate", { candidateId: Number(candidateId), missionId: Number(missionId) });
      if (res.ok) {
        await loadEvaluations();
        setCandidateId("");
        setMissionId("");
      } else {
        const err = await res.json();
        setError(err.error || "Erreur lors de l'évaluation");
      }
    } catch (err) {
      setError("Erreur réseau");
    }
    setLoading(false);
  };

  const deleteEvaluation = async (id) => {
    await api.del(`/api/evaluations/${id}`);
    await loadEvaluations();
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Évaluation IA</h1>
        <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>Évaluez la compatibilité entre un candidat et un poste</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Lancer une évaluation</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, display: "block" }}>Candidat</label>
            <SearchSelect
              value={candidateId}
              onChange={setCandidateId}
              options={candidates.map(c => ({ value: c.id, label: c.name, sub: c.skills ? c.skills.split(",").slice(0, 3).join(", ") : "" }))}
              placeholder="Rechercher un candidat..."
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, display: "block" }}>Poste</label>
            <SearchSelect
              value={missionId}
              onChange={setMissionId}
              options={missions.filter(m => m.status === "Ouverte" || m.status === "En cours").map(m => ({ value: m.id, label: `${m.title} — ${m.company}`, sub: [m.location, m.contractType].filter(Boolean).join(" — ") }))}
              placeholder="Rechercher un poste..."
            />
          </div>
          <button className="btn btn-primary" style={{ padding: "10px 24px", fontSize: 13 }} onClick={generate} disabled={loading || !candidateId || !missionId}>
            {loading ? "Analyse en cours..." : "Évaluer"}
          </button>
        </div>
        {error && <div style={{ padding: "8px 12px", background: "#fee2e2", borderRadius: 8, fontSize: 12, color: "#dc2626", marginTop: 12 }}>{error}</div>}
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Historique ({evaluations.length})</div>
      {evaluations.length === 0 && <div className="card" style={{ textAlign: "center", color: "#94a3b8" }}>Aucune évaluation</div>}
      {evaluations.map(ev => {
        let positives = [], negatives = [], clarifs = [];
        try { positives = JSON.parse(ev.positives); } catch {}
        try { negatives = JSON.parse(ev.negatives); } catch {}
        try { clarifs = JSON.parse(ev.clarifications); } catch {}
        const scoreColor = ev.score >= 70 ? "#059669" : ev.score >= 40 ? "#d97706" : "#dc2626";
        const scoreBg = ev.score >= 70 ? "#ecfdf5" : ev.score >= 40 ? "#fffbeb" : "#fef2f2";

        return (
          <div key={ev.id} className="card" style={{ marginBottom: 12, border: `1.5px solid ${scoreBg}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: scoreBg, border: `3px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: scoreColor }}>{ev.score}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{ev.candidateName}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{ev.missionTitle} — {ev.missionCompany}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(ev.createdAt).toLocaleDateString("fr-CA")}</div>
                </div>
              </div>
              <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: 11 }} onClick={() => window.confirm("Attention : cette suppression est définitive. Voulez-vous continuer ?") && deleteEvaluation(ev.id)}>Suppr.</button>
            </div>

            {ev.summary && <div style={{ fontSize: 13, color: "#374151", marginBottom: 14, lineHeight: 1.6, fontStyle: "italic", background: "#f8fafc", borderRadius: 8, padding: 12 }}>{ev.summary}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 6 }}>POINTS POSITIFS</div>
                {positives.map((p, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#374151", marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #a7f3d0" }}>{p}</div>
                ))}
                {positives.length === 0 && <div style={{ fontSize: 11, color: "#94a3b8" }}>—</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>POINTS NÉGATIFS</div>
                {negatives.map((n, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#374151", marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #fecaca" }}>{n}</div>
                ))}
                {negatives.length === 0 && <div style={{ fontSize: 11, color: "#94a3b8" }}>—</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", marginBottom: 6 }}>À ÉCLAIRCIR</div>
                {clarifs.map((cl, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#374151", marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #fde68a" }}>{cl}</div>
                ))}
                {clarifs.length === 0 && <div style={{ fontSize: 11, color: "#94a3b8" }}>—</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
