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
        setMessage("Si cet identifiant existe, un code de réinitialisation à 6 chiffres vient d'être envoyé par email. Vérifiez votre boîte de réception.");
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
    if (newPassword.length < 12) return setResetError("Le mot de passe doit contenir au moins 12 caractères");
    if (!/[A-Z]/.test(newPassword)) return setResetError("Le mot de passe doit contenir au moins une majuscule");
    if (!/[a-z]/.test(newPassword)) return setResetError("Le mot de passe doit contenir au moins une minuscule");
    if (!/[0-9]/.test(newPassword)) return setResetError("Le mot de passe doit contenir au moins un chiffre");
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
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Sora', sans-serif", background: "var(--app-bg)", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} } .input-l { width:100%; padding:12px 16px; border:1.5px solid var(--line); border-radius:12px; font-size:14px; font-family:inherit; outline:none; transition:all 0.2s; color:var(--ink); background:var(--surface-2); } .input-l:focus { border-color:var(--brand); box-shadow:var(--ring); }`}</style>
      <div style={{ width: "100%", maxWidth: 420, padding: 40, background: "var(--surface)", borderRadius: 24, boxShadow: "0 20px 60px rgba(37,99,235,0.12)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo-valo.svg" alt="VALO" style={{ width: 80, height: 80, borderRadius: 16, objectFit: "cover", margin: "0 auto 16px", display: "block", boxShadow: "0 8px 24px rgba(37,99,235,0.2)", animation: "float 4s ease-in-out infinite" }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>VALO Recrutement</h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 6 }}>
            {mode === "login" && "Connectez-vous à votre espace"}
            {mode === "forgot" && "Réinitialisation du mot de passe"}
            {mode === "reset" && "Entrez le code reçu"}
          </p>
        </div>

        {/* Success message */}
        {message && mode === "login" && (
          <div style={{ padding: "10px 14px", background: "var(--tint-green)", borderRadius: 10, fontSize: 13, color: "var(--c-green)", fontWeight: 500, marginBottom: 14 }}>{message}</div>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={e => { e.preventDefault(); onLogin(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }} aria-label="Connexion">
            <div>
              <label htmlFor="login-field" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Identifiant</label>
              <input id="login-field" name="username" autoComplete="username" className="input-l" value={form.login} onChange={e => setForm(p => ({ ...p, login: e.target.value }))} placeholder="prenom@valo-inno.com" />
            </div>
            <div>
              <label htmlFor="pwd-field" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input id="pwd-field" name="password" autoComplete="current-password" className="input-l" type={showPwd ? "text" : "password"} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="********" style={{ paddingRight: 72 }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} aria-pressed={showPwd} aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, fontFamily: "inherit" }}>{showPwd ? "Masquer" : "Voir"}</button>
              </div>
            </div>
            {error && <div role="alert" style={{ padding: "10px 14px", background: "var(--tint-red)", borderRadius: 10, fontSize: 13, color: "var(--c-red)", fontWeight: 500 }}>{error}</div>}
            <button type="submit" style={{ padding: 13, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white", border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(37,99,235,0.35)", marginTop: 4 }}>
              Se connecter
            </button>
            <button type="button" onClick={() => { setMode("forgot"); setMessage(""); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
              Mot de passe oublié ?
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label htmlFor="forgot-login" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Votre identifiant</label>
              <input id="forgot-login" autoComplete="username" className="input-l" value={forgotLogin} onChange={e => setForgotLogin(e.target.value)} placeholder="prenom@valo-inno.com" onKeyDown={e => e.key === "Enter" && handleForgot()} />
            </div>
            {resetError && <div role="alert" style={{ padding: "10px 14px", background: "var(--tint-red)", borderRadius: 10, fontSize: 13, color: "var(--c-red)", fontWeight: 500 }}>{resetError}</div>}
            <button type="button" onClick={handleForgot} disabled={loading} style={{ padding: 13, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white", border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(37,99,235,0.35)", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Envoi..." : "Demander un code"}
            </button>
            <button onClick={backToLogin} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
              Retour à la connexion
            </button>
          </div>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === "reset" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {message && <div style={{ padding: "10px 14px", background: "var(--tint-blue)", borderRadius: 10, fontSize: 13, color: "#1d4ed8", fontWeight: 500 }}>{message}</div>}
            <div>
              <label htmlFor="reset-code" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Code à 6 chiffres</label>
              <input id="reset-code" inputMode="numeric" autoComplete="one-time-code" className="input-l" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" maxLength={6} style={{ letterSpacing: 8, textAlign: "center", fontSize: 20, fontWeight: 700 }} onKeyDown={e => e.key === "Enter" && document.getElementById("new-pwd")?.focus()} />
            </div>
            <div>
              <label htmlFor="new-pwd" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Nouveau mot de passe</label>
              <input id="new-pwd" autoComplete="new-password" className="input-l" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 12 car., 1 majuscule, 1 minuscule, 1 chiffre" onKeyDown={e => e.key === "Enter" && document.getElementById("confirm-pwd")?.focus()} />
            </div>
            <div>
              <label htmlFor="confirm-pwd" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Confirmer le mot de passe</label>
              <input id="confirm-pwd" autoComplete="new-password" className="input-l" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmez..." onKeyDown={e => e.key === "Enter" && handleReset()} />
            </div>
            {resetError && <div role="alert" style={{ padding: "10px 14px", background: "var(--tint-red)", borderRadius: 10, fontSize: 13, color: "var(--c-red)", fontWeight: 500 }}>{resetError}</div>}
            <button type="button" onClick={handleReset} disabled={loading} style={{ padding: 13, background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white", border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(37,99,235,0.35)", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </button>
            <button onClick={backToLogin} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
