import { useState } from "react";

export default function LoginScreen({ form, setForm, showPwd, setShowPwd, error, onLogin }) {
  const [mode, setMode] = useState("login"); // login | forgot | reset
  const [forgotLogin, setForgotLogin] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgot = async () => {
    if (!forgotLogin) return setResetError("Veuillez entrer votre identifiant");
    setLoading(true);
    setResetError("");
    try {
      const res = await fetch("/api/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login: forgotLogin }) });
      if (res.ok) {
        setMessage("Si cet identifiant existe, un code de réinitialisation a été envoyé à l'administrateur. Contactez-le pour obtenir votre code.");
        setMode("reset");
      } else {
        const err = await res.json();
        setResetError(err.error);
      }
    } catch { setResetError("Erreur réseau"); }
    setLoading(false);
  };

  const handleReset = async () => {
    setResetError("");
    if (!resetCode || !newPassword) return setResetError("Tous les champs sont requis");
    if (newPassword.length < 6) return setResetError("Le mot de passe doit contenir au moins 6 caractères");
    if (newPassword !== confirmPassword) return setResetError("Les mots de passe ne correspondent pas");
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login: forgotLogin, code: resetCode, newPassword }) });
      if (res.ok) {
        setMessage("Mot de passe réinitialisé avec succès !");
        setMode("login");
        setForgotLogin(""); setResetCode(""); setNewPassword(""); setConfirmPassword("");
      } else {
        const err = await res.json();
        setResetError(err.error);
      }
    } catch { setResetError("Erreur réseau"); }
    setLoading(false);
  };

  const backToLogin = () => {
    setMode("login");
    setForgotLogin(""); setResetCode(""); setNewPassword(""); setConfirmPassword("");
    setResetError(""); setMessage("");
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Sora', sans-serif", background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #e0f2fe 100%)", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} } .input-l { width:100%; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:12px; font-size:14px; font-family:inherit; outline:none; transition:all 0.2s; color:#1e293b; background:#fafbfd; } .input-l:focus { border-color:#2563eb; box-shadow:0 0 0 4px rgba(37,99,235,0.1); }`}</style>
      <div style={{ width: "100%", maxWidth: 420, padding: 40, background: "white", borderRadius: 24, boxShadow: "0 20px 60px rgba(37,99,235,0.12)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(37,99,235,0.35)", animation: "float 4s ease-in-out infinite" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>VALO Recrutement</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 6 }}>
            {mode === "login" && "Connectez-vous à votre espace"}
            {mode === "forgot" && "Réinitialisation du mot de passe"}
            {mode === "reset" && "Entrez le code reçu"}
          </p>
        </div>

        {/* Success message */}
        {message && mode === "login" && (
          <div style={{ padding: "10px 14px", background: "#d1fae5", borderRadius: 10, fontSize: 13, color: "#059669", fontWeight: 500, marginBottom: 14 }}>{message}</div>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Identifiant</label>
              <input className="input-l" value={form.login} onChange={e => setForm(p => ({ ...p, login: e.target.value }))} placeholder="prenom@valo-inno.com" onKeyDown={e => e.key === "Enter" && document.getElementById("pwd-field")?.focus()} />
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
            <button onClick={() => { setMode("forgot"); setMessage(""); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
              Mot de passe oublié ?
            </button>
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Votre identifiant</label>
              <input className="input-l" value={forgotLogin} onChange={e => setForgotLogin(e.target.value)} placeholder="prenom@valo-inno.com" onKeyDown={e => e.key === "Enter" && handleForgot()} />
            </div>
            {resetError && <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 10, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>{resetError}</div>}
            <button onClick={handleForgot} disabled={loading} style={{ padding: 13, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white", border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(37,99,235,0.35)", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Envoi..." : "Demander un code"}
            </button>
            <button onClick={backToLogin} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
              Retour à la connexion
            </button>
          </div>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === "reset" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {message && <div style={{ padding: "10px 14px", background: "#dbeafe", borderRadius: 10, fontSize: 13, color: "#1d4ed8", fontWeight: 500 }}>{message}</div>}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Code à 6 chiffres</label>
              <input className="input-l" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" maxLength={6} style={{ letterSpacing: 8, textAlign: "center", fontSize: 20, fontWeight: 700 }} onKeyDown={e => e.key === "Enter" && document.getElementById("new-pwd")?.focus()} />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Nouveau mot de passe</label>
              <input id="new-pwd" className="input-l" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 caractères" onKeyDown={e => e.key === "Enter" && document.getElementById("confirm-pwd")?.focus()} />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Confirmer le mot de passe</label>
              <input id="confirm-pwd" className="input-l" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmez..." onKeyDown={e => e.key === "Enter" && handleReset()} />
            </div>
            {resetError && <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 10, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>{resetError}</div>}
            <button onClick={handleReset} disabled={loading} style={{ padding: 13, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white", border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(37,99,235,0.35)", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </button>
            <button onClick={backToLogin} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
