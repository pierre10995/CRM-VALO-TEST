import { useState, useEffect } from "react";
import api from "../../services/api";
import PartnerMissionList from "./PartnerMissionList";
import PartnerMissionDetail from "./PartnerMissionDetail";

export default function PartnerPortal({ partner, onLogout }) {
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMissions = async () => {
    setLoading(true);
    const data = await api.get("/api/partner/missions");
    setMissions(data);
    setLoading(false);
  };

  const loadCandidatures = async (missionId) => {
    const data = await api.get(`/api/partner/candidatures${missionId ? `?missionId=${missionId}` : ""}`);
    setCandidatures(data);
  };

  useEffect(() => { loadMissions(); }, []);

  const handleSelectMission = async (mission) => {
    setSelectedMission(mission);
    await loadCandidatures(mission.id);
  };

  const handleBack = () => {
    setSelectedMission(null);
    setCandidatures([]);
  };

  const handleSubmitted = async () => {
    if (selectedMission) await loadCandidatures(selectedMission.id);
    await loadMissions();
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Sora', sans-serif", background: "#f0f4ff" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: "white", padding: "24px 16px", display: "flex", flexDirection: "column", boxShadow: "1px 0 0 #e2e8f0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #059669, #10b981)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>VALO Recrutement</div>
            <div style={{ fontSize: 10.5, color: "#059669", fontWeight: 600 }}>Espace Partenaire</div>
          </div>
        </div>

        <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{partner.name}</div>
          {partner.company && <div style={{ fontSize: 11, color: "#64748b" }}>{partner.company}</div>}
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{partner.email}</div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "0 4px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Missions</div>
        <div
          onClick={handleBack}
          style={{
            padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: !selectedMission ? "#ecfdf5" : "transparent",
            color: !selectedMission ? "#059669" : "#475569",
            transition: "all 0.15s",
          }}
        >
          Toutes les missions ({missions.length})
        </div>

        <div style={{ marginTop: "auto", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
          <button onClick={onLogout} style={{ width: "100%", padding: "8px 12px", background: "none", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12.5, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Chargement...</div>
        ) : selectedMission ? (
          <PartnerMissionDetail
            mission={selectedMission}
            candidatures={candidatures}
            onBack={handleBack}
            onSubmitted={handleSubmitted}
          />
        ) : (
          <PartnerMissionList
            missions={missions}
            onSelect={handleSelectMission}
          />
        )}
      </main>
    </div>
  );
}
