import { useState, useEffect } from "react";
import api from "../../services/api";
import PartnerMissionList from "./PartnerMissionList";
import PartnerMissionDetail from "./PartnerMissionDetail";
import PartnerDashboard from "./PartnerDashboard";

export default function PartnerPortal({ partner, onLogout }) {
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [activeView, setActiveView] = useState("missions"); // "missions" | "dashboard"

  const loadMissions = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/partner/missions");
      setMissions(Array.isArray(data) ? data : []);
    } catch { setMissions([]); }
    setLoading(false);
  };

  const loadCandidatures = async (missionId) => {
    try {
      const data = await api.get(`/api/partner/candidatures${missionId ? `?missionId=${missionId}` : ""}`);
      setCandidatures(Array.isArray(data) ? data : []);
    } catch { setCandidatures([]); }
  };

  const loadNotifications = async () => {
    try {
      const data = await api.get("/api/partner/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch { setNotifications([]); }
  };

  useEffect(() => { loadMissions(); loadNotifications(); }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    try { await api.put("/api/partner/notifications/read", {}); } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSelectMission = async (mission) => {
    setSelectedMission(mission);
    setActiveView("missions");
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
          <img src="/logo-valo.svg" alt="VALO" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
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

        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "0 4px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Navigation</div>

        <NavItem active={activeView === "dashboard" && !selectedMission} onClick={() => { setActiveView("dashboard"); setSelectedMission(null); }}>
          Tableau de bord
        </NavItem>
        <NavItem active={activeView === "missions" && !selectedMission} onClick={() => { setActiveView("missions"); setSelectedMission(null); }}>
          Missions ({missions.length})
        </NavItem>

        {/* Notifications */}
        <div style={{ position: "relative", marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "0 4px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Notifications</div>
          <NavItem active={showNotifs} onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && unreadCount > 0) markAllRead(); }}>
            Alertes {unreadCount > 0 && <span style={{ background: "#dc2626", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 7px", marginLeft: 6 }}>{unreadCount}</span>}
          </NavItem>
        </div>

        <div style={{ marginTop: "auto", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
          <button onClick={onLogout} style={{ width: "100%", padding: "8px 12px", background: "none", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12.5, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {showNotifs ? (
          <NotificationsPanel notifications={notifications} onClose={() => setShowNotifs(false)} />
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Chargement...</div>
        ) : selectedMission ? (
          <PartnerMissionDetail
            mission={selectedMission}
            candidatures={candidatures}
            onBack={handleBack}
            onSubmitted={handleSubmitted}
            partnerId={partner.id}
          />
        ) : activeView === "dashboard" ? (
          <PartnerDashboard />
        ) : (
          <PartnerMissionList missions={missions} onSelect={handleSelectMission} />
        )}
      </main>
    </div>
  );
}

function NavItem({ active, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 500,
        background: active ? "#ecfdf5" : "transparent",
        color: active ? "#059669" : "#475569",
        transition: "all 0.15s", display: "flex", alignItems: "center",
      }}
    >
      {children}
    </div>
  );
}

function NotificationsPanel({ notifications, onClose }) {
  const stageColors = {
    "Proposition partenaire": "#059669", "Présélectionné": "#2563eb",
    "Soumis": "#64748b", "Entretien": "#d97706", "Finaliste": "#7c3aed",
    "Placé": "#059669", "Refusé": "#dc2626", "Archivé": "#94a3b8",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Notifications</h2>
        <button onClick={onClose} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "inherit" }}>Fermer</button>
      </div>
      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>Aucune notification</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              background: n.read ? "white" : "#f0fdf4", borderRadius: 12, padding: "14px 16px",
              border: `1px solid ${n.read ? "#e2e8f0" : "#86efac"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {n.missionTitle && <span>{n.missionTitle} — </span>}
                    {new Date(n.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {n.stage && (
                  <span style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, flexShrink: 0, marginLeft: 8,
                    color: stageColors[n.stage] || "#64748b", background: "#f1f5f9",
                  }}>
                    {n.stage}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
