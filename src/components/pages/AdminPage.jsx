import { useState, useEffect } from "react";
import api from "../../services/api";

const ADMIN_EMAIL = "pierre@valo-inno.com";

export default function AdminPage({ currentUser, loadAll }) {
  const [tab, setTab] = useState("users"); // "users" | "partners"
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("user"); // "user" | "partner"
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = currentUser?.login === ADMIN_EMAIL;

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
    setForm(type === "user" ? { fullName: "", login: "", password: "" } : { name: "", email: "", password: "", company: "", phone: "" });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (formType === "user") {
      if (!form.fullName?.trim()) return setError("Nom complet requis");
      if (!form.login?.trim()) return setError("Email requis");
      if (!form.password || form.password.length < 6) return setError("Mot de passe requis (min. 6 caract\u00e8res)");

      const res = await api.post("/api/users", form);
      if (res.ok) {
        setSuccess(`Utilisateur "${form.fullName}" cr\u00e9\u00e9 avec succ\u00e8s`);
        setForm({ fullName: "", login: "", password: "" });
        await load();
        if (loadAll) await loadAll();
      } else {
        const d = await res.json();
        setError(d.error || "Erreur lors de la cr\u00e9ation");
      }
    } else {
      if (!form.name?.trim()) return setError("Nom requis");
      if (!form.email?.trim()) return setError("Email requis");
      if (!form.password || form.password.length < 6) return setError("Mot de passe requis (min. 6 caract\u00e8res)");

      const res = await api.post("/api/partners", form);
      if (res.ok) {
        setSuccess(`Partenaire "${form.name}" cr\u00e9\u00e9 avec succ\u00e8s`);
        setForm({ name: "", email: "", password: "", company: "", phone: "" });
        await load();
      } else {
        const d = await res.json();
        setError(d.error || "Erreur lors de la cr\u00e9ation");
      }
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
              {formType === "user" ? "Nouvel employ\u00e9" : "Nouveau recruteur externe"}
            </h3>
            <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 14 }} onClick={() => setShowForm(false)}>X</button>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {formType === "user" ? (
              <>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Nom complet *</label>
                  <input className="input" value={form.fullName || ""} onChange={e => f("fullName", e.target.value)} placeholder="Pr\u00e9nom Nom" />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Email (identifiant) *</label>
                  <input className="input" type="email" value={form.login || ""} onChange={e => f("login", e.target.value)} placeholder="prenom@valo-inno.com" />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Mot de passe *</label>
                  <input className="input" type="password" value={form.password || ""} onChange={e => f("password", e.target.value)} placeholder="Min. 6 caract\u00e8res" onKeyDown={e => e.key === "Enter" && handleSave()} />
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Nom complet *</label>
                  <input className="input" value={form.name || ""} onChange={e => f("name", e.target.value)} placeholder="Pr\u00e9nom Nom" />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Email *</label>
                  <input className="input" type="email" value={form.email || ""} onChange={e => f("email", e.target.value)} placeholder="email@example.com" />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Mot de passe *</label>
                  <input className="input" type="password" value={form.password || ""} onChange={e => f("password", e.target.value)} placeholder="Min. 6 caract\u00e8res" onKeyDown={e => e.key === "Enter" && handleSave()} />
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
              {formType === "user" ? "Cr\u00e9er l'employ\u00e9" : "Cr\u00e9er le recruteur externe"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" }}>
        <button style={tabStyle("users")} onClick={() => setTab("users")}>Employ\u00e9s ({users.length})</button>
        <button style={tabStyle("partners")} onClick={() => setTab("partners")}>Recruteurs externes ({partners.length})</button>
      </div>

      {/* Users list */}
      {tab === "users" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Email</th>
            </tr></thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={2} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucun utilisateur</td></tr>}
              {users.map(u => (
                <tr key={u.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{u.fullName?.[0] || "?"}</div>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{u.fullName}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: "#64748b" }}>{u.login}</td>
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
              <th style={thStyle}>T\u00e9l\u00e9phone</th>
            </tr></thead>
            <tbody>
              {partners.length === 0 && <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucun partenaire</td></tr>}
              {partners.map(p => (
                <tr key={p.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>{p.name?.[0] || "?"}</div>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: "#64748b" }}>{p.email}</td>
                  <td style={{ ...tdStyle, color: "#374151" }}>{p.company || "\u2014"}</td>
                  <td style={{ ...tdStyle, color: "#374151" }}>{p.phone || "\u2014"}</td>
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
