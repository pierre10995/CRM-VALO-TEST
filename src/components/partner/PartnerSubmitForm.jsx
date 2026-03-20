import { useState } from "react";
import api from "../../services/api";

export default function PartnerSubmitForm({ missionId, missionTitle, onClose, onSubmitted }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", summary: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("Le nom du candidat est requis.");
    if (!file) return setError("Veuillez joindre un CV (PDF).");

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", borderRadius: 18, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>Proposer un candidat</h3>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>pour {missionTitle}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>x</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nom du candidat *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Prénom Nom" />
          <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="candidat@email.com" type="email" />
          <Field label="Téléphone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(514) 555-1234" />

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Résumé / Notes</label>
            <textarea
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="Résumé du profil, motivations, points forts..."
              rows={4}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>CV (PDF) *</label>
            <div style={{
              border: "2px dashed #e2e8f0", borderRadius: 12, padding: "16px", textAlign: "center",
              background: file ? "#f0fdf4" : "#fafbfd", cursor: "pointer", position: "relative",
            }}
              onClick={() => document.getElementById("partner-cv-input").click()}
            >
              <input id="partner-cv-input" type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
              {file ? (
                <div style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>{file.name}</div>
              ) : (
                <div style={{ fontSize: 13, color: "#94a3b8" }}>Cliquez pour sélectionner un fichier PDF</div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 10, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 12, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={loading} style={{
              flex: 2, padding: 12, background: "linear-gradient(135deg, #059669, #10b981)", color: "white",
              border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", boxShadow: "0 4px 12px rgba(16,185,129,0.3)", opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Envoi en cours..." : "Soumettre le candidat"}
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
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 13, fontFamily: "inherit", outline: "none" }}
      />
    </div>
  );
}
