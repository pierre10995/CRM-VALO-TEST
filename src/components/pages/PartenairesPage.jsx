import { useState, useEffect } from "react";
import api from "../../services/api";

export default function PartenairesPage({ missions, currentUser }) {
  const [partners, setPartners] = useState([]);
  const [modal, setModal] = useState(null); // null | "create" | "edit" | "missions"
  const [form, setForm] = useState({});
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [affiliatedMissions, setAffiliatedMissions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("notifications"); // "notifications" | "preselected" | "archived" | "partners"
  const [previewUrl, setPreviewUrl] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // { candidatureId, candidateName }
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [reviews, setReviews] = useState({}); // { candidatureId: [reviews] }
  const [reviewLoading, setReviewLoading] = useState(false);
  const [filterMission, setFilterMission] = useState("all");

  const loadPartners = async () => {
    try {
      const data = await api.get("/api/partners");
      setPartners(Array.isArray(data) ? data : []);
    } catch { setPartners([]); }
  };

  const loadSubmissions = async () => {
    try {
      const data = await api.get("/api/partners/submissions");
      setSubmissions(Array.isArray(data) ? data : []);
    } catch { setSubmissions([]); }
  };

  useEffect(() => { loadPartners(); loadSubmissions(); }, []);

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.email) return setError("Nom et email requis");
    if (modal === "create" || form.password) {
      if (!form.password || form.password.length < 12) return setError("Mot de passe min. 12 caractères");
      if (!/[A-Z]/.test(form.password)) return setError("Le mot de passe doit contenir au moins une majuscule");
      if (!/[a-z]/.test(form.password)) return setError("Le mot de passe doit contenir au moins une minuscule");
      if (!/[0-9]/.test(form.password)) return setError("Le mot de passe doit contenir au moins un chiffre");
    }
    try {
      let res;
      if (modal === "create") {
        res = await api.post("/api/partners", form);
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        res = await api.put(`/api/partners/${form.id}`, payload);
      }
      if (res.ok) { await loadPartners(); setModal(null); }
      else { const d = await res.json().catch(() => ({ error: "Erreur serveur" })); setError(d.error || "Erreur lors de l'enregistrement"); }
    } catch (e) { setError(e.message || "Erreur réseau"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce partenaire ?")) return;
    await api.del(`/api/partners/${id}`);
    await loadPartners();
  };

  const openMissions = async (partner) => {
    setSelectedPartner(partner);
    const data = await api.get(`/api/partners/${partner.id}/missions`);
    setAffiliatedMissions(data);
    setModal("missions");
  };

  const addMission = async (missionId) => {
    await api.post(`/api/partners/${selectedPartner.id}/missions`, { missionId });
    const data = await api.get(`/api/partners/${selectedPartner.id}/missions`);
    setAffiliatedMissions(data);
    await loadPartners();
  };

  const removeMission = async (missionId) => {
    await api.del(`/api/partners/${selectedPartner.id}/missions/${missionId}`);
    const data = await api.get(`/api/partners/${selectedPartner.id}/missions`);
    setAffiliatedMissions(data);
    await loadPartners();
  };

  const filtered = partners.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()) || p.company.toLowerCase().includes(search.toLowerCase())
  );

  const availableMissions = missions.filter(m =>
    !affiliatedMissions.some(am => am.id === m.id)
  );

  const handleDownloadCv = async (fileId, candidateName) => {
    try {
      const blob = await api.getBlob(`/api/files/${fileId}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV-${candidateName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const handlePreviewCv = async (fileId) => {
    try {
      const blob = await api.getBlob(`/api/files/${fileId}`);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch { /* ignore */ }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const openReviewModal = async (candidatureId, candidateName) => {
    setReviewModal({ candidatureId, candidateName });
    setReviewForm({ rating: 0, comment: "" });
    // Load existing reviews
    const data = await api.get(`/api/partners/submissions/${candidatureId}/reviews`);
    setReviews(prev => ({ ...prev, [candidatureId]: data }));
    // Pre-fill if current user already reviewed
    const mine = data.find(r => r.userId === currentUser?.id);
    if (mine) setReviewForm({ rating: mine.rating, comment: mine.comment });
  };

  const submitReview = async () => {
    if (!reviewForm.rating) return;
    setReviewLoading(true);
    const res = await api.post(`/api/partners/submissions/${reviewModal.candidatureId}/reviews`, reviewForm);
    if (res.ok) {
      const data = await api.get(`/api/partners/submissions/${reviewModal.candidatureId}/reviews`);
      setReviews(prev => ({ ...prev, [reviewModal.candidatureId]: data }));
      await loadSubmissions();
      setReviewModal(null);
    }
    setReviewLoading(false);
  };

  const updateStage = async (candidatureId, stage) => {
    const res = await api.put(`/api/candidatures/${candidatureId}`, { stage, rating: 0, notes: "", interviewDate: null });
    if (res.ok) await loadSubmissions();
  };

  // Split submissions by status
  const archivedSubmissions = submissions.filter(s => s.stage === "Archivé");
  const preselectedSubmissions = submissions.filter(s => s.stage === "Proposition partenaire" || s.stage === "Présélectionné");
  const activeSubmissions = submissions.filter(s => s.stage !== "Archivé" && s.stage !== "Proposition partenaire" && s.stage !== "Présélectionné");

  // Missions that have submissions (for the filter dropdown)
  const currentList = tab === "archived" ? archivedSubmissions : tab === "preselected" ? preselectedSubmissions : activeSubmissions;
  const submissionMissions = [...new Map(currentList.map(s => [s.missionId, { id: s.missionId, label: `${s.missionTitle} — ${s.missionCompany}` }])).values()];
  const filteredSubmissions = filterMission === "all" ? currentList : currentList.filter(s => String(s.missionId) === filterMission);

  const newSubmissionsCount = activeSubmissions.length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>Partenaires externes</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Gérez les recruteurs partenaires et consultez les candidats proposés.</p>
        </div>
        {tab === "partners" && (
          <button onClick={() => { setModal("create"); setForm({ name: "", email: "", password: "", company: "", phone: "" }); setError(""); }}
            className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 13.5 }}>
            Nouveau partenaire
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", borderRadius: 12, padding: 4, width: "fit-content" }}>
        <button
          onClick={() => { setTab("notifications"); setFilterMission("all"); }}
          style={{
            padding: "8px 18px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: tab === "notifications" ? "white" : "transparent",
            color: tab === "notifications" ? "#0f172a" : "#64748b",
            boxShadow: tab === "notifications" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            position: "relative",
          }}
        >
          Candidats proposés
          {newSubmissionsCount > 0 && (
            <span style={{ position: "absolute", top: -4, right: -4, background: "#dc2626", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
              {newSubmissionsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setTab("preselected"); setFilterMission("all"); }}
          style={{
            padding: "8px 18px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: tab === "preselected" ? "white" : "transparent",
            color: tab === "preselected" ? "#0f172a" : "#64748b",
            boxShadow: tab === "preselected" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          Candidats pré-sélectionnés ({preselectedSubmissions.length})
        </button>
        <button
          onClick={() => { setTab("archived"); setFilterMission("all"); }}
          style={{
            padding: "8px 18px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: tab === "archived" ? "white" : "transparent",
            color: tab === "archived" ? "#0f172a" : "#64748b",
            boxShadow: tab === "archived" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          Candidats archivés ({archivedSubmissions.length})
        </button>
        <button
          onClick={() => setTab("partners")}
          style={{
            padding: "8px 18px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: tab === "partners" ? "white" : "transparent",
            color: tab === "partners" ? "#0f172a" : "#64748b",
            boxShadow: tab === "partners" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          Gestion partenaires ({partners.length})
        </button>
      </div>

      {/* ─── Notifications / Preselected / Archived tab ─── */}
      {(tab === "notifications" || tab === "preselected" || tab === "archived") && (
        <div>
          {/* Mission filter */}
          {currentList.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <select
                value={filterMission}
                onChange={e => setFilterMission(e.target.value)}
                className="input"
                style={{ maxWidth: 400, padding: "8px 12px", fontSize: 13 }}
              >
                <option value="all">Tous les postes ({currentList.length})</option>
                {submissionMissions.map(m => (
                  <option key={m.id} value={String(m.id)}>
                    {m.label} ({currentList.filter(s => s.missionId === m.id).length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentList.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#475569" }}>{tab === "archived" ? "Aucun candidat archivé" : tab === "preselected" ? "Aucun candidat pré-sélectionné" : "Aucune soumission de partenaire"}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>{tab === "archived" ? "Les candidats archivés apparaitront ici." : tab === "preselected" ? "Les candidats pré-sélectionnés apparaitront ici." : "Les candidats proposés par vos partenaires apparaitront ici."}</div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 14, color: "#94a3b8" }}>Aucun candidat pour ce poste.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredSubmissions.map(s => (
                <div key={s.id} className="card" style={{ padding: "18px 20px", borderLeft: `4px solid ${borderColor(s.stage)}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#059669" }}>
                        {s.candidateName?.[0] || "?"}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{s.candidateName}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Proposé par <span style={{ fontWeight: 600, color: "#059669" }}>{s.partnerName}</span>
                          {s.partnerCompany ? ` (${s.partnerCompany})` : ""}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                        ...stageStyle(s.stage),
                      }}>
                        {s.stage}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(s.createdAt).toLocaleDateString("fr-CA")} à {new Date(s.createdAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 10, padding: "10px 12px", background: "#f8fafc", borderRadius: 10 }}>
                    {s.candidateEmail && <InfoField label="Email" value={s.candidateEmail} />}
                    {s.candidatePhone && <InfoField label="Téléphone" value={s.candidatePhone} />}
                    {s.candidateCity && <InfoField label="Ville" value={s.candidateCity} />}
                    {s.candidateSkills && <InfoField label="Compétences" value={s.candidateSkills} />}
                    <InfoField label="Mission" value={`${s.missionTitle} — ${s.missionCompany}`} />
                  </div>

                  {/* Notes / summary */}
                  {s.notes && (
                    <div style={{ padding: "10px 12px", background: "#fffbeb", borderRadius: 10, marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#92400e", textTransform: "uppercase", marginBottom: 3 }}>Résumé du partenaire</div>
                      <div style={{ fontSize: 13, color: "#451a03", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{s.notes}</div>
                    </div>
                  )}

                  {/* Actions row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {s.cvFileId && (
                      <>
                        <button
                          onClick={() => handlePreviewCv(s.cvFileId)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10,
                            fontSize: 12.5, fontWeight: 600, color: "#0369a1", cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          Voir le CV
                        </button>
                        <button
                          onClick={() => handleDownloadCv(s.cvFileId, s.candidateName)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", background: "#dbeafe", border: "none", borderRadius: 10,
                            fontSize: 12.5, fontWeight: 600, color: "#1d4ed8", cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Télécharger
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openReviewModal(s.id, s.candidateName)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10,
                        fontSize: 12.5, fontWeight: 600, color: "#a16207", cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      <StarIcon size={14} />
                      {s.reviewCount > 0 ? `${s.avgRating}/5 (${s.reviewCount} avis)` : "Noter le profil"}
                    </button>

                    {/* Stage action buttons */}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      {s.stage === "En attente" && (
                        <button
                          onClick={() => { if (window.confirm("Accepter cette proposition ?")) updateStage(s.id, "Proposition partenaire"); }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "7px 14px", background: "#d1fae5", border: "none", borderRadius: 10,
                            fontSize: 12.5, fontWeight: 600, color: "#059669", cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Accepter
                        </button>
                      )}
                      {s.stage !== "Archivé" && (
                        <button
                          onClick={() => { if (window.confirm("Archiver cette soumission ?")) updateStage(s.id, "Archivé"); }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "7px 14px", background: "#f1f5f9", border: "none", borderRadius: 10,
                            fontSize: 12.5, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>
                          Archiver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Partners management tab ─── */}
      {tab === "partners" && (<>
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher un partenaire..."
        className="input"
        style={{ marginBottom: 16, maxWidth: 320 }}
      />

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={th}>Nom</th>
              <th style={th}>Email</th>
              <th style={th}>Entreprise</th>
              <th style={th}>Téléphone</th>
              <th style={th}>Missions</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={td}><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                <td style={td}>{p.email}</td>
                <td style={td}>{p.company || "—"}</td>
                <td style={td}>{p.phone || "—"}</td>
                <td style={td}>
                  <button onClick={() => openMissions(p)} style={{ background: "#ecfdf5", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#059669", cursor: "pointer" }}>
                    {p.missionCount} mission{p.missionCount !== 1 ? "s" : ""}
                  </button>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setModal("edit"); setForm({ ...p, password: "" }); setError(""); }} style={actionBtn}>Modifier</button>
                    <button onClick={() => handleDelete(p.id)} style={{ ...actionBtn, color: "#dc2626" }}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>Aucun partenaire trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <div style={overlay}>
          <div style={modalBox}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px" }}>
              {modal === "create" ? "Nouveau partenaire" : "Modifier le partenaire"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FormField label="Nom *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <FormField label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
              <FormField label={modal === "create" ? "Mot de passe * (min. 12 car., 1 majuscule, 1 minuscule, 1 chiffre)" : "Nouveau mot de passe (laisser vide pour ne pas changer)"} value={form.password || ""} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" />
              <FormField label="Entreprise" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} />
              <FormField label="Téléphone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              {error && <div style={{ padding: "8px 12px", background: "#fee2e2", borderRadius: 10, fontSize: 12, color: "#dc2626" }}>{error}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setModal(null)} className="btn btn-ghost" style={{ flex: 1 }}>Annuler</button>
                <button onClick={handleSave} className="btn btn-primary" style={{ flex: 2 }}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mission affiliations modal */}
      {modal === "missions" && selectedPartner && (
        <div style={overlay}>
          <div style={{ ...modalBox, maxWidth: 600 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Missions de {selectedPartner.name}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>x</button>
            </div>

            {/* Affiliated */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", textTransform: "uppercase", marginBottom: 8 }}>Missions affiliées</div>
            {affiliatedMissions.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune mission affiliée</div>
            ) : (
              <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
                {affiliatedMissions.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f0fdf4", borderRadius: 10 }}>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{m.title}</span>
                      <span style={{ color: "#64748b" }}> — {m.company}</span>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: m.status === "Ouverte" ? "#d1fae5" : "#f1f5f9", color: m.status === "Ouverte" ? "#059669" : "#64748b" }}>{m.status}</span>
                    <button onClick={() => { if (window.confirm("Retirer cette mission du partenaire ?")) removeMission(m.id); }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Retirer</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add missions */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", marginBottom: 8 }}>Ajouter une mission</div>
            {availableMissions.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Toutes les missions sont déjà affiliées</div>
            ) : (
              <div style={{ maxHeight: 240, overflow: "auto", display: "grid", gap: 4 }}>
                {availableMissions.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 10 }}>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{m.title}</span>
                      <span style={{ color: "#64748b" }}> — {m.company}</span>
                    </div>
                    <button onClick={() => addMission(m.id)} style={{ background: "#dbeafe", border: "none", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer" }}>
                      Affilier
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </>)}

      {/* CV Preview Modal */}
      {previewUrl && (
        <div style={overlay} onClick={closePreview}>
          <div style={{ background: "white", borderRadius: 18, width: "90%", maxWidth: 900, height: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Aperçu du CV</span>
              <button onClick={closePreview} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>x</button>
            </div>
            <iframe src={previewUrl} style={{ flex: 1, border: "none", width: "100%" }} title="CV Preview" />
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div style={overlay}>
          <div style={{ ...modalBox, maxWidth: 500 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Évaluer {reviewModal.candidateName}</h3>
              <button onClick={() => setReviewModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>x</button>
            </div>

            {/* Star rating */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Votre note</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: 28, lineHeight: 1, color: n <= reviewForm.rating ? "#f59e0b" : "#d1d5db", transition: "color 0.1s" }}
                  >
                    <StarIcon size={28} filled={n <= reviewForm.rating} />
                  </button>
                ))}
                {reviewForm.rating > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", alignSelf: "center", marginLeft: 4 }}>{reviewForm.rating}/5</span>}
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Commentaire</label>
              <textarea
                value={reviewForm.comment}
                onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Votre avis sur ce profil..."
                rows={3}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button onClick={() => setReviewModal(null)} className="btn btn-ghost" style={{ flex: 1 }}>Annuler</button>
              <button onClick={submitReview} disabled={!reviewForm.rating || reviewLoading} className="btn btn-primary" style={{ flex: 2, opacity: !reviewForm.rating || reviewLoading ? 0.5 : 1 }}>
                {reviewLoading ? "Envoi..." : "Enregistrer"}
              </button>
            </div>

            {/* Existing reviews */}
            {reviews[reviewModal.candidatureId]?.length > 0 && (
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Avis de l'équipe</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {reviews[reviewModal.candidatureId].map(r => (
                    <div key={r.id} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{r.userName}</span>
                        <span style={{ display: "flex", gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <StarIcon key={n} size={13} filled={n <= r.rating} />
                          ))}
                        </span>
                      </div>
                      {r.comment && <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.4 }}>{r.comment}</div>}
                      <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 4 }}>{new Date(r.updatedAt || r.createdAt).toLocaleDateString("fr-CA")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StarIcon({ size = 16, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke={filled ? "#f59e0b" : "#d1d5db"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 13, color: "#0f172a", marginTop: 1 }}>{value}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input" style={{ width: "100%" }} />
    </div>
  );
}

const th = { textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" };
const td = { padding: "10px 14px" };
const actionBtn = { background: "none", border: "none", fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer" };
const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalBox = { background: "white", borderRadius: 18, padding: 28, width: "100%", maxWidth: 460, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" };

function stageStyle(stage) {
  switch (stage) {
    case "En attente": return { background: "#fef3c7", color: "#d97706" };
    case "Proposition partenaire": return { background: "#d1fae5", color: "#059669" };
    case "Soumis": return { background: "#fef3c7", color: "#d97706" };
    case "Présélectionné": return { background: "#dbeafe", color: "#2563eb" };
    case "Archivé": return { background: "#f1f5f9", color: "#64748b" };
    case "Placé": return { background: "#dbeafe", color: "#2563eb" };
    default: return { background: "#e0e7ff", color: "#4f46e5" };
  }
}

function borderColor(stage) {
  switch (stage) {
    case "En attente": return "#f59e0b";
    case "Proposition partenaire": return "#10b981";
    case "Soumis": return "#f59e0b";
    case "Présélectionné": return "#3b82f6";
    case "Archivé": return "#94a3b8";
    default: return "#3b82f6";
  }
}
