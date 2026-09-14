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
      <aside style={{ width: 240, background: "var(--surface)", padding: "24px 16px", display: "flex", flexDirection: "column", boxShadow: "1px 0 0 #e2e8f0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <img src="/logo-valo.svg" alt="VALO" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>VALO Recrutement</div>
            <div style={{ fontSize: 10.5, color: "var(--c-green)", fontWeight: 600 }}>Espace Partenaire</div>
          </div>
        </div>

        <div style={{ padding: "12px", background: "var(--tint-green-soft)", borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{partner.name}</div>
          {partner.company && <div style={{ fontSize: 11, color: "var(--muted)" }}>{partner.company}</div>}
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{partner.email}</div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", padding: "0 4px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Navigation</div>

        <NavItem active={activeView === "dashboard" && !selectedMission} onClick={() => { setActiveView("dashboard"); setSelectedMission(null); }}>
          Tableau de bord
        </NavItem>
        <NavItem active={activeView === "missions" && !selectedMission} onClick={() => { setActiveView("missions"); setSelectedMission(null); }}>
          Missions ({missions.length})
        </NavItem>

        {/* Notifications */}
        <div style={{ position: "relative", marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", padding: "0 4px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Notifications</div>
          <NavItem active={showNotifs} onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && unreadCount > 0) markAllRead(); }}>
            Alertes {unreadCount > 0 && <span style={{ background: "var(--c-red)", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 7px", marginLeft: 6 }}>{unreadCount}</span>}
          </NavItem>
        </div>

        <div style={{ marginTop: "auto", borderTop: "1px solid var(--line-soft)", paddingTop: 12 }}>
          <button onClick={onLogout} style={{ width: "100%", padding: "8px 12px", background: "none", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12.5, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {showNotifs ? (
          <NotificationsPanel notifications={notifications} onClose={() => setShowNotifs(false)} />
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>Chargement...</div>
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
        background: active ? "var(--tint-green-soft)" : "transparent",
        color: active ? "var(--c-green)" : "var(--ink-soft)",
        transition: "all 0.15s", display: "flex", alignItems: "center",
      }}
    >
      {children}
    </div>
  );
}

function NotificationsPanel({ notifications, onClose }) {
  const stageColors = {
    "Proposition partenaire": "var(--c-green)", "Présélectionné": "var(--c-blue)",
    "Soumis": "var(--muted)", "Entretien": "var(--c-amber)", "Finaliste": "var(--c-violet)",
    "Placé": "var(--c-green)", "Refusé": "var(--c-red)", "Archivé": "var(--muted)",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>Notifications</h2>
        <button onClick={onClose} style={{ background: "none", border: "1px solid var(--line)", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "var(--muted)", fontFamily: "inherit" }}>Fermer</button>
      </div>
      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>Aucune notification</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              background: n.read ? "white" : "var(--tint-green-soft)", borderRadius: 12, padding: "14px 16px",
              border: `1px solid ${n.read ? "var(--line)" : "#86efac"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    {n.missionTitle && <span>{n.missionTitle} — </span>}
                    {new Date(n.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {n.stage && (
                  <span style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, flexShrink: 0, marginLeft: 8,
                    color: stageColors[n.stage] || "var(--muted)", background: "var(--surface-3)",
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
