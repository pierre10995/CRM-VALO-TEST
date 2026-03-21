import { useState, useEffect } from "react";
import api from "./services/api";
import { GLOBAL_STYLES } from "./utils/styles";

// Components
import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/Sidebar";
import ModalWrapper from "./components/common/ModalWrapper";

// Pages
import DashboardPage from "./components/pages/DashboardPage";
import ClientsPage from "./components/pages/ClientsPage";
import CandidatsPage from "./components/pages/CandidatsPage";
import MissionsPage from "./components/pages/MissionsPage";
import PipelinePage from "./components/pages/PipelinePage";
import ActivitesPage from "./components/pages/ActivitesPage";
import EvaluationPage from "./components/pages/EvaluationPage";
import RevenuePage from "./components/pages/RevenuePage";
import PlacementsPage from "./components/pages/PlacementsPage";
import ObjectifsPage from "./components/pages/ObjectifsPage";
import PartenairesPage from "./components/pages/PartenairesPage";

// Partner portal
import PartnerPortal from "./components/partner/PartnerPortal";

// Forms
import ClientForm from "./components/forms/ClientForm";
import CandidatForm from "./components/forms/CandidatForm";
import MissionForm from "./components/forms/MissionForm";
import CandidatureForm from "./components/forms/CandidatureForm";
import ActivityForm from "./components/forms/ActivityForm";

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
  const [fiscalYears, setFiscalYears] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [workModes, setWorkModes] = useState([]);
  const [validationStatuses, setValidationStatuses] = useState([]);

  // UI state
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [detailId, setDetailId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");

  const candidates = contacts.filter(c => c.status === "Candidat");
  const clients = contacts.filter(c => c.status === "Client" || c.status === "Prospect");

  const loadAll = async () => {
    const [c, m, cd, a, u, s, fy, sec, wm, vs] = await Promise.all([
      api.get("/api/contacts"),
      api.get("/api/missions"),
      api.get("/api/candidatures"),
      api.get("/api/activities"),
      api.get("/api/users"),
      api.get("/api/stats"),
      api.get("/api/fiscal-years"),
      api.get("/api/sectors"),
      api.get("/api/work-modes"),
      api.get("/api/validation-statuses"),
    ]);
    setContacts(c); setMissions(m); setCandidatures(cd); setActivities(a); setUsers(u); setStats(s); setFiscalYears(fy); setSectors(sec); setWorkModes(wm); setValidationStatuses(vs);
  };

  useEffect(() => {
    const session = localStorage.getItem("crm_user");
    const token = localStorage.getItem("crm_token");
    if (session && token) { setCurrentUser(JSON.parse(session)); setAuthed(true); }
  }, []);

  useEffect(() => { if (authed) loadAll(); }, [authed]);

  const handleLogin = async () => {
    // Try internal user login first
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginForm) });
    if (res.ok) {
      const user = await res.json();
      localStorage.setItem("crm_token", user.token);
      setCurrentUser(user); setAuthed(true);
      localStorage.setItem("crm_user", JSON.stringify(user));
      setLoginError("");
      return;
    }
    // Try partner login (using login field as email)
    const partnerRes = await fetch("/api/partner/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: loginForm.login, password: loginForm.password }) });
    if (partnerRes.ok) {
      const partner = await partnerRes.json();
      localStorage.setItem("crm_token", partner.token);
      setCurrentUser(partner); setAuthed(true);
      localStorage.setItem("crm_user", JSON.stringify(partner));
      setLoginError("");
      return;
    }
    const err = await res.json().catch(() => ({ error: "Identifiant ou mot de passe incorrect." }));
    setLoginError(err.error);
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_user");
    localStorage.removeItem("crm_token");
    setAuthed(false); setCurrentUser(null);
    setLoginForm({ login: "", password: "" });
  };

  // CRUD helpers
  const saveContact = async () => {
    if (!form.company && !form.name) return;
    const cvFile = form._cvFile;
    const { _cvFile, ...formData } = form;
    let contactId = form.id;
    if (contactId) {
      await api.put(`/api/contacts/${contactId}`, formData);
    } else {
      const res = await api.post("/api/contacts", formData);
      if (res.ok) {
        const created = await res.json();
        contactId = created.id;
      }
    }
    // Upload CV if one was attached during creation
    if (cvFile && contactId) {
      await api.post("/api/files", {
        contactId,
        fileType: "cv",
        fileName: cvFile.fileName,
        mimeType: cvFile.mimeType,
        fileData: cvFile.fileData,
      });
    }
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

  // Partner portal
  if (currentUser?.role === "partner") {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <PartnerPortal partner={currentUser} onLogout={handleLogout} />
      </>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Sora', sans-serif", background: "#f0f4ff", overflow: "hidden" }}>
      <style>{GLOBAL_STYLES}</style>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} setDetailId={setDetailId} setSearch={setSearch} setFilterStatus={setFilterStatus} />

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {activeTab === "dashboard" && <DashboardPage stats={stats} activities={activities} contacts={contacts} missions={missions} candidatures={candidatures} />}
        {activeTab === "clients" && <ClientsPage contacts={clients} missions={missions} candidatures={candidatures} search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} onAdd={() => { setModal("client"); setForm({ status: "Prospect", sector: "Tech", revenue: 0 }); }} onEdit={c => { setModal("client"); setForm({ ...c }); }} onDelete={deleteContact} onDetail={id => setDetailId(id)} detailId={detailId} setDetailId={setDetailId} />}
        {activeTab === "candidats" && <CandidatsPage contacts={candidates} search={search} setSearch={setSearch} onAdd={() => { setModal("candidat"); setForm({ status: "Candidat", sector: "Tech", salaryExpectation: 0 }); }} onEdit={c => { setModal("candidat"); setForm({ ...c }); }} onDelete={deleteContact} onDetail={id => setDetailId(id)} detailId={detailId} setDetailId={setDetailId} candidatures={candidatures} missions={missions} loadAll={loadAll} validationStatuses={validationStatuses} users={users} />}
        {activeTab === "missions" && <MissionsPage missions={missions} contacts={contacts} users={users} candidatures={candidatures} onAdd={() => { setModal("mission"); setForm({ status: "Ouverte", priority: "Normale", contractType: "CDI" }); }} onEdit={m => { setModal("mission"); setForm({ ...m }); }} onDelete={deleteMission} />}
        {activeTab === "pipeline" && <PipelinePage candidatures={candidatures} candidates={candidates} missions={missions} onEdit={cd => { setModal("candidature"); setForm({ ...cd }); }} onAdd={() => { setModal("candidature"); setForm({ stage: "Présélectionné", rating: 0 }); }} onDelete={deleteCandidature} />}
        {activeTab === "activites" && <ActivitesPage activities={activities} contacts={contacts} missions={missions} users={users} currentUser={currentUser} onAdd={() => { setModal("activity"); setForm({ type: "Appel" }); }} onToggle={toggleActivity} onDelete={deleteActivity} />}
        {activeTab === "evaluation" && <EvaluationPage candidates={candidates} missions={missions} loadAll={loadAll} />}
        {activeTab === "placements" && <PlacementsPage candidatures={candidatures} candidates={candidates} missions={missions} />}
        {activeTab === "revenue" && <RevenuePage contacts={contacts} missions={missions} candidatures={candidatures} users={users} fiscalYears={fiscalYears} loadAll={loadAll} />}
        {activeTab === "objectifs" && <ObjectifsPage contacts={contacts} missions={missions} candidatures={candidatures} users={users} fiscalYears={fiscalYears} loadAll={loadAll} />}
        {activeTab === "partenaires" && <PartenairesPage missions={missions} currentUser={currentUser} />}
      </main>

      {/* Modals */}
      {modal === "client" && (
        <ModalWrapper onClose={() => setModal(null)} title={form.id ? "Modifier le client" : "Nouveau client"}>
          <ClientForm form={form} setForm={setForm} onSave={saveContact} onCancel={() => setModal(null)} sectors={sectors} />
        </ModalWrapper>
      )}
      {modal === "candidat" && (
        <ModalWrapper onClose={() => setModal(null)} title={form.id ? "Modifier le candidat" : "Nouveau candidat"}>
          <CandidatForm form={form} setForm={setForm} onSave={saveContact} onCancel={() => setModal(null)} sectors={sectors} validationStatuses={validationStatuses} onStatusesChanged={loadAll} users={users} />
        </ModalWrapper>
      )}
      {modal === "mission" && (
        <ModalWrapper onClose={() => setModal(null)} title={form.id ? "Modifier le poste" : "Nouveau poste"}>
          <MissionForm form={form} setForm={setForm} onSave={saveMission} onCancel={() => setModal(null)} contacts={contacts} users={users} fiscalYears={fiscalYears} workModes={workModes} />
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
