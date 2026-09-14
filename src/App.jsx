import { useState, useEffect, useCallback, useRef } from "react";
import api from "./services/api";
import { GLOBAL_STYLES } from "./utils/styles";

// Components
import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/Sidebar";
import ModalWrapper from "./components/common/ModalWrapper";
import { ToastProvider, useToast } from "./components/common/Toast";
import { ConfirmProvider, useConfirm } from "./components/common/ConfirmDialog";
import useCrmData from "./hooks/useCrmData";

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

  // Données (états par entité + rechargement ciblé) — voir hooks/useCrmData.js
  const {
    contacts, missions, candidatures, activities, users, fiscalYears, sectors, workModes, validationStatuses,
    candidates, clients, loaded, reload, loadAll, setActivities,
  } = useCrmData();

  // UI state
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  // Instantané du formulaire à l'ouverture, pour détecter les modifications non enregistrées
  const initialFormRef = useRef("");
  const [detailId, setDetailId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [saving, setSaving] = useState(false);

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
    await reload("contacts", "candidatures", "activities", "sectors"); setModal(null);
    toast.success(form.id ? "Contact mis à jour" : "Contact créé");
  });

  const deleteContact = withSaving(async (id) => {
    await expectOk(api.del(`/api/contacts/${id}`));
    await reload("contacts", "candidatures", "activities"); setDetailId(null);
    toast.success("Contact supprimé");
  });

  const saveMission = withSaving(async () => {
    if (!form.title || !form.company) return;
    if (form.id) await expectOk(api.put(`/api/missions/${form.id}`, form));
    else await expectOk(api.post("/api/missions", form));
    await reload("missions", "candidatures", "workModes"); setModal(null);
    toast.success(form.id ? "Poste mis à jour" : "Poste créé");
  });

  const deleteMission = withSaving(async (id) => {
    await expectOk(api.del(`/api/missions/${id}`));
    await reload("missions", "candidatures", "activities");
    toast.success("Poste supprimé");
  });

  const saveCandidature = withSaving(async () => {
    if (!form.candidateId || !form.missionId) return;
    if (form.id) await expectOk(api.put(`/api/candidatures/${form.id}`, form));
    else await expectOk(api.post("/api/candidatures", form));
    await reload("candidatures", "missions"); setModal(null);
    toast.success(form.id ? "Candidature mise à jour" : "Candidature créée");
  });

  const deleteCandidature = withSaving(async (id) => {
    await expectOk(api.del(`/api/candidatures/${id}`));
    await reload("candidatures", "missions");
    toast.success("Candidature supprimée");
  });

  const saveActivity = withSaving(async () => {
    if (!form.type || !form.subject) return;
    if (form.id) {
      await expectOk(api.put(`/api/activities/${form.id}`, form));
    } else {
      await expectOk(api.post("/api/activities", { ...form, userId: currentUser?.id }));
    }
    await reload("activities"); setModal(null);
    toast.success(form.id ? "Activité mise à jour" : "Activité créée");
  });

  const toggleActivity = async (act) => {
    // Mise à jour optimiste : la ligne bascule immédiatement, rollback si échec
    setActivities(prev => prev.map(a => a.id === act.id ? { ...a, completed: !act.completed } : a));
    try {
      await expectOk(api.put(`/api/activities/${act.id}`, { completed: !act.completed }));
      await reload("activities");
    } catch (e) {
      setActivities(prev => prev.map(a => a.id === act.id ? { ...a, completed: act.completed } : a));
      toast.error(e.message || "Une erreur est survenue");
    }
  };

  const deleteActivity = withSaving(async (id) => {
    await expectOk(api.del(`/api/activities/${id}`));
    await reload("activities");
    toast.success("Activité supprimée");
  });

  // ─── Navigation inter-entités ──────────────────────────────────────────────
  // Ouvre directement la fiche détail d'une entité depuis n'importe quelle page.
  const openCandidature = (prefill = {}) => openModal("candidature", { stage: "Présélectionné", rating: 0, ...prefill });

  const goToContact = (id) => {
    const c = contacts.find(x => x.id === id);
    if (!c) return;
    setSearch(""); setFilterStatus("Tous");
    setActiveTab(c.status === "Candidat" ? "candidats" : "clients");
    setDetailId(id);
  };

  const goToMission = (id) => {
    if (!missions.some(m => m.id === id)) return;
    setSearch(""); setFilterStatus("Tous");
    setActiveTab("missions");
    setDetailId(id);
  };

  // ─── Ajout rapide (barre latérale + raccourci « n ») ───────────────────────
  const quickAdd = (type) => {
    if (type === "client") openModal("client", { status: "Prospect", sector: "Tech", revenue: 0 });
    else if (type === "mission") openModal("mission", { status: "Ouverte", priority: "Normale", contractType: "CDI" });
    else if (type === "activity") openModal("activity", { type: "Appel" });
    else if (type === "candidature") openCandidature();
    else openModal("candidat", { status: "Candidat", sector: "Tech", salaryExpectation: 0 });
  };
  // Type d'élément « naturel » selon l'onglet courant
  const contextQuickAddType = () => ({ clients: "client", missions: "mission", activites: "activity", pipeline: "candidature" }[activeTab] || "candidat");

  // ─── Raccourcis clavier ────────────────────────────────────────────────────
  //   /        focus sur la recherche globale
  //   n        nouvel élément (selon l'onglet courant)
  //   g puis d/c/k/p/l/a   Dashboard / Clients / Candidats(K) / Postes / piLine / Activités
  useEffect(() => {
    if (!authed || currentUser?.role === "partner") return;
    let pendingG = 0;
    const isTyping = (e) => {
      const t = e.target;
      return t?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t?.tagName);
    };
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e) || modal) return;
      if (e.key === "/") { e.preventDefault(); document.getElementById("global-search")?.focus(); return; }
      if (e.key === "n") { e.preventDefault(); quickAdd(contextQuickAddType()); return; }
      if (e.key === "g") { pendingG = Date.now(); return; }
      if (pendingG && Date.now() - pendingG < 1500) {
        const tab = { d: "dashboard", c: "clients", k: "candidats", p: "missions", l: "pipeline", a: "activites" }[e.key];
        if (tab) { e.preventDefault(); setActiveTab(tab); setDetailId(null); }
        pendingG = 0;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [authed, currentUser, modal, activeTab]);

  // Les styles globaux (tokens de thème, police) doivent aussi être présents sur l'écran de connexion
  if (!authed) return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <LoginScreen form={loginForm} setForm={setLoginForm} showPwd={showPwd} setShowPwd={setShowPwd} error={loginError} onLogin={handleLogin} />
    </>
  );

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
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Sora', sans-serif", background: "var(--app-bg)", overflow: "hidden" }}>
      <style>{GLOBAL_STYLES}</style>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} setDetailId={setDetailId} setSearch={setSearch} setFilterStatus={setFilterStatus} contacts={contacts} missions={missions} activities={activities} onQuickAdd={quickAdd} />

      {/* Main Content */}
      <main className="app-main" style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {activeTab === "dashboard" && <DashboardPage activities={activities} contacts={contacts} missions={missions} candidatures={candidatures} fiscalYears={fiscalYears} loaded={loaded} onNavigate={setActiveTab} goToContact={goToContact} goToMission={goToMission} onPlanFollowUp={(r) => openModal("activity", { type: "Appel", contactId: r.contactId || null, missionId: r.missionId || null, subject: r.name ? `Relancer ${r.name}` : "Relance", completed: false })} currentUser={currentUser} isAdmin={isAdmin} />}
        {activeTab === "clients" && <ClientsPage contacts={clients} missions={missions} candidatures={candidatures} users={users} search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} onAdd={() => openModal("client", { status: "Prospect", sector: "Tech", revenue: 0 })} onEdit={c => openModal("client", { ...c })} onDelete={deleteContact} onDetail={id => setDetailId(id)} detailId={detailId} setDetailId={setDetailId} />}
        {activeTab === "candidats" && <CandidatsPage contacts={candidates} search={search} setSearch={setSearch} onAdd={() => openModal("candidat", { status: "Candidat", sector: "Tech", salaryExpectation: 0 })} onEdit={c => openModal("candidat", { ...c })} onDelete={deleteContact} onDetail={id => setDetailId(id)} detailId={detailId} setDetailId={setDetailId} onAddCandidature={(candidateId, missionId) => { setDetailId(null); openCandidature(missionId ? { candidateId, missionId } : { candidateId }); }} goToMission={goToMission} candidatures={candidatures} missions={missions} loadAll={loadAll} validationStatuses={validationStatuses} users={users} />}
        {activeTab === "missions" && <MissionsPage missions={missions} contacts={contacts} users={users} candidatures={candidatures} detailId={detailId} setDetailId={setDetailId} onAdd={() => openModal("mission", { status: "Ouverte", priority: "Normale", contractType: "CDI" })} onEdit={m => openModal("mission", { ...m })} onDelete={deleteMission} onAddCandidature={(missionId, candidateId) => openCandidature(candidateId ? { missionId, candidateId } : { missionId })} goToContact={goToContact} />}
        {activeTab === "pipeline" && <PipelinePage candidatures={candidatures} candidates={candidates} missions={missions} users={users} onEdit={cd => openModal("candidature", { ...cd })} onAdd={() => openModal("candidature", { stage: "Présélectionné", rating: 0 })} onDelete={deleteCandidature} loadAll={() => reload("candidatures", "missions")} />}
        {activeTab === "activites" && <ActivitesPage activities={activities} contacts={contacts} missions={missions} users={users} currentUser={currentUser} onAdd={() => openModal("activity", { type: "Appel" })} onEdit={a => openModal("activity", { ...a })} onToggle={toggleActivity} onDelete={deleteActivity} goToContact={goToContact} />}
        {activeTab === "evaluation" && <EvaluationPage candidates={candidates} missions={missions} loadAll={loadAll} />}
        {activeTab === "placements" && <PlacementsPage candidatures={candidatures} candidates={candidates} missions={missions} goToContact={goToContact} goToMission={goToMission} canEdit={isAdmin} />}
        {activeTab === "revenue" && <RevenuePage contacts={contacts} missions={missions} candidatures={candidatures} users={users} fiscalYears={fiscalYears} loadAll={loadAll} />}
        {activeTab === "objectifs" && <ObjectifsPage contacts={contacts} missions={missions} candidatures={candidatures} users={users} fiscalYears={fiscalYears} loadAll={loadAll} />}
        {activeTab === "partenaires" && <PartenairesPage missions={missions} currentUser={currentUser} />}
        {activeTab === "profil" && <ProfilePage currentUser={currentUser} contacts={contacts} missions={missions} candidatures={candidatures} users={users} setActiveTab={setActiveTab} goToContact={goToContact} goToMission={goToMission} />}
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
        <ModalWrapper onClose={closeModal} title={form.id ? "Modifier l'activité" : "Nouvelle activité"}>
          <ActivityForm form={form} setForm={setForm} onSave={saveActivity} onCancel={closeModal} contacts={contacts} missions={missions} saving={saving} />
        </ModalWrapper>
      )}
    </div>
  );
}
