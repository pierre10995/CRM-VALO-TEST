export default function LoginScreen({ form, setForm, showPwd, setShowPwd, error, onLogin }) {
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
      </div>
    </div>
  );
}
