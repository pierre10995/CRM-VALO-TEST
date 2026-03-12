import { useState, useEffect } from "react";

// ─── API helpers ─────────────────────────────────────────────────────────────
const api = {
  get: async (url) => { const r = await fetch(url); return r.json(); },
  post: async (url, data) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return r; },
  put: async (url, data) => { const r = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return r; },
  del: async (url) => { const r = await fetch(url, { method: "DELETE" }); return r; },
};

const STATUS_CONFIG = {
  Candidat: { color: "#f59e0b", bg: "#fef3c7", label: "Candidat" },
  Prospect: { color: "#3b82f6", bg: "#dbeafe", label: "Prospect" },
  Client: { color: "#10b981", bg: "#d1fae5", label: "Client" },
};

const SECTORS = ["Tech", "Finance", "Santé", "Retail", "Industrie", "Services", "Médias", "Éducation", "Autre"];

// ─── Mini Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

// ─── Revenue Bar Chart ──────────────────────────────────────────────────────────
function RevenueChart({ contacts }) {
  const clients = contacts.filter(c => c.status === "Client" && c.revenue > 0);
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(); month.setMonth(month.getMonth() - (5 - i));
    return {
      label: month.toLocaleString("fr-CA", { month: "short" }),
      value: Math.round(clients.reduce((s, c) => s + c.revenue / 12, 0) * (0.8 + (i * 0.07)))
    };
  });
  const max = Math.max(...monthlyData.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "0 4px" }}>
      {monthlyData.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: "100%", background: "linear-gradient(180deg, #2563eb, #3b82f6)", height: `${(d.value / max) * 90}px`, borderRadius: "6px 6px 0 0", minHeight: 4, boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }} />
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────────
export default function CRM() {
  const [authed, setAuthed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [detailId, setDetailId] = useState(null);

  const loadContacts = async () => {
    const data = await api.get("/api/contacts");
    setContacts(data);
  };

  useEffect(() => {
    const session = localStorage.getItem("crm_user");
    if (session) {
      setCurrentUser(JSON.parse(session));
      setAuthed(true);
    }
  }, []);

  useEffect(() => { if (authed) loadContacts(); }, [authed]);

  const handleLogin = async () => {
    const res = await api.post("/api/login", { login, password });
    if (res.ok) {
      const user = await res.json();
      setCurrentUser(user);
      setAuthed(true);
      localStorage.setItem("crm_user", JSON.stringify(user));
      setLoginError("");
    } else {
      const err = await res.json();
      setLoginError(err.error);
    }
  };

  const handleLogout = () => { localStorage.removeItem("crm_user"); setAuthed(false); setCurrentUser(null); setLogin(""); setPassword(""); };

  const stats = {
    candidates: contacts.filter(c => c.status === "Candidat").length,
    prospects: contacts.filter(c => c.status === "Prospect").length,
    clients: contacts.filter(c => c.status === "Client").length,
    revenue: contacts.filter(c => c.status === "Client").reduce((s, c) => s + (c.revenue || 0), 0),
  };

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Tous" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openModal = (type, contact = null) => {
    setModal(type);
    setForm(contact ? { ...contact } : { name: "", company: "", email: "", phone: "", status: "Prospect", sector: "Tech", revenue: 0, notes: "" });
  };

  const saveContact = async () => {
    if (!form.name || !form.company) return;
    if (form.id) {
      await api.put(`/api/contacts/${form.id}`, form);
    } else {
      await api.post("/api/contacts", form);
    }
    await loadContacts();
    setModal(null);
  };

  const deleteContact = async (id) => { await api.del(`/api/contacts/${id}`); await loadContacts(); setDetailId(null); };
  const detailContact = contacts.find(c => c.id === detailId);

  if (!authed) return <LoginScreen login={login} setLogin={setLogin} password={password} setPassword={setPassword} showPwd={showPwd} setShowPwd={setShowPwd} error={loginError} onLogin={handleLogin} />;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Sora', sans-serif", background: "#f0f4ff", overflow: "hidden" }}>
      <style>{`
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
        .input { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; transition: border 0.2s; color: #1e293b; background: #fafbfd; }
        .input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; }
        .row-hover:hover { background: #f8fafc; cursor: pointer; }
        .modal-bg { position: fixed; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 220, background: "white", padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "1px 0 0 #e2e8f0", flexShrink: 0 }}>
        <div style={{ padding: "0 6px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>VALO Recrutement</div>
              <div style={{ fontSize: 10.5, color: "#94a3b8" }}>v2.0 · 2026</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "0 8px 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Navigation</div>
        {[
          { id: "dashboard", label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
          { id: "contacts", label: "Contacts", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
          { id: "pipeline", label: "Pipeline", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
          { id: "revenue", label: "Chiffre d'affaires", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
        ].map(item => (
          <div key={item.id} className={`nav-item ${activeTab === item.id ? "active" : ""}`} onClick={() => setActiveTab(item.id)}>
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
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 12.5, padding: "7px 12px" }} onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9"/></svg>
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {activeTab === "dashboard" && <Dashboard stats={stats} contacts={contacts} onAdd={() => { setActiveTab("contacts"); openModal("add"); }} />}
        {activeTab === "contacts" && <Contacts contacts={filtered} search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} onAdd={() => openModal("add")} onEdit={c => openModal("edit", c)} onDelete={deleteContact} onDetail={id => setDetailId(id)} />}
        {activeTab === "pipeline" && <Pipeline contacts={contacts} onEdit={c => openModal("edit", c)} />}
        {activeTab === "revenue" && <Revenue contacts={contacts} />}
      </main>

      {modal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="card" style={{ width: 480, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{modal === "add" ? "Nouveau contact" : "Modifier le contact"}</h2>
              <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={() => setModal(null)}>✕</button>
            </div>
            <FormContact form={form} setForm={setForm} onSave={saveContact} onCancel={() => setModal(null)} />
          </div>
        </div>
      )}

      {detailContact && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setDetailId(null)}>
          <ContactDetail contact={detailContact} onClose={() => setDetailId(null)} onEdit={() => { openModal("edit", detailContact); setDetailId(null); }} onDelete={() => deleteContact(detailContact.id)} />
        </div>
      )}
    </div>
  );
}

// ─── Login ──────────────────────────────────────────────────────────────────────
function LoginScreen({ login, setLogin, password, setPassword, showPwd, setShowPwd, error, onLogin }) {
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
            <input className="input-l" value={login} onChange={e => setLogin(e.target.value)} placeholder="admin" onKeyDown={e => e.key === "Enter" && document.getElementById("pwd-field").focus()} />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input id="pwd-field" className="input-l" type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && onLogin()} style={{ paddingRight: 44 }} />
              <button onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16 }}>{showPwd ? "🙈" : "👁"}</button>
            </div>
          </div>
          {error && <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 10, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>{error}</div>}
          <button onClick={onLogin} style={{ padding: 13, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white", border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(37,99,235,0.35)", marginTop: 4 }}>
            Se connecter →
          </button>
        </div>
        <div style={{ marginTop: 20, padding: 14, background: "#f8fafc", borderRadius: 12, textAlign: "center" }}>
          <p style={{ fontSize: 11.5, color: "#64748b" }}><strong>oceane</strong> / oceane2026 · <strong>pierre</strong> / pierre2026</p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ stats, contacts, onAdd }) {
  const topClients = contacts.filter(c => c.status === "Client" && c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Dashboard</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Nouveau contact</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Candidats", value: stats.candidates, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Prospects", value: stats.prospects, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Clients", value: stats.clients, color: "#10b981", bg: "#ecfdf5" },
          { label: "CA Total", value: `${stats.revenue.toLocaleString("fr-CA")} $ CAD`, color: "#8b5cf6", bg: "#f5f3ff" },
        ].map((kpi, i) => (
          <div key={i} className="card">
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: kpi.color, marginTop: 8, letterSpacing: "-0.5px" }}>{kpi.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>CA mensuel estimé</h3>
          <RevenueChart contacts={contacts} />
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Top clients</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topClients.length === 0 && <p style={{ fontSize: 13, color: "#94a3b8" }}>Aucun client avec CA</p>}
            {topClients.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, background: "#dbeafe", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: "#64748b" }}>{c.company}</div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{c.revenue.toLocaleString("fr-CA")} $ CAD</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contacts ───────────────────────────────────────────────────────────────────
function Contacts({ contacts, search, setSearch, filterStatus, setFilterStatus, onAdd, onEdit, onDelete, onDetail }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Contacts</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>{contacts.length} résultat{contacts.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Ajouter</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
          <input className="input" style={{ paddingLeft: 38 }} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["Tous", "Candidat", "Prospect", "Client"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className="btn" style={{ padding: "9px 14px", background: filterStatus === s ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "white", color: filterStatus === s ? "white" : "#64748b", border: filterStatus === s ? "none" : "1.5px solid #e2e8f0", boxShadow: filterStatus === s ? "0 4px 12px rgba(37,99,235,0.3)" : "none" }}>{s}</button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              {["Contact", "Entreprise", "Secteur", "Statut", "CA ($ CAD)", "Actions"].map(h => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucun contact trouvé</td></tr>}
            {contacts.map(c => {
              const sc = STATUS_CONFIG[c.status];
              return (
                <tr key={c.id} className="row-hover" style={{ borderBottom: "1px solid #f8fafc" }} onClick={() => onDetail(c.id)}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>{c.name[0]}</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, color: "#374151", fontWeight: 500 }}>{c.company}</td>
                  <td style={{ padding: "14px 20px" }}><span style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "3px 9px", borderRadius: 6, fontWeight: 500 }}>{c.sector}</span></td>
                  <td style={{ padding: "14px 20px" }}><span className="tag" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span></td>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, fontWeight: 700, color: c.revenue > 0 ? "#0f172a" : "#cbd5e1" }}>{c.revenue > 0 ? `${c.revenue.toLocaleString("fr-CA")} $ CAD` : "—"}</td>
                  <td style={{ padding: "14px 20px" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => onEdit(c)}>✏️</button>
                      <button className="btn btn-danger" style={{ padding: "6px 10px" }} onClick={() => onDelete(c.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Pipeline ───────────────────────────────────────────────────────────────────
function Pipeline({ contacts, onEdit }) {
  const columns = [
    { key: "Candidat", label: "Candidats", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    { key: "Prospect", label: "Prospects", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    { key: "Client", label: "Clients", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  ];
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Pipeline</h1>
        <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>Avancement de vos contacts</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {columns.map(col => {
          const items = contacts.filter(c => c.status === col.key);
          return (
            <div key={col.key} style={{ background: col.bg, border: `1.5px solid ${col.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ fontSize: 13.5, fontWeight: 700, color: col.color }}>{col.label}</h3>
                <span style={{ background: col.color, color: "white", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.length === 0 && <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>Aucun contact</div>}
                {items.map(c => (
                  <div key={c.id} onClick={() => onEdit(c)} style={{ background: "white", borderRadius: 12, padding: 14, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 28, height: 28, background: col.bg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: col.color }}>{c.name[0]}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{c.company}</div>
                      </div>
                    </div>
                    {c.revenue > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: col.color, marginTop: 4 }}>{c.revenue.toLocaleString("fr-CA")} $ CAD</div>}
                    {c.notes && <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.notes}</div>}
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

// ─── Revenue ────────────────────────────────────────────────────────────────────
function Revenue({ contacts }) {
  const clients = contacts.filter(c => c.status === "Client");
  const total = clients.reduce((s, c) => s + (c.revenue || 0), 0);
  const sectors = [...new Set(clients.map(c => c.sector))];
  const bySechor = sectors.map(s => ({ sector: s, total: clients.filter(c => c.sector === s).reduce((sum, c) => sum + c.revenue, 0) })).sort((a, b) => b.total - a.total);
  const maxRev = Math.max(...clients.map(c => c.revenue), 1);
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Chiffre d'affaires</h1>
        <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 3 }}>Suivi par client et secteur</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { label: "CA Total", value: `${total.toLocaleString("fr-CA")} $ CAD`, color: "#2563eb" },
          { label: "CA Moyen / Client", value: clients.length > 0 ? `${Math.round(total / clients.length).toLocaleString("fr-CA")} $ CAD` : "—", color: "#10b981" },
          { label: "Meilleur secteur", value: bySechor[0]?.sector || "—", color: "#8b5cf6" },
        ].map((s, i) => (
          <div key={i} className="card">
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Détail par client</h3>
          {clients.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13 }}>Aucun client avec CA</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {clients.sort((a, b) => b.revenue - a.revenue).map(c => (
              <div key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{c.name} <span style={{ color: "#94a3b8", fontWeight: 400 }}>· {c.company}</span></span>
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>{(c.revenue || 0).toLocaleString("fr-CA")} $ CAD</span>
                </div>
                <div style={{ height: 7, background: "#f1f5f9", borderRadius: 4 }}>
                  <div style={{ width: `${((c.revenue || 0) / maxRev) * 100}%`, height: "100%", background: "linear-gradient(90deg, #2563eb, #60a5fa)", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Par secteur</h3>
          {bySechor.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13 }}>Aucune donnée</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bySechor.map((s, i) => {
              const colors = ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6"];
              return (
                <div key={s.sector} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: colors[i % colors.length] }} />
                  <div style={{ flex: 1, fontSize: 13.5, color: "#374151" }}>{s.sector}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{s.total.toLocaleString("fr-CA")} $ CAD</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Form Contact ────────────────────────────────────────────────────────────────
function FormContact({ form, setForm, onSave, onCancel }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Nom *</label><input className="input" value={form.name || ""} onChange={e => f("name", e.target.value)} placeholder="Prénom Nom" /></div>
        <div><label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Entreprise *</label><input className="input" value={form.company || ""} onChange={e => f("company", e.target.value)} placeholder="Nom entreprise" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email</label><input className="input" type="email" value={form.email || ""} onChange={e => f("email", e.target.value)} placeholder="email@exemple.ca" /></div>
        <div><label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Téléphone</label><input className="input" value={form.phone || ""} onChange={e => f("phone", e.target.value)} placeholder="(514) 555-0000" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div><label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Statut</label>
          <select className="input" value={form.status || "Prospect"} onChange={e => f("status", e.target.value)} style={{ cursor: "pointer" }}>
            {["Candidat", "Prospect", "Client"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Secteur</label>
          <select className="input" value={form.sector || "Tech"} onChange={e => f("sector", e.target.value)} style={{ cursor: "pointer" }}>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>CA annuel ($ CAD)</label><input className="input" type="number" value={form.revenue || ""} onChange={e => f("revenue", e.target.value)} placeholder="0" /></div>
      </div>
      <div><label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Notes</label><textarea className="input" style={{ resize: "vertical", minHeight: 72 }} value={form.notes || ""} onChange={e => f("notes", e.target.value)} placeholder="Informations complémentaires..." /></div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={onSave}>{form.id ? "Enregistrer" : "Créer"}</button>
      </div>
    </div>
  );
}

// ─── Contact Detail ──────────────────────────────────────────────────────────────
function ContactDetail({ contact: c, onClose, onEdit, onDelete }) {
  const sc = STATUS_CONFIG[c.status];
  return (
    <div className="card" style={{ width: 420, padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, background: "linear-gradient(135deg, #dbeafe, #93c5fd)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#1d4ed8" }}>{c.name[0]}</div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{c.name}</h2>
            <p style={{ fontSize: 13, color: "#64748b" }}>{c.company}</p>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>✕</button>
      </div>
      <span className="tag" style={{ background: sc.bg, color: sc.color, marginBottom: 16, display: "inline-flex" }}>{sc.label}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {c.email && <div style={{ fontSize: 13.5, color: "#374151" }}>📧 {c.email}</div>}
        {c.phone && <div style={{ fontSize: 13.5, color: "#374151" }}>📞 {c.phone}</div>}
        <div style={{ fontSize: 13.5, color: "#374151" }}>🏷 {c.sector}</div>
        {c.revenue > 0 && <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>💰 {c.revenue.toLocaleString("fr-CA")} $ CAD / an</div>}
        {c.notes && <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}><p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>NOTES</p><p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{c.notes}</p></div>}
        <p style={{ fontSize: 11.5, color: "#cbd5e1" }}>Ajouté le {new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onEdit}>✏️ Modifier</button>
        <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={onDelete}>🗑 Supprimer</button>
      </div>
    </div>
  );
}
