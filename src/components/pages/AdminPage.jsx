import { useState, useEffect } from "react";
import api from "../../services/api";

export default function AdminPage({ currentUser, loadAll }) {
  const [tab, setTab] = useState("users"); // "users" | "partners"
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("user"); // "user" | "partner"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = currentUser?.userRole === "admin";

  const load = async () => {
    const [u, p] = await Promise.all([
      api.get("/api/users"),
      api.get("/api/partners"),
    ]);
    setUsers(u);
    setPartners(p);
  };

  useEffect(() => { load(); }, []);

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Acc\u00e8s restreint</h2>
        <p style={{ color: "#64748b" }}>Seul l'administrateur peut acc\u00e9der \u00e0 cette page.</p>
      </div>
    );
  }

  const resetForm = (type) => {
    setFormType(type);
    setEditingId(null);
    setForm(type === "user" ? { fullName: "", login: "", password: "" } : { name: "", email: "", password: "", company: "", phone: "" });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const startEditUser = (u) => {
    setFormType("user");
    setEditingId(u.id);
    setForm({ fullName: u.fullName || "", login: u.login || "", password: "" });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const validatePassword = (pwd) => {
    if (!pwd || pwd.length < 12) return "Mot de passe min. 12 caractères";
    if (!/[A-Z]/.test(pwd)) return "Le mot de passe doit contenir au moins une majuscule";
    if (!/[a-z]/.test(pwd)) return "Le mot de passe doit contenir au moins une minuscule";
    if (!/[0-9]/.test(pwd)) return "Le mot de passe doit contenir au moins un chiffre";
    return null;
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    try {
      if (formType === "user") {
        if (!form.fullName?.trim()) return setError("Nom complet requis");
        if (!form.login?.trim()) return setError("Email requis");
        // Password obligatoire en création, optionnel en édition
        if (!editingId || form.password) {
          const pwdErr = validatePassword(form.password);
          if (pwdErr) return setError(pwdErr);
        }

        const payload = { ...form };
        if (editingId && !payload.password) delete payload.password;

        const res = editingId
          ? await api.put(`/api/users/${editingId}`, payload)
          : await api.post("/api/users", payload);

        if (res.ok) {
          setSuccess(editingId
            ? `Utilisateur "${form.fullName}" modifié avec succès`
            : `Utilisateur "${form.fullName}" créé avec succès`);
          setForm({ fullName: "", login: "", password: "" });
          setEditingId(null);
          setShowForm(false);
          await load();
          if (loadAll) await loadAll();
        } else {
          const d = await res.json().catch(() => ({ error: "Erreur serveur" }));
          setError(d.error || "Erreur lors de l'enregistrement");
        }
      } else {
        if (!form.name?.trim()) return setError("Nom requis");
        if (!form.email?.trim()) return setError("Email requis");
        const pwdErr = validatePassword(form.password);
        if (pwdErr) return setError(pwdErr);

        const res = await api.post("/api/partners", form);
        if (res.ok) {
          setSuccess(`Partenaire "${form.name}" créé avec succès`);
          setForm({ name: "", email: "", password: "", company: "", phone: "" });
          await load();
        } else {
          const d = await res.json();
          setError(d.error || "Erreur lors de la création");
        }
      }
    } catch (err) {
      setError("Erreur réseau ou serveur. Veuillez réessayer.");
    }
  };

  const handleDeletePartner = async (partner) => {
    if (!window.confirm(`Supprimer le recruteur externe "${partner.name}" ?`)) return;
    const res = await api.del(`/api/partners/${partner.id}`);
    if (res.ok) {
      await load();
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const tabStyle = (t) => ({
    padding: "8px 20px",
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    cursor: "pointer",
    background: tab === t ? "#1d4ed8" : "transparent",
    color: tab === t ? "white" : "#64748b",
    border: "none",
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Administration</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>Gestion des comptes utilisateurs et partenaires</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => resetForm("user")}>+ Interne</button>
          <button className="btn btn-primary" style={{ background: "#7c3aed" }} onClick={() => resetForm("partner")}>+ Recruteur externe</button>
        </div>
      </div>

      {/* Creation form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              {formType === "user"
                ? (editingId ? "Modifier l'employ\u00e9" : "Nouvel employ\u00e9")
                : "Nouveau recruteur externe"}
            </h3>
            <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 14 }} onClick={() => setShowForm(false)}>X</button>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {formType === "user" ? (
              <>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Nom complet *</label>
                  <input className="input" value={form.fullName || ""} onChange={e => f("fullName", e.target.value)} placeholder="Prénom Nom" />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Email (identifiant) *</label>
                  <input className="input" type="email" value={form.login || ""} onChange={e => f("login", e.target.value)} placeholder="prenom@valo-inno.com" />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>
                    {editingId ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}
                  </label>
                  <input className="input" type="password" value={form.password || ""} onChange={e => f("password", e.target.value)} placeholder="Min. 12 car. (maj+min+chiffre)" onKeyDown={e => e.key === "Enter" && handleSave()} />
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Nom complet *</label>
                  <input className="input" value={form.name || ""} onChange={e => f("name", e.target.value)} placeholder="Prénom Nom" />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Email *</label>
                  <input className="input" type="email" value={form.email || ""} onChange={e => f("email", e.target.value)} placeholder="email@example.com" />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Mot de passe *</label>
                  <input className="input" type="password" value={form.password || ""} onChange={e => f("password", e.target.value)} placeholder="Min. 12 car. (maj+min+chiffre)" onKeyDown={e => e.key === "Enter" && handleSave()} />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Entreprise</label>
                  <input className="input" value={form.company || ""} onChange={e => f("company", e.target.value)} placeholder="Nom de l'entreprise" />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>T\u00e9l\u00e9phone</label>
                  <input className="input" value={form.phone || ""} onChange={e => f("phone", e.target.value)} placeholder="(514) 555-0000" />
                </div>
              </>
            )}
          </div>

          {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "#dc2626", fontWeight: 500 }}>{error}</div>}
          {success && <div style={{ marginTop: 10, fontSize: 12.5, color: "#059669", fontWeight: 500 }}>{success}</div>}

          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={handleSave}>
              {formType === "user"
                ? (editingId ? "Enregistrer les modifications" : "Cr\u00e9er l'employ\u00e9")
                : "Cr\u00e9er le recruteur externe"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" }}>
        <button style={tabStyle("users")} onClick={() => setTab("users")}>Employés Internes ({users.length})</button>
        <button style={tabStyle("partners")} onClick={() => setTab("partners")}>Recruteurs externes ({partners.length})</button>
      </div>

      {/* Users list */}
      {tab === "users" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Email</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
            </tr></thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={3} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucun utilisateur</td></tr>}
              {users.map(u => (
                <tr key={u.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{u.fullName?.[0] || "?"}</div>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{u.fullName}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: "#64748b" }}>{u.login}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() => startEditUser(u)}
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Partners list */}
      {tab === "partners" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Entreprise</th>
              <th style={thStyle}>Téléphone</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
            </tr></thead>
            <tbody>
              {partners.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucun partenaire</td></tr>}
              {partners.map(p => (
                <tr key={p.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>{p.name?.[0] || "?"}</div>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: "#64748b" }}>{p.email}</td>
                  <td style={{ ...tdStyle, color: "#374151" }}>{p.company || "—"}</td>
                  <td style={{ ...tdStyle, color: "#374151" }}>{p.phone || "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button
                      className="btn btn-ghost"
                      style={{ color: "#dc2626", fontSize: 12, padding: "4px 10px" }}
                      onClick={() => handleDeletePartner(p)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" };
const tdStyle = { padding: "14px 20px", fontSize: 13.5 };
