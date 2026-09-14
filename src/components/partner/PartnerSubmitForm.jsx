import { useState } from "react";
import api from "../../services/api";
import { useConfirm } from "../common/ConfirmDialog";

export default function PartnerSubmitForm({ missionId, missionTitle, onClose, onSubmitted }) {
  const confirm = useConfirm();
  const [form, setForm] = useState({ name: "", email: "", phone: "", summary: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email check state
  const [emailCheck, setEmailCheck] = useState(null); // null | "checking" | "known" | "available"
  const [emailBlocked, setEmailBlocked] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (f.size > 6 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 6 Mo.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setFile({ name: f.name, data: reader.result.split(",")[1] });
    };
    reader.readAsDataURL(f);
  };

  const checkEmail = async (email) => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailCheck(null);
      setEmailBlocked(false);
      return;
    }
    setEmailCheck("checking");
    try {
      const data = await api.get(`/api/partner/check-email?email=${encodeURIComponent(trimmed)}`);
      setEmailCheck(data.known ? "known" : "available");
      setEmailBlocked(data.known);
    } catch {
      setEmailCheck(null);
      setEmailBlocked(false);
    }
  };

  const handleEmailChange = (v) => {
    setForm(f => ({ ...f, email: v }));
    setEmailCheck(null);
    setEmailBlocked(false);
  };

  const formDirty = form.name || form.email || form.phone || form.summary || file;

  const handleClose = async () => {
    if (formDirty && !(await confirm("Les informations saisies seront perdues. Quitter quand même ?", { title: "Modifications non enregistrées", confirmLabel: "Quitter sans enregistrer" }))) return;
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("Le nom du candidat est requis.");
    if (!form.email.trim()) return setError("L'email du candidat est requis pour vérifier les doublons.");
    if (emailBlocked) return setError("Ce candidat est déjà connu de notre entreprise. Soumission impossible.");
    if (!file) return setError("Veuillez joindre un CV (PDF).");

    if (!(await confirm(`Confirmez-vous la soumission du candidat « ${form.name.trim()} » pour la mission « ${missionTitle} » ?`, { title: "Soumettre le candidat", danger: false, confirmLabel: "Soumettre" }))) return;

    setLoading(true);
    try {
      const res = await api.post("/api/partner/submit", {
        missionId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        summary: form.summary.trim(),
        fileName: file.name,
        fileData: file.data,
      });
      if (res.ok) {
        onSubmitted();
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la soumission");
      }
    } catch {
      setError("Erreur réseau");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Proposer un candidat</h3>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>pour {missionTitle}</div>
          </div>
          <button onClick={handleClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}>x</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nom du candidat *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Prénom Nom" />

          {/* Email with check */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Email du candidat *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                value={form.email}
                onChange={e => handleEmailChange(e.target.value)}
                placeholder="candidat@email.com"
                style={{
                  flex: 1, padding: "10px 14px",
                  border: `1.5px solid ${emailCheck === "known" ? "#fca5a5" : emailCheck === "available" ? "#86efac" : "var(--line)"}`,
                  borderRadius: 12, fontSize: 13, fontFamily: "inherit", outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => checkEmail(form.email)}
                disabled={emailCheck === "checking" || !form.email.trim()}
                style={{
                  padding: "10px 16px", background: "#f0f9ff", border: "1.5px solid #93c5fd", borderRadius: 12,
                  fontSize: 12.5, fontWeight: 600, color: "var(--c-blue)", cursor: "pointer", fontFamily: "inherit",
                  whiteSpace: "nowrap", opacity: (!form.email.trim() || emailCheck === "checking") ? 0.5 : 1,
                }}
              >
                {emailCheck === "checking" ? "..." : "Vérifier"}
              </button>
            </div>
            {emailCheck === "known" && (
              <div style={{ marginTop: 6, padding: "8px 12px", background: "var(--tint-red)", borderRadius: 8, fontSize: 12.5, color: "var(--c-red)", fontWeight: 500 }}>
                Ce candidat est déjà connu de notre entreprise. Vous ne pouvez pas le soumettre.
              </div>
            )}
            {emailCheck === "available" && (
              <div style={{ marginTop: 6, padding: "8px 12px", background: "var(--tint-green-soft)", borderRadius: 8, fontSize: 12.5, color: "var(--c-green)", fontWeight: 500 }}>
                Ce candidat n'est pas encore dans notre base. Vous pouvez le soumettre.
              </div>
            )}
          </div>

          <Field label="Téléphone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(514) 555-1234" />

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Résumé / Notes</label>
            <textarea
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="Résumé du profil, motivations, points forts..."
              rows={4}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--line)", borderRadius: 12, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>CV (PDF) *</label>
            <div style={{
              border: "2px dashed var(--line)", borderRadius: 12, padding: "16px", textAlign: "center",
              background: file ? "var(--tint-green-soft)" : "#fafbfd", cursor: "pointer", position: "relative",
            }}
              onClick={() => document.getElementById("partner-cv-input").click()}
            >
              <input id="partner-cv-input" type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
              {file ? (
                <div style={{ fontSize: 13, color: "var(--c-green)", fontWeight: 500 }}>{file.name}</div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Cliquez pour sélectionner un fichier PDF</div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "var(--tint-red)", borderRadius: 10, fontSize: 13, color: "var(--c-red)", fontWeight: 500 }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={handleClose} style={{ flex: 1, padding: 12, background: "var(--surface-3)", color: "var(--ink-soft)", border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={loading || emailBlocked} style={{
              flex: 2, padding: 12, background: emailBlocked ? "var(--line)" : "linear-gradient(135deg, #059669, #10b981)", color: emailBlocked ? "var(--muted)" : "white",
              border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 700, cursor: emailBlocked ? "not-allowed" : "pointer",
              fontFamily: "inherit", boxShadow: emailBlocked ? "none" : "0 4px 12px rgba(16,185,129,0.3)", opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Envoi en cours..." : emailBlocked ? "Soumission bloquée" : "Soumettre le candidat"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--line)", borderRadius: 12, fontSize: 13, fontFamily: "inherit", outline: "none" }}
      />
    </div>
  );
}
