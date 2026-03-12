import { useState, useEffect } from "react";

// API helpers
const api = {
  get: async (url) => { const r = await fetch(url); return r.json(); },
  post: async (url, data) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return r; },
  put: async (url, data) => { const r = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return r; },
  del: async (url) => { const r = await fetch(url, { method: "DELETE" }); return r; },
};

const SECTORS = ["Tech", "Finance", "Santé", "Retail", "Industrie", "Services", "Médias", "Éducation", "Autre"];
const STAGES = ["Soumis", "Présélectionné", "Entretien", "Finaliste", "Placé", "Refusé"];
const ACTIVITY_TYPES = ["Appel", "Email", "Réunion", "Note"];
const CONTRACT_TYPES = ["CDI", "CDD", "Contrat", "Freelance", "Stage"];
const MISSION_STATUSES = ["Ouverte", "En cours", "Pourvue", "Fermée"];
const PRIORITIES = ["Basse", "Normale", "Haute", "Urgente"];

const fmtCAD = (n) => Number(n || 0).toLocaleString("fr-CA") + " $ CAD";

// ─── CSS Styles ─────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-size: 13.5px; font-weight: 500; color: #64748b; transition: all 0.2s; }
.nav-item:hover { background: #eff6ff; color: #2563eb; }
.nav-item.active { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
.card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.04); animation: fadeIn 0.4s ease; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 10px; border: none; cursor: pointer; font-size: 13.5px; font-weight: 600; font-family: inherit; transition: all 0.2s; }
.btn-primary { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37,99,235,0.4); }
.btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
.btn-ghost:hover { background: #f8fafc; color: #1e293b; }
.btn-danger { background: #fee2e2; color: #dc2626; border: none; }
.btn-danger:hover { background: #fecaca; }
.btn-success { background: #d1fae5; color: #059669; border: none; }
.btn-success:hover { background: #a7f3d0; }
.input { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; transition: border 0.2s; color: #1e293b; background: #fafbfd; }
.input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
.tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; }
.row-hover:hover { background: #f8fafc; cursor: pointer; }
.modal-bg { position: fixed; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
`;

// ─── Main App ───────────────────────────────────────────────────────────────
export default function CRM() {
  const [authed, setAuthed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Data
  const [contacts, setContacts] = useState([]);
  const [missions, setMissions] = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  // UI state
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [detailId, setDetailId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");

  const candidates = contacts.filter(c => c.status === "Candidat");
  const clients = contacts.filter(c => c.status === "Client" || c.status === "Prospect");

  const loadAll = async () => {
    const [c, m, cd, a, u, s] = await Promise.all([
      api.get("/api/contacts"),
      api.get("/api/missions"),
      api.get("/api/candidatures"),
      api.get("/api/activities"),
      api.get("/api/users"),
      api.get("/api/stats"),
    ]);
    setContacts(c); setMissions(m); setCandidatures(cd); setActivities(a); setUsers(u); setStats(s);
  };

  useEffect(() => {
    const session = localStorage.getItem("crm_user");
    if (session) { setCurrentUser(JSON.parse(session)); setAuthed(true); }
  }, []);

  useEffect(() => { if (authed) loadAll(); }, [authed]);

  const handleLogin = async () => {
    const res = await api.post("/api/login", loginForm);
    if (res.ok) {
      const user = await res.json();
      setCurrentUser(user); setAuthed(true);
      localStorage.setItem("crm_user", JSON.stringify(user));
      setLoginError("");
    } else {
      const err = await res.json();
      setLoginError(err.error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_user");
    setAuthed(false); setCurrentUser(null);
    setLoginForm({ login: "", password: "" });
  };

  // CRUD helpers
  const saveContact = async () => {
    if (!form.name) return;
    if (form.id) await api.put(`/api/contacts/${form.id}`, form);
    else await api.post("/api/contacts", form);
    await loadAll(); setModal(null);
  };

  const deleteContact = async (id) => {
    await api.del(`/api/contacts/${id}`);
    await loadAll(); setDetailId(null);
  };

  const saveMission = async () => {
    if (!form.title || !form.company) return;
    if (form.id) await api.put(`/api/missions/${form.id}`, form);
    else await api.post("/api/missions", form);
    await loadAll(); setModal(null);
  };

  const deleteMission = async (id) => {
    await api.del(`/api/missions/${id}`);
    await loadAll();
  };

  const saveCandidature = async () => {
    if (!form.candidateId || !form.missionId) return;
    if (form.id) await api.put(`/api/candidatures/${form.id}`, form);
    else await api.post("/api/candidatures", form);
    await loadAll(); setModal(null);
  };

  const deleteCandidature = async (id) => {
    await api.del(`/api/candidatures/${id}`);
    await loadAll();
  };

  const saveActivity = async () => {
    if (!form.type || !form.subject) return;
    if (form.id) {
      await api.put(`/api/activities/${form.id}`, form);
    } else {
      await api.post("/api/activities", { ...form, userId: currentUser?.id });
    }
    await loadAll(); setModal(null);
  };

  const toggleActivity = async (act) => {
    await api.put(`/api/activities/${act.id}`, { completed: !act.completed });
    await loadAll();
  };

  const deleteActivity = async (id) => {
    await api.del(`/api/activities/${id}`);
    await loadAll();
  };

  if (!authed) return <LoginScreen form={loginForm} setForm={setLoginForm} showPwd={showPwd} setShowPwd={setShowPwd} error={loginError} onLogin={handleLogin} />;

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
    { id: "clients", label: "Clients", icon: "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" },
    { id: "candidats", label: "Candidats", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
    { id: "missions", label: "Postes Ouverts", icon: "M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m-5 4h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" },
    { id: "pipeline", label: "Pipeline", icon: "M9 17V7m0 10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10V7" },
    { id: "activites", label: "Activités", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" },
    { id: "revenue", label: "Chiffre d'affaires", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Sora', sans-serif", background: "#f0f4ff", overflow: "hidden" }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Sidebar */}
      <aside style={{ width: 220, background: "white", padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "1px 0 0 #e2e8f0", flexShrink: 0 }}>
        <div style={{ padding: "0 6px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>VALO Recrutement</div>
              <div style={{ fontSize: 10.5, color: "#94a3b8" }}>CRM v2.0</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "0 8px 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Navigation</div>
        {NAV_ITEMS.map(item => (
          <div key={item.id} className={`nav-item ${activeTab === item.id ? "active" : ""}`} onClick={() => { setActiveTab(item.id); setDetailId(null); setSearch(""); setFilterStatus("Tous"); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
            {item.label}
          </div>
        ))}
        <div style={{ marginTop: "auto" }}>
          <div style={{ padding: "12px 8px", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{currentUser?.fullName?.[0] || "?"}</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{currentUser?.fullName || "Utilisateur"}</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{currentUser?.login || ""}</div>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 12.5, padding: "7px 12px" }} onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {activeTab === "dashboard" && <DashboardPage stats={stats} activities={activities} contacts={contacts} missions={missions} candidatures={candidatures} />}
        {activeTab === "clients" && <ClientsPage contacts={clients} search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} onAdd={() => { setModal("client"); setForm({ status: "Prospect", sector: "Tech", revenue: 0 }); }} onEdit={c => { setModal("client"); setForm({ ...c }); }} onDelete={deleteContact} onDetail={id => setDetailId(id)} detailId={detailId} setDetailId={setDetailId} />}
        {activeTab === "candidats" && <CandidatsPage contacts={candidates} search={search} setSearch={setSearch} onAdd={() => { setModal("candidat"); setForm({ status: "Candidat", sector: "Tech", salaryExpectation: 0 }); }} onEdit={c => { setModal("candidat"); setForm({ ...c }); }} onDelete={deleteContact} onDetail={id => setDetailId(id)} detailId={detailId} setDetailId={setDetailId} candidatures={candidatures} missions={missions} loadAll={loadAll} />}
        {activeTab === "missions" && <MissionsPage missions={missions} contacts={contacts} users={users} candidatures={candidatures} onAdd={() => { setModal("mission"); setForm({ status: "Ouverte", priority: "Normale", contractType: "CDI" }); }} onEdit={m => { setModal("mission"); setForm({ ...m }); }} onDelete={deleteMission} />}
        {activeTab === "pipeline" && <PipelinePage candidatures={candidatures} candidates={candidates} missions={missions} onEdit={cd => { setModal("candidature"); setForm({ ...cd }); }} onAdd={() => { setModal("candidature"); setForm({ stage: "Soumis", rating: 0 }); }} onDelete={deleteCandidature} />}
        {activeTab === "activites" && <ActivitesPage activities={activities} contacts={contacts} missions={missions} users={users} currentUser={currentUser} onAdd={() => { setModal("activity"); setForm({ type: "Appel" }); }} onToggle={toggleActivity} onDelete={deleteActivity} />}
        {activeTab === "revenue" && <RevenuePage contacts={contacts} missions={missions} candidatures={candidatures} users={users} />}
      </main>

      {/* Modals */}
      {modal === "client" && (
        <ModalWrapper onClose={() => setModal(null)} title={form.id ? "Modifier le client" : "Nouveau client"}>
          <ClientForm form={form} setForm={setForm} onSave={saveContact} onCancel={() => setModal(null)} />
        </ModalWrapper>
      )}
      {modal === "candidat" && (
        <ModalWrapper onClose={() => setModal(null)} title={form.id ? "Modifier le candidat" : "Nouveau candidat"}>
          <CandidatForm form={form} setForm={setForm} onSave={saveContact} onCancel={() => setModal(null)} />
        </ModalWrapper>
      )}
      {modal === "mission" && (
        <ModalWrapper onClose={() => setModal(null)} title={form.id ? "Modifier le poste" : "Nouveau poste"}>
          <MissionForm form={form} setForm={setForm} onSave={saveMission} onCancel={() => setModal(null)} contacts={contacts} users={users} />
        </ModalWrapper>
      )}
      {modal === "candidature" && (
        <ModalWrapper onClose={() => setModal(null)} title={form.id ? "Modifier la candidature" : "Nouvelle candidature"}>
          <CandidatureForm form={form} setForm={setForm} onSave={saveCandidature} onCancel={() => setModal(null)} candidates={candidates} missions={missions} />
        </ModalWrapper>
      )}
      {modal === "activity" && (
        <ModalWrapper onClose={() => setModal(null)} title="Nouvelle activité">
          <ActivityForm form={form} setForm={setForm} onSave={saveActivity} onCancel={() => setModal(null)} contacts={contacts} missions={missions} />
        </ModalWrapper>
      )}
    </div>
  );
}


// ─── Modal Wrapper ──────────────────────────────────────────────────────────
function ModalWrapper({ onClose, title, children, width = 520 }) {
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>X</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Login Screen ───────────────────────────────────────────────────────────
function LoginScreen({ form, setForm, showPwd, setShowPwd, error, onLogin }) {
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Sora', sans-serif", background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #e0f2fe 100%)", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} } .input-l { width:100%; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:12px; font-size:14px; font-family:inherit; outline:none; transition:all 0.2s; color:#1e293b; background:#fafbfd; } .input-l:focus { border-color:#2563eb; box-shadow:0 0 0 4px rgba(37,99,235,0.1); }`}</style>
      <div style={{ width: "100%", maxWidth: 420, padding: 40, background: "white", borderRadius: 24, boxShadow: "0 20px 60px rgba(37,99,235,0.12)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(37,99,235,0.35)", animation: "float 4s ease-in-out infinite" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>VALO Recrutement</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 6 }}>Connectez-vous à votre espace</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Identifiant</label>
            <input className="input-l" value={form.login} onChange={e => setForm(p => ({ ...p, login: e.target.value }))} placeholder="oceane" onKeyDown={e => e.key === "Enter" && document.getElementById("pwd-field")?.focus()} />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input id="pwd-field" className="input-l" type={showPwd ? "text" : "password"} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="********" onKeyDown={e => e.key === "Enter" && onLogin()} style={{ paddingRight: 44 }} />
              <button onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14 }}>{showPwd ? "Masquer" : "Voir"}</button>
            </div>
          </div>
          {error && <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 10, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>{error}</div>}
          <button onClick={onLogin} style={{ padding: 13, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white", border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(37,99,235,0.35)", marginTop: 4 }}>
            Se connecter
          </button>
        </div>
        <div style={{ marginTop: 20, padding: 14, background: "#f8fafc", borderRadius: 12, textAlign: "center" }}>
          <p style={{ fontSize: 11.5, color: "#64748b" }}><strong>oceane</strong> / oceane2026 - <strong>pierre</strong> / pierre2026</p>
        </div>
      </div>
    </div>
  );
}


// ─── Dashboard ──────────────────────────────────────────────────────────────
function DashboardPage({ stats, activities, contacts, missions, candidatures }) {
  const totalClients = contacts.filter(c => c.status === "Client").length;
  const totalCandidats = contacts.filter(c => c.status === "Candidat").length;
  const missionsOuvertes = missions.filter(m => m.status === "Ouverte" || m.status === "En cours").length;
  const placements = candidatures.filter(cd => cd.stage === "Placé").length;
  const totalRevenue = contacts.filter(c => c.status === "Client").reduce((s, c) => s + (c.revenue || 0), 0);
  const placedMissionIds = new Set(candidatures.filter(cd => cd.stage === "Placé").map(cd => cd.missionId));
  const totalCommissions = missions.filter(m => placedMissionIds.has(m.id)).reduce((s, m) => s + (m.commission || 0), 0);
  const recentActivities = activities.slice(0, 8);

  const kpis = [
    { label: "Clients", value: totalClients, color: "#10b981", bg: "#ecfdf5" },
    { label: "Candidats", value: totalCandidats, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Missions actives", value: missionsOuvertes, color: "#3b82f6", bg: "#eff6ff" },
    { label: "Placements", value: placements, color: "#8b5cf6", bg: "#f5f3ff" },
    { label: "CA Total (placements)", value: fmtCAD(totalCommissions), color: "#059669", bg: "#ecfdf5" },
    { label: "CA Clients", value: fmtCAD(totalRevenue), color: "#dc2626", bg: "#fef2f2" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Dashboard</h1>
        <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{new Date().toLocaleDateString("fr-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="card" style={{ background: kpi.bg }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: kpi.color, marginTop: 8 }}>{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Activités récentes</h3>
        {recentActivities.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13 }}>Aucune activité</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentActivities.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: a.completed ? "#d1fae5" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {a.type === "Appel" ? "T" : a.type === "Email" ? "@" : a.type === "Réunion" ? "R" : "N"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", textDecoration: a.completed ? "line-through" : "none" }}>{a.subject}</div>
                <div style={{ fontSize: 11.5, color: "#64748b" }}>{a.contactName && `${a.contactName} - `}{a.type} - {new Date(a.createdAt).toLocaleDateString("fr-CA")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── Clients Page ───────────────────────────────────────────────────────────
function ClientsPage({ contacts, search, setSearch, filterStatus, setFilterStatus, onAdd, onEdit, onDelete, onDetail, detailId, setDetailId }) {
  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Tous" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const detail = contacts.find(c => c.id === detailId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Clients & Prospects</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{filtered.length} entreprise{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Ajouter</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input className="input" style={{ flex: 1 }} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        {["Tous", "Client", "Prospect"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className="btn" style={{ padding: "9px 14px", background: filterStatus === s ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white", color: filterStatus === s ? "white" : "#64748b", border: filterStatus === s ? "none" : "1.5px solid #e2e8f0" }}>{s}</button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {["Contact", "Entreprise", "Secteur", "Statut", "CA ($ CAD)", "Actions"].map(h => (
              <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucun contact</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }} onClick={() => onDetail(c.id)}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: "#dbeafe", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>{c.name[0]}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: "#374151" }}>{c.company}</td>
                <td style={{ padding: "14px 20px" }}><span style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "3px 9px", borderRadius: 6 }}>{c.sector}</span></td>
                <td style={{ padding: "14px 20px" }}><span className="tag" style={{ background: c.status === "Client" ? "#d1fae5" : "#dbeafe", color: c.status === "Client" ? "#059669" : "#2563eb" }}>{c.status}</span></td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, fontWeight: 700, color: c.revenue > 0 ? "#0f172a" : "#cbd5e1" }}>{c.revenue > 0 ? fmtCAD(c.revenue) : "—"}</td>
                <td style={{ padding: "14px 20px" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onEdit(c)}>Modifier</button>
                    <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onDelete(c.id)}>Suppr.</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setDetailId(null)}>
          <div className="card" style={{ width: 420, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{detail.name}</h2>
              <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={() => setDetailId(null)}>X</button>
            </div>
            <span className="tag" style={{ background: detail.status === "Client" ? "#d1fae5" : "#dbeafe", color: detail.status === "Client" ? "#059669" : "#2563eb", marginBottom: 16, display: "inline-flex" }}>{detail.status}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              <div style={{ fontSize: 13.5, color: "#374151" }}>Entreprise: <strong>{detail.company}</strong></div>
              {detail.email && <div style={{ fontSize: 13.5, color: "#374151" }}>Email: {detail.email}</div>}
              {detail.phone && <div style={{ fontSize: 13.5, color: "#374151" }}>Tel: {detail.phone}</div>}
              {detail.city && <div style={{ fontSize: 13.5, color: "#374151" }}>Ville: {detail.city}</div>}
              <div style={{ fontSize: 13.5, color: "#374151" }}>Secteur: {detail.sector}</div>
              {detail.revenue > 0 && <div style={{ fontSize: 15, fontWeight: 700, color: "#059669", marginTop: 8 }}>CA: {fmtCAD(detail.revenue)}</div>}
              {detail.notes && <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", marginTop: 8 }}><p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>NOTES</p><p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{detail.notes}</p></div>}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => { onEdit(detail); setDetailId(null); }}>Modifier</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={() => onDelete(detail.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Candidats Page ─────────────────────────────────────────────────────────
function CandidatsPage({ contacts, search, setSearch, onAdd, onEdit, onDelete, onDetail, detailId, setDetailId, candidatures, missions, loadAll }) {
  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return !search || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.skills || "").toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q);
  });
  const detail = contacts.find(c => c.id === detailId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Candidats</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{filtered.length} candidat{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Ajouter un candidat</button>
      </div>
      <input className="input" style={{ marginBottom: 20 }} placeholder="Rechercher par nom, competences, ville..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {["Candidat", "Ville", "Compétences", "Salaire", "Disponibilité", "Actions"].map(h => (
              <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucun candidat</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }} onClick={() => onDetail(c.id)}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: "#fef3c7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#d97706" }}>{c.name[0]}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.email} {c.phone && `- ${c.phone}`}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: "#374151" }}>{c.city || "—"}</td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(c.skills || "").split(",").filter(Boolean).slice(0, 3).map((s, i) => (
                      <span key={i} style={{ fontSize: 11, background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: 12, fontWeight: 500 }}>{s.trim()}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, fontWeight: 600, color: c.salaryExpectation > 0 ? "#0f172a" : "#cbd5e1" }}>{c.salaryExpectation > 0 ? fmtCAD(c.salaryExpectation) : "—"}</td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>{c.availability || "—"}</td>
                <td style={{ padding: "14px 20px" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onEdit(c)}>Modifier</button>
                    <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onDelete(c.id)}>Suppr.</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setDetailId(null)}>
          <FicheCandidat contact={detail} onClose={() => setDetailId(null)} onEdit={() => { onEdit(detail); setDetailId(null); }} onDelete={() => onDelete(detail.id)} candidatures={candidatures} missions={missions} loadAll={loadAll} />
        </div>
      )}
    </div>
  );
}


// ─── Fiche Candidat (Detail with files) ─────────────────────────────────────
function FicheCandidat({ contact: c, onClose, onEdit, onDelete, candidatures, missions, loadAll }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState("");
  const [evalMissionId, setEvalMissionId] = useState("");

  const loadFiles = async () => {
    const data = await api.get(`/api/files/contact/${c.id}`);
    setFiles(data);
  };

  const loadEvaluations = async () => {
    const data = await api.get(`/api/evaluations/candidate/${c.id}`);
    setEvaluations(data);
  };

  useEffect(() => { loadFiles(); loadEvaluations(); }, [c.id]);

  const generateEvaluation = async () => {
    if (!evalMissionId) return;
    setEvalLoading(true);
    setEvalError("");
    try {
      const res = await api.post("/api/evaluations/generate", { candidateId: c.id, missionId: Number(evalMissionId) });
      if (res.ok) {
        await loadEvaluations();
        setEvalMissionId("");
      } else {
        const err = await res.json();
        setEvalError(err.error || "Erreur lors de l'évaluation");
      }
    } catch (err) {
      setEvalError("Erreur réseau");
    }
    setEvalLoading(false);
  };

  const deleteEvaluation = async (id) => {
    await api.del(`/api/evaluations/${id}`);
    await loadEvaluations();
  };

  const handleUpload = async (fileType) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(",")[1];
        await api.post("/api/files", {
          contactId: c.id,
          fileType,
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          fileData: base64,
        });
        await loadFiles();
        setUploading(false);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const deleteFile = async (id) => {
    await api.del(`/api/files/${id}`);
    await loadFiles();
  };

  const downloadFile = (id, name) => {
    window.open(`/api/files/${id}`, "_blank");
  };

  const cvFiles = files.filter(f => f.file_type === "cv");
  const crFiles = files.filter(f => f.file_type === "compte-rendu");
  const myCandidatures = candidatures.filter(cd => cd.candidateId === c.id);

  return (
    <div className="card" style={{ width: 600, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, #fef3c7, #fde68a)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#d97706" }}>{c.name[0]}</div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{c.name}</h2>
            <p style={{ fontSize: 13, color: "#64748b" }}>Fiche Candidat</p>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>X</button>
      </div>

      {/* Info section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>EMAIL</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{c.email || "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>TELEPHONE</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{c.phone || "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>VILLE</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{c.city || "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>SALAIRE SOUHAITE</div>
          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{c.salaryExpectation > 0 ? fmtCAD(c.salaryExpectation) : "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>DISPONIBILITE</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{c.availability || "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>SECTEUR</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{c.sector || "—"}</div>
        </div>
      </div>

      {/* Skills */}
      {c.skills && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>COMPETENCES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {c.skills.split(",").filter(Boolean).map((s, i) => (
              <span key={i} style={{ fontSize: 12, background: "#eff6ff", color: "#2563eb", padding: "4px 12px", borderRadius: 16, fontWeight: 500 }}>{s.trim()}</span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {c.notes && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>NOTES</div>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{c.notes}</div>
        </div>
      )}

      {/* CV Section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>CV</div>
          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => handleUpload("cv")} disabled={uploading}>
            {uploading ? "Envoi..." : "+ Ajouter CV"}
          </button>
        </div>
        {cvFiles.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucun CV</p>}
        {cvFiles.map(f => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{f.file_name}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(f.created_at).toLocaleDateString("fr-CA")}</span>
            <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => downloadFile(f.id, f.file_name)}>Télécharger</button>
            <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => deleteFile(f.id)}>Suppr.</button>
          </div>
        ))}
      </div>

      {/* Comptes-rendus Section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Comptes-rendus d'entretien</div>
          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => handleUpload("compte-rendu")} disabled={uploading}>
            {uploading ? "Envoi..." : "+ Ajouter"}
          </button>
        </div>
        {crFiles.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucun compte-rendu</p>}
        {crFiles.map(f => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{f.file_name}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(f.created_at).toLocaleDateString("fr-CA")}</span>
            <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => downloadFile(f.id, f.file_name)}>Télécharger</button>
            <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => deleteFile(f.id)}>Suppr.</button>
          </div>
        ))}
      </div>

      {/* Candidatures for this candidate */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Candidatures</div>
        {myCandidatures.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucune candidature</p>}
        {myCandidatures.map(cd => (
          <div key={cd.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{cd.missionTitle} - {cd.missionCompany}</span>
            <span className="tag" style={{ background: cd.stage === "Placé" ? "#d1fae5" : cd.stage === "Refusé" ? "#fee2e2" : "#dbeafe", color: cd.stage === "Placé" ? "#059669" : cd.stage === "Refusé" ? "#dc2626" : "#2563eb" }}>{cd.stage}</span>
          </div>
        ))}
      </div>

      {/* Évaluation CV vs Poste */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Évaluation CV vs Poste</div>

        {/* Formulaire de lancement */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select className="input" style={{ flex: 1, fontSize: 13 }} value={evalMissionId} onChange={e => setEvalMissionId(e.target.value)}>
            <option value="">-- Choisir un poste à évaluer --</option>
            {missions.filter(m => m.status === "Ouverte" || m.status === "En cours").map(m => (
              <option key={m.id} value={m.id}>{m.title} — {m.company}</option>
            ))}
          </select>
          <button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 12, whiteSpace: "nowrap" }} onClick={generateEvaluation} disabled={evalLoading || !evalMissionId}>
            {evalLoading ? "Analyse en cours..." : "Évaluer"}
          </button>
        </div>
        {evalError && <div style={{ padding: "8px 12px", background: "#fee2e2", borderRadius: 8, fontSize: 12, color: "#dc2626", marginBottom: 10 }}>{evalError}</div>}

        {/* Liste des évaluations existantes */}
        {evaluations.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucune évaluation</p>}
        {evaluations.map(ev => {
          let positives = [], negatives = [], clarifs = [];
          try { positives = JSON.parse(ev.positives); } catch {}
          try { negatives = JSON.parse(ev.negatives); } catch {}
          try { clarifs = JSON.parse(ev.clarifications); } catch {}
          const scoreColor = ev.score >= 70 ? "#059669" : ev.score >= 40 ? "#d97706" : "#dc2626";
          const scoreBg = ev.score >= 70 ? "#ecfdf5" : ev.score >= 40 ? "#fffbeb" : "#fef2f2";

          return (
            <div key={ev.id} style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 10, border: `1.5px solid ${scoreBg}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{ev.missionTitle}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{ev.missionCompany} — {new Date(ev.createdAt).toLocaleDateString("fr-CA")}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: scoreBg, border: `3px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: scoreColor }}>{ev.score}</div>
                  <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => deleteEvaluation(ev.id)}>X</button>
                </div>
              </div>

              {ev.summary && <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 12, lineHeight: 1.5, fontStyle: "italic" }}>{ev.summary}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
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

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onEdit}>Modifier</button>
        <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={onDelete}>Supprimer</button>
      </div>
    </div>
  );
}


// ─── Missions Page ──────────────────────────────────────────────────────────
function MissionsPage({ missions, contacts, users, candidatures, onAdd, onEdit, onDelete }) {
  const [detailMission, setDetailMission] = useState(null);
  const statusColors = { "Ouverte": { bg: "#dbeafe", color: "#2563eb" }, "En cours": { bg: "#fef3c7", color: "#d97706" }, "Pourvue": { bg: "#d1fae5", color: "#059669" }, "Fermée": { bg: "#f1f5f9", color: "#64748b" } };
  const priorityColors = { "Basse": "#94a3b8", "Normale": "#3b82f6", "Haute": "#f59e0b", "Urgente": "#dc2626" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Postes Ouverts</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{missions.length} mission{missions.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Nouveau poste</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {missions.map(m => {
          const sc = statusColors[m.status] || statusColors["Ouverte"];
          const mCandidatures = candidatures.filter(cd => cd.missionId === m.id);
          return (
            <div key={m.id} className="card" style={{ cursor: "pointer" }} onClick={() => setDetailMission(m)}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{m.title}</h3>
                  <p style={{ fontSize: 13, color: "#64748b" }}>{m.company} - {m.location}</p>
                </div>
                <span className="tag" style={{ background: sc.bg, color: sc.color }}>{m.status}</span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "#64748b", marginBottom: 10 }}>
                <span>{m.contractType}</span>
                <span>{m.salaryMin > 0 ? `${fmtCAD(m.salaryMin)} - ${fmtCAD(m.salaryMax)}` : "—"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: priorityColors[m.priority] || "#3b82f6" }}>{m.priority}</span>
                  {m.assignedName && <span style={{ fontSize: 11, color: "#94a3b8" }}>Assigné: {m.assignedName}</span>}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{mCandidatures.length} candidature{mCandidatures.length > 1 ? "s" : ""}</span>
                  {m.commission > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{fmtCAD(m.commission)}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => onEdit(m)}>Modifier</button>
                <button className="btn btn-danger" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => onDelete(m.id)}>Suppr.</button>
              </div>
            </div>
          );
        })}
      </div>
      {missions.length === 0 && <div className="card" style={{ textAlign: "center", color: "#94a3b8" }}>Aucune mission</div>}

      {detailMission && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setDetailMission(null)}>
          <FicheMission mission={detailMission} onClose={() => setDetailMission(null)} onEdit={() => { onEdit(detailMission); setDetailMission(null); }} onDelete={() => { onDelete(detailMission.id); setDetailMission(null); }} candidatures={candidatures} />
        </div>
      )}
    </div>
  );
}


// ─── Fiche Mission (Detail with files) ───────────────────────────────────────
function FicheMission({ mission: m, onClose, onEdit, onDelete, candidatures }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    const data = await api.get(`/api/files/mission/${m.id}`);
    setFiles(data);
  };

  useEffect(() => { loadFiles(); }, [m.id]);

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(",")[1];
        await api.post("/api/files", {
          missionId: m.id,
          fileType: "offre",
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          fileData: base64,
        });
        await loadFiles();
        setUploading(false);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const deleteFile = async (id) => {
    await api.del(`/api/files/${id}`);
    await loadFiles();
  };

  const downloadFile = (id) => {
    window.open(`/api/files/${id}`, "_blank");
  };

  const mCandidatures = candidatures.filter(cd => cd.missionId === m.id);

  return (
    <div className="card" style={{ width: 580, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, #dbeafe, #93c5fd)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#2563eb" }}>{m.title[0]}</div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{m.title}</h2>
            <p style={{ fontSize: 13, color: "#64748b" }}>{m.company} — {m.location || "N/A"}</p>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>X</button>
      </div>

      {/* Info section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>TYPE DE CONTRAT</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{m.contractType}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>SALAIRE</div>
          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{m.salaryMin > 0 ? `${fmtCAD(m.salaryMin)} - ${fmtCAD(m.salaryMax)}` : "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>COMMISSION</div>
          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{m.commission > 0 ? fmtCAD(m.commission) : "—"}</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>STATUT</div>
          <div style={{ fontSize: 13, color: "#0f172a" }}>{m.status}</div>
        </div>
      </div>

      {m.description && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>DESCRIPTION</div>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{m.description}</div>
        </div>
      )}
      {m.requirements && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>PRE-REQUIS</div>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{m.requirements}</div>
        </div>
      )}

      {/* Document de l'offre (PDF) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Document de l'offre (PDF)</div>
          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={handleUpload} disabled={uploading}>
            {uploading ? "Envoi..." : "+ Importer PDF"}
          </button>
        </div>
        {files.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucun document importé</p>}
        {files.map(f => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{f.file_name}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(f.created_at).toLocaleDateString("fr-CA")}</span>
            <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => downloadFile(f.id)}>Télécharger</button>
            <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => deleteFile(f.id)}>Suppr.</button>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>Ce document sera utilisé par l'IA lors de l'évaluation des candidats.</p>
      </div>

      {/* Candidatures */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Candidatures ({mCandidatures.length})</div>
        {mCandidatures.length === 0 && <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucune candidature</p>}
        {mCandidatures.map(cd => (
          <div key={cd.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>{cd.candidateName}</span>
            <span className="tag" style={{ background: cd.stage === "Placé" ? "#d1fae5" : cd.stage === "Refusé" ? "#fee2e2" : "#dbeafe", color: cd.stage === "Placé" ? "#059669" : cd.stage === "Refusé" ? "#dc2626" : "#2563eb" }}>{cd.stage}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onEdit}>Modifier</button>
        <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={onDelete}>Supprimer</button>
      </div>
    </div>
  );
}


// ─── Pipeline Page ──────────────────────────────────────────────────────────
function PipelinePage({ candidatures, candidates, missions, onEdit, onAdd, onDelete }) {
  const stageConfig = [
    { key: "Soumis", color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
    { key: "Présélectionné", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    { key: "Entretien", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    { key: "Finaliste", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
    { key: "Placé", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
    { key: "Refusé", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Pipeline</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>Suivi des candidatures</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Nouvelle candidature</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${stageConfig.length}, 1fr)`, gap: 12, overflowX: "auto" }}>
        {stageConfig.map(col => {
          const items = candidatures.filter(cd => cd.stage === col.key);
          return (
            <div key={col.key} style={{ background: col.bg, border: `1.5px solid ${col.border}`, borderRadius: 14, padding: 12, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.key}</h3>
                <span style={{ background: col.color, color: "white", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.length === 0 && <div style={{ padding: "16px 0", textAlign: "center", fontSize: 11, color: "#94a3b8" }}>Vide</div>}
                {items.map(cd => (
                  <div key={cd.id} style={{ background: "white", borderRadius: 10, padding: 10, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} onClick={() => onEdit(cd)}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{cd.candidateName}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{cd.missionTitle}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{cd.missionCompany}</div>
                    {cd.rating > 0 && <div style={{ marginTop: 4, fontSize: 11, color: "#f59e0b" }}>{"*".repeat(cd.rating)}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Activites Page ─────────────────────────────────────────────────────────
function ActivitesPage({ activities, contacts, missions, users, currentUser, onAdd, onToggle, onDelete }) {
  const typeIcons = { "Appel": "T", "Email": "@", "Réunion": "R", "Note": "N" };
  const typeColors = { "Appel": "#3b82f6", "Email": "#10b981", "Réunion": "#f59e0b", "Note": "#8b5cf6" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Activités</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{activities.length} activité{activities.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Nouvelle activité</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {activities.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucune activité</div>}
        {activities.map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: a.completed ? "#d1fae5" : `${typeColors[a.type]}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: a.completed ? "#059669" : typeColors[a.type] }}>
              {typeIcons[a.type] || "?"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", textDecoration: a.completed ? "line-through" : "none" }}>{a.subject}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {a.type}{a.contactName ? ` - ${a.contactName}` : ""}{a.userName ? ` (${a.userName})` : ""} - {new Date(a.createdAt).toLocaleDateString("fr-CA")}
              </div>
              {a.description && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{a.description}</div>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={`btn ${a.completed ? "btn-ghost" : "btn-success"}`} style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => onToggle(a)}>
                {a.completed ? "Réactiver" : "Terminer"}
              </button>
              <button className="btn btn-danger" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => onDelete(a.id)}>Suppr.</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Revenue Page ───────────────────────────────────────────────────────────
function RevenuePage({ contacts, missions, candidatures, users }) {
  const [activeOnglet, setActiveOnglet] = useState("total");

  const placements = candidatures.filter(cd => cd.stage === "Placé");
  const placedMissionIds = new Set(placements.map(cd => cd.missionId));
  const placedMissions = missions.filter(m => placedMissionIds.has(m.id));

  // CA global = commissions des missions avec au moins un placement
  const caTotal = placedMissions.reduce((s, m) => s + (m.commission || 0), 0);

  // CA par utilisateur
  const caByUser = users.map(u => {
    const userPlacedMissions = placedMissions.filter(m => m.assignedTo === u.id);
    const userPlacements = placements.filter(p => userPlacedMissions.some(m => m.id === p.missionId));
    const userCA = userPlacedMissions.reduce((s, m) => s + (m.commission || 0), 0);
    return { ...u, placedMissions: userPlacedMissions, placements: userPlacements, ca: userCA };
  });

  // Détails des placements enrichis (mission + candidat)
  const getPlacementDetails = (filteredMissions) => {
    return filteredMissions.map(m => {
      const mPlacements = placements.filter(p => p.missionId === m.id);
      return { ...m, placedCandidates: mPlacements.map(p => p.candidateName).filter(Boolean) };
    }).sort((a, b) => (b.commission || 0) - (a.commission || 0));
  };

  const maxCommission = Math.max(...placedMissions.map(m => m.commission || 0), 1);

  const onglets = [
    { id: "total", label: "Total" },
    ...users.map(u => ({ id: `user-${u.id}`, label: u.fullName })),
  ];

  // Données selon l'onglet actif
  let currentCA, currentPlacements, currentMissions, currentLabel;
  if (activeOnglet === "total") {
    currentCA = caTotal;
    currentPlacements = placements.length;
    currentMissions = getPlacementDetails(placedMissions);
    currentLabel = "Global";
  } else {
    const userId = Number(activeOnglet.replace("user-", ""));
    const userData = caByUser.find(u => u.id === userId);
    currentCA = userData?.ca || 0;
    currentPlacements = userData?.placements.length || 0;
    currentMissions = getPlacementDetails(userData?.placedMissions || []);
    currentLabel = userData?.fullName || "";
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Chiffre d'affaires</h1>
        <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>CA basé sur les postes pourvus (candidats placés)</p>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setActiveOnglet(o.id)} className="btn" style={{
            padding: "10px 20px",
            background: activeOnglet === o.id ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white",
            color: activeOnglet === o.id ? "white" : "#64748b",
            border: activeOnglet === o.id ? "none" : "1.5px solid #e2e8f0",
            boxShadow: activeOnglet === o.id ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
            fontSize: 13.5,
          }}>{o.label}</button>
        ))}
      </div>

      {/* KPIs pour l'onglet actif */}
      <div style={{ display: "grid", gridTemplateColumns: activeOnglet === "total" ? "repeat(3, 1fr)" : "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ background: "#ecfdf5" }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>CA {currentLabel}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#059669", marginTop: 6 }}>{fmtCAD(currentCA)}</p>
        </div>
        <div className="card" style={{ background: "#eff6ff" }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Placements</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", marginTop: 6 }}>{currentPlacements}</p>
        </div>
        {activeOnglet === "total" && (
          <div className="card" style={{ background: "#f5f3ff" }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Postes pourvus</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#8b5cf6", marginTop: 6 }}>{placedMissions.length}</p>
          </div>
        )}
      </div>

      {/* Résumé par utilisateur (uniquement onglet Total) */}
      {activeOnglet === "total" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {caByUser.map(u => (
            <div key={u.id} className="card" style={{ cursor: "pointer", border: "1.5px solid transparent", transition: "border 0.2s" }} onClick={() => setActiveOnglet(`user-${u.id}`)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#1d4ed8" }}>{u.fullName[0]}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{u.fullName}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{u.placements.length} placement{u.placements.length > 1 ? "s" : ""} - {u.placedMissions.length} poste{u.placedMissions.length > 1 ? "s" : ""} pourvu{u.placedMissions.length > 1 ? "s" : ""}</div>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#059669" }}>{fmtCAD(u.ca)}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Voir le détail →</div>
            </div>
          ))}
        </div>
      )}

      {/* Liste des postes pourvus */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
          {activeOnglet === "total" ? "Postes pourvus" : `Postes pourvus — ${currentLabel}`}
        </h3>
        {currentMissions.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13 }}>Aucun poste pourvu</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {currentMissions.map(m => (
            <div key={m.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{m.title}</div>
                  <div style={{ fontSize: 12.5, color: "#64748b" }}>{m.company} — {m.location || "—"}</div>
                  {m.placedCandidates.length > 0 && (
                    <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>
                      Candidat{m.placedCandidates.length > 1 ? "s" : ""} placé{m.placedCandidates.length > 1 ? "s" : ""} : {m.placedCandidates.join(", ")}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", whiteSpace: "nowrap" }}>{fmtCAD(m.commission)}</div>
              </div>
              <div style={{ height: 7, background: "#f1f5f9", borderRadius: 4 }}>
                <div style={{ width: `${((m.commission || 0) / maxCommission) * 100}%`, height: "100%", background: "linear-gradient(90deg, #059669, #34d399)", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── Forms ──────────────────────────────────────────────────────────────────
function ClientForm({ form, setForm, onSave, onCancel }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nom *"><input className="input" value={form.name || ""} onChange={e => f("name", e.target.value)} placeholder="Nom du contact" /></Field>
        <Field label="Entreprise *"><input className="input" value={form.company || ""} onChange={e => f("company", e.target.value)} placeholder="Nom entreprise" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Email"><input className="input" type="email" value={form.email || ""} onChange={e => f("email", e.target.value)} placeholder="email@exemple.ca" /></Field>
        <Field label="Telephone"><input className="input" value={form.phone || ""} onChange={e => f("phone", e.target.value)} placeholder="(514) 555-0000" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Statut">
          <select className="input" value={form.status || "Prospect"} onChange={e => f("status", e.target.value)}><option>Prospect</option><option>Client</option></select>
        </Field>
        <Field label="Secteur">
          <select className="input" value={form.sector || "Tech"} onChange={e => f("sector", e.target.value)}>{SECTORS.map(s => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="CA annuel ($ CAD)"><input className="input" type="number" value={form.revenue || ""} onChange={e => f("revenue", e.target.value)} placeholder="0" /></Field>
      </div>
      <Field label="Ville"><input className="input" value={form.city || ""} onChange={e => f("city", e.target.value)} placeholder="Montréal" /></Field>
      <Field label="Notes"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.notes || ""} onChange={e => f("notes", e.target.value)} placeholder="Informations..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave}>{form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}

function CandidatForm({ form, setForm, onSave, onCancel }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nom *"><input className="input" value={form.name || ""} onChange={e => f("name", e.target.value)} placeholder="Prénom Nom" /></Field>
        <Field label="Email"><input className="input" type="email" value={form.email || ""} onChange={e => f("email", e.target.value)} placeholder="email@exemple.ca" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Telephone"><input className="input" value={form.phone || ""} onChange={e => f("phone", e.target.value)} placeholder="(514) 555-0000" /></Field>
        <Field label="Ville"><input className="input" value={form.city || ""} onChange={e => f("city", e.target.value)} placeholder="Montréal" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Salaire souhaité ($ CAD)"><input className="input" type="number" value={form.salaryExpectation || ""} onChange={e => f("salaryExpectation", e.target.value)} placeholder="75000" /></Field>
        <Field label="Disponibilité"><input className="input" value={form.availability || ""} onChange={e => f("availability", e.target.value)} placeholder="Immédiate, 2 semaines..." /></Field>
      </div>
      <Field label="Secteur">
        <select className="input" value={form.sector || "Tech"} onChange={e => f("sector", e.target.value)}>{SECTORS.map(s => <option key={s}>{s}</option>)}</select>
      </Field>
      <Field label="Compétences (séparées par virgules)"><input className="input" value={form.skills || ""} onChange={e => f("skills", e.target.value)} placeholder="React, Node.js, PostgreSQL..." /></Field>
      <Field label="Notes"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.notes || ""} onChange={e => f("notes", e.target.value)} placeholder="Informations..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave}>{form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}

function MissionForm({ form, setForm, onSave, onCancel, contacts, users }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const clientContacts = contacts.filter(c => c.status === "Client" || c.status === "Prospect");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Titre du poste *"><input className="input" value={form.title || ""} onChange={e => f("title", e.target.value)} placeholder="Développeur Full Stack" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Entreprise *"><input className="input" value={form.company || ""} onChange={e => f("company", e.target.value)} placeholder="Nom entreprise" /></Field>
        <Field label="Lieu"><input className="input" value={form.location || ""} onChange={e => f("location", e.target.value)} placeholder="Montréal" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Type de contrat">
          <select className="input" value={form.contractType || "CDI"} onChange={e => f("contractType", e.target.value)}>{CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="Statut">
          <select className="input" value={form.status || "Ouverte"} onChange={e => f("status", e.target.value)}>{MISSION_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Priorité">
          <select className="input" value={form.priority || "Normale"} onChange={e => f("priority", e.target.value)}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Salaire min"><input className="input" type="number" value={form.salaryMin || ""} onChange={e => f("salaryMin", e.target.value)} placeholder="65000" /></Field>
        <Field label="Salaire max"><input className="input" type="number" value={form.salaryMax || ""} onChange={e => f("salaryMax", e.target.value)} placeholder="85000" /></Field>
        <Field label="Commission"><input className="input" type="number" value={form.commission || ""} onChange={e => f("commission", e.target.value)} placeholder="5000" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Client associé">
          <select className="input" value={form.clientContactId || ""} onChange={e => f("clientContactId", e.target.value || null)}>
            <option value="">-- Aucun --</option>
            {clientContacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
          </select>
        </Field>
        <Field label="Assigné à">
          <select className="input" value={form.assignedTo || ""} onChange={e => f("assignedTo", e.target.value || null)}>
            <option value="">-- Personne --</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Date limite"><input className="input" type="date" value={form.deadline ? form.deadline.split("T")[0] : ""} onChange={e => f("deadline", e.target.value)} /></Field>
      <Field label="Description"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.description || ""} onChange={e => f("description", e.target.value)} placeholder="Description du poste..." /></Field>
      <Field label="Pré-requis"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.requirements || ""} onChange={e => f("requirements", e.target.value)} placeholder="Compétences requises..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave}>{form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}

function CandidatureForm({ form, setForm, onSave, onCancel, candidates, missions }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Candidat *">
        <select className="input" value={form.candidateId || ""} onChange={e => f("candidateId", Number(e.target.value))}>
          <option value="">-- Sélectionnez --</option>
          {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Mission *">
        <select className="input" value={form.missionId || ""} onChange={e => f("missionId", Number(e.target.value))}>
          <option value="">-- Sélectionnez --</option>
          {missions.map(m => <option key={m.id} value={m.id}>{m.title} - {m.company}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Étape">
          <select className="input" value={form.stage || "Soumis"} onChange={e => f("stage", e.target.value)}>{STAGES.map(s => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Note (1-5)">
          <select className="input" value={form.rating || 0} onChange={e => f("rating", Number(e.target.value))}>
            {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? "Non noté" : n}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Date d'entretien"><input className="input" type="date" value={form.interviewDate ? form.interviewDate.split("T")[0] : ""} onChange={e => f("interviewDate", e.target.value)} /></Field>
      <Field label="Notes"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.notes || ""} onChange={e => f("notes", e.target.value)} placeholder="Notes..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave}>{form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}

function ActivityForm({ form, setForm, onSave, onCancel, contacts, missions }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Type *">
          <select className="input" value={form.type || "Appel"} onChange={e => f("type", e.target.value)}>{ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="Sujet *"><input className="input" value={form.subject || ""} onChange={e => f("subject", e.target.value)} placeholder="Objet de l'activité" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Contact associé">
          <select className="input" value={form.contactId || ""} onChange={e => f("contactId", e.target.value || null)}>
            <option value="">-- Aucun --</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Mission associée">
          <select className="input" value={form.missionId || ""} onChange={e => f("missionId", e.target.value || null)}>
            <option value="">-- Aucune --</option>
            {missions.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Date"><input className="input" type="date" value={form.dueDate ? form.dueDate.split("T")[0] : ""} onChange={e => f("dueDate", e.target.value)} /></Field>
      <Field label="Description"><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.description || ""} onChange={e => f("description", e.target.value)} placeholder="Détails..." /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave}>Créer</button>
      </div>
    </div>
  );
}

// ─── Field helper ───────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
