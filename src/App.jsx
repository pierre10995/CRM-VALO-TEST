import { useState, useEffect, useCallback, useRef } from "react";
import api from "./services/api";
import { GLOBAL_STYLES } from "./utils/styles";

// Components
import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/Sidebar";
import ModalWrapper from "./components/common/ModalWrapper";
import { ToastProvider, useToast } from "./components/common/Toast";
import { ConfirmProvider, useConfirm } from "./components/common/ConfirmDialog";

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
import ProfilePage from "./components/pages/ProfilePage";
import AdminPage from "./components/pages/AdminPage";

// Partner portal
import PartnerPortal from "./components/partner/PartnerPortal";

// Forms
import ClientForm from "./components/forms/ClientForm";
import CandidatForm from "./components/forms/CandidatForm";
import MissionForm from "./components/forms/MissionForm";
import CandidatureForm from "./components/forms/CandidatureForm";
import ActivityForm from "./components/forms/ActivityForm";

export default function CRM() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <CRMInner />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function CRMInner() {
  const toast = useToast();
  const confirm = useConfirm();
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
  const [loaded, setLoaded] = useState(false);

  // UI state
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  // Instantané du formulaire à l'ouverture, pour détecter les modifications non enregistrées
  const initialFormRef = useRef("");
  const [detailId, setDetailId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [saving, setSaving] = useState(false);

  const candidates = contacts.filter(c => c.status === "Candidat");
  const clients = contacts.filter(c => c.status === "Client" || c.status === "Prospect");

  const loadAll = async () => {
    // allSettled : un endpoint en échec (ex. endpoint réservé admin pour un
    // utilisateur non-admin) ne doit pas empêcher le chargement du reste.
    const endpoints = [
      ["/api/contacts", setContacts],
      ["/api/missions", setMissions],
      ["/api/candidatures", setCandidatures],
      ["/api/activities", setActivities],
      ["/api/users", setUsers],
      ["/api/stats", setStats],
      ["/api/fiscal-years", setFiscalYears],
      ["/api/sectors", setSectors],
      ["/api/work-modes", setWorkModes],
      ["/api/validation-statuses", setValidationStatuses],
    ];
    const results = await Promise.allSettled(endpoints.map(([url]) => api.get(url)));
    results.forEach((r, i) => {
      if (r.status === "fulfilled") endpoints[i][1](r.value);
    });
    setLoaded(true);
  };

  useEffect(() => {
    const session = localStorage.getItem("crm_user");
    if (session) { setCurrentUser(JSON.parse(session)); setAuthed(true); }
  }, []);

  useEffect(() => { if (authed && currentUser?.role !== "partner") loadAll(); }, [authed]);

  const ADMIN_TABS = ["revenue", "objectifs", "admin"];
  const SUPERADMIN_TABS = ["partenaires"];
  const isAdmin = ["admin", "superadmin"].includes(currentUser?.userRole);
  const isSuperAdmin = currentUser?.userRole === "superadmin";
  useEffect(() => {
    if (!isAdmin && ADMIN_TABS.includes(activeTab)) setActiveTab("dashboard");
    if (!isSuperAdmin && SUPERADMIN_TABS.includes(activeTab)) setActiveTab("dashboard");
  }, [isAdmin, isSuperAdmin, activeTab]);

  const handleLogin = async () => {
    // Try internal user login first
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(loginForm) });
    if (res.ok) {
      const user = await res.json();
      // Token is in httpOnly cookie — only store user info (no token) in localStorage
      setCurrentUser(user); setAuthed(true);
      localStorage.setItem("crm_user", JSON.stringify(user));
      setLoginError("");
      return;
    }
    // Try partner login (using login field as email)
    const partnerRes = await fetch("/api/partner/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email: loginForm.login, password: loginForm.password }) });
    if (partnerRes.ok) {
      const partner = await partnerRes.json();
      // Token is in httpOnly cookie only — not stored in localStorage for security
      setCurrentUser(partner); setAuthed(true);
      localStorage.setItem("crm_user", JSON.stringify(partner));
      setLoginError("");
      return;
    }
    const err = await res.json().catch(() => ({ error: "Identifiant ou mot de passe incorrect." }));
    setLoginError(err.error);
  };

  const handleLogout = () => {
    fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => {});
    localStorage.removeItem("crm_user");
    localStorage.removeItem("crm_token"); // cleanup legacy
    setAuthed(false); setCurrentUser(null);
    setLoginForm({ login: "", password: "" });
  };

  // CRUD helpers with toast notifications and loading protection
  const withSaving = useCallback((fn) => async (...args) => {
    if (saving) return;
    setSaving(true);
    try { await fn(...args); } catch (e) { toast.error(e.message || "Une erreur est survenue"); } finally { setSaving(false); }
  }, [saving, toast]);

  // Vérifie qu'une réponse api.post/put/del a réussi, sinon lève l'erreur serveur
  // (api.post/put/del renvoient un Response sans throw par eux-mêmes).
  const expectOk = async (resPromise) => {
    const res = await resPromise;
    if (res && res.ok === false) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "L'opération a échoué");
    }
    return res;
  };

  // Ouverture/fermeture des modales de formulaire avec garde-fou :
  // fermer un formulaire modifié demande confirmation avant de perdre la saisie.
  const openModal = (type, data) => {
    setModal(type);
    setForm(data);
    initialFormRef.current = JSON.stringify(data);
  };

  const closeModal = async () => {
    const dirty = JSON.stringify(form) !== initialFormRef.current;
    if (dirty && !(await confirm("Des modifications n'ont pas été enregistrées. Fermer quand même ?", { title: "Modifications non enregistrées", confirmLabel: "Fermer sans enregistrer" }))) return;
    setModal(null);
  };

  const saveContact = withSaving(async () => {
    if (!form.company && !form.name) return;
    const cvFile = form._cvFile;
    const { _cvFile, ...formData } = form;
    let contactId = form.id;
    if (contactId) {
      await expectOk(api.put(`/api/contacts/${contactId}`, formData));
    } else {
      const res = await expectOk(api.post("/api/contacts", formData));
      const created = await res.json();
      contactId = created.id;
    }
    if (cvFile && contactId) {
      await expectOk(api.post("/api/files", { contactId, fileType: "cv", fileName: cvFile.fileName, mimeType: cvFile.mimeType, fileData: cvFile.fileData }));
    }
    await loadAll(); setModal(null);
    toast.success(form.id ? "Contact mis à jour" : "Contact créé");
  });

  const deleteContact = withSaving(async (id) => {
    await expectOk(api.del(`/api/contacts/${id}`));
    await loadAll(); setDetailId(null);
    toast.success("Contact supprimé");
  });

  const saveMission = withSaving(async () => {
    if (!form.title || !form.company) return;
    if (form.id) await expectOk(api.put(`/api/missions/${form.id}`, form));
    else await expectOk(api.post("/api/missions", form));
    await loadAll(); setModal(null);
    toast.success(form.id ? "Poste mis à jour" : "Poste créé");
  });

  const deleteMission = withSaving(async (id) => {
    await expectOk(api.del(`/api/missions/${id}`));
    await loadAll();
    toast.success("Poste supprimé");
  });

  const saveCandidature = withSaving(async () => {
    if (!form.candidateId || !form.missionId) return;
    if (form.id) await expectOk(api.put(`/api/candidatures/${form.id}`, form));
    else await expectOk(api.post("/api/candidatures", form));
    await loadAll(); setModal(null);
    toast.success(form.id ? "Candidature mise à jour" : "Candidature créée");
  });

  const deleteCandidature = withSaving(async (id) => {
    await expectOk(api.del(`/api/candidatures/${id}`));
    await loadAll();
    toast.success("Candidature supprimée");
  });

  const saveActivity = withSaving(async () => {
    if (!form.type || !form.subject) return;
    if (form.id) {
      await expectOk(api.put(`/api/activities/${form.id}`, form));
    } else {
      await expectOk(api.post("/api/activities", { ...form, userId: currentUser?.id }));
    }
    await loadAll(); setModal(null);
    toast.success(form.id ? "Activité mise à jour" : "Activité créée");
  });

  const toggleActivity = async (act) => {
    try {
      await expectOk(api.put(`/api/activities/${act.id}`, { completed: !act.completed }));
      await loadAll();
    } catch (e) { toast.error(e.message || "Une erreur est survenue"); }
  };

  const deleteActivity = withSaving(async (id) => {
    await expectOk(api.del(`/api/activities/${id}`));
    await loadAll();
    toast.success("Activité supprimée");
  });

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

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} setDetailId={setDetailId} setSearch={setSearch} setFilterStatus={setFilterStatus} contacts={contacts} missions={missions} />

      {/* Main Content */}
      <main className="app-main" style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {activeTab === "dashboard" && <DashboardPage stats={stats} activities={activities} contacts={contacts} missions={missions} candidatures={candidatures} fiscalYears={fiscalYears} loaded={loaded} />}
        {activeTab === "clients" && <ClientsPage contacts={clients} missions={missions} candidatures={candidatures} users={users} search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} onAdd={() => openModal("client", { status: "Prospect", sector: "Tech", revenue: 0 })} onEdit={c => openModal("client", { ...c })} onDelete={deleteContact} onDetail={id => setDetailId(id)} detailId={detailId} setDetailId={setDetailId} />}
        {activeTab === "candidats" && <CandidatsPage contacts={candidates} search={search} setSearch={setSearch} onAdd={() => openModal("candidat", { status: "Candidat", sector: "Tech", salaryExpectation: 0 })} onEdit={c => openModal("candidat", { ...c })} onDelete={deleteContact} onDetail={id => setDetailId(id)} detailId={detailId} setDetailId={setDetailId} onAddCandidature={(candidateId) => { setDetailId(null); openModal("candidature", { candidateId, stage: "Présélectionné", rating: 0 }); }} candidatures={candidatures} missions={missions} loadAll={loadAll} validationStatuses={validationStatuses} users={users} />}
        {activeTab === "missions" && <MissionsPage missions={missions} contacts={contacts} users={users} candidatures={candidatures} onAdd={() => openModal("mission", { status: "Ouverte", priority: "Normale", contractType: "CDI" })} onEdit={m => openModal("mission", { ...m })} onDelete={deleteMission} />}
        {activeTab === "pipeline" && <PipelinePage candidatures={candidatures} candidates={candidates} missions={missions} users={users} onEdit={cd => openModal("candidature", { ...cd })} onAdd={() => openModal("candidature", { stage: "Présélectionné", rating: 0 })} onDelete={deleteCandidature} loadAll={loadAll} />}
        {activeTab === "activites" && <ActivitesPage activities={activities} contacts={contacts} missions={missions} users={users} currentUser={currentUser} onAdd={() => openModal("activity", { type: "Appel" })} onToggle={toggleActivity} onDelete={deleteActivity} />}
        {activeTab === "evaluation" && <EvaluationPage candidates={candidates} missions={missions} loadAll={loadAll} />}
        {activeTab === "placements" && <PlacementsPage candidatures={candidatures} candidates={candidates} missions={missions} />}
        {activeTab === "revenue" && <RevenuePage contacts={contacts} missions={missions} candidatures={candidatures} users={users} fiscalYears={fiscalYears} loadAll={loadAll} />}
        {activeTab === "objectifs" && <ObjectifsPage contacts={contacts} missions={missions} candidatures={candidatures} users={users} fiscalYears={fiscalYears} loadAll={loadAll} />}
        {activeTab === "partenaires" && <PartenairesPage missions={missions} currentUser={currentUser} />}
        {activeTab === "profil" && <ProfilePage currentUser={currentUser} contacts={contacts} missions={missions} candidatures={candidatures} users={users} setActiveTab={setActiveTab} />}
        {activeTab === "admin" && <AdminPage currentUser={currentUser} loadAll={loadAll} />}
      </main>

      {/* Modals */}
      {modal === "client" && (
        <ModalWrapper onClose={closeModal} title={form.id ? "Modifier le client" : "Nouveau client"}>
          <ClientForm form={form} setForm={setForm} onSave={saveContact} onCancel={closeModal} sectors={sectors} users={users} saving={saving} />
        </ModalWrapper>
      )}
      {modal === "candidat" && (
        <ModalWrapper onClose={closeModal} title={form.id ? "Modifier le candidat" : "Nouveau candidat"}>
          <CandidatForm form={form} setForm={setForm} onSave={saveContact} onCancel={closeModal} sectors={sectors} validationStatuses={validationStatuses} onStatusesChanged={loadAll} users={users} saving={saving} />
        </ModalWrapper>
      )}
      {modal === "mission" && (
        <ModalWrapper onClose={closeModal} title={form.id ? "Modifier le poste" : "Nouveau poste"}>
          <MissionForm form={form} setForm={setForm} onSave={saveMission} onCancel={closeModal} contacts={contacts} users={users} fiscalYears={fiscalYears} workModes={workModes} saving={saving} />
        </ModalWrapper>
      )}
      {modal === "candidature" && (
        <ModalWrapper onClose={closeModal} title={form.id ? "Modifier la candidature" : "Nouvelle candidature"}>
          <CandidatureForm form={form} setForm={setForm} onSave={saveCandidature} onCancel={closeModal} candidates={candidates} missions={missions} saving={saving} />
        </ModalWrapper>
      )}
      {modal === "activity" && (
        <ModalWrapper onClose={closeModal} title="Nouvelle activité">
          <ActivityForm form={form} setForm={setForm} onSave={saveActivity} onCancel={closeModal} contacts={contacts} missions={missions} saving={saving} />
        </ModalWrapper>
      )}
    </div>
  );
}
