import { useState, useEffect } from "react";
import api from "../../services/api";

export default function PartenairesPage({ missions }) {
  const [partners, setPartners] = useState([]);
  const [modal, setModal] = useState(null); // null | "create" | "edit" | "missions"
  const [form, setForm] = useState({});
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [affiliatedMissions, setAffiliatedMissions] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadPartners = async () => {
    const data = await api.get("/api/partners");
    setPartners(data);
  };

  useEffect(() => { loadPartners(); }, []);

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.email) return setError("Nom et email requis");
    if (modal === "create" && (!form.password || form.password.length < 6)) return setError("Mot de passe min. 6 caractères");
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
      else { const d = await res.json(); setError(d.error); }
    } catch { setError("Erreur réseau"); }
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>Partenaires externes</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Gérez les recruteurs partenaires et leurs missions affiliées.</p>
        </div>
        <button onClick={() => { setModal("create"); setForm({ name: "", email: "", password: "", company: "", phone: "" }); setError(""); }}
          className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 13.5 }}>
          Nouveau partenaire
        </button>
      </div>

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
              <FormField label={modal === "create" ? "Mot de passe *" : "Nouveau mot de passe (laisser vide pour ne pas changer)"} value={form.password || ""} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" />
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
                    <button onClick={() => removeMission(m.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Retirer</button>
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
