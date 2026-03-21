import { useState, useRef } from "react";
import api from "../services/api";

export default function BulkCvUpload({ onComplete }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFiles = async (fileList) => {
    const pdfFiles = Array.from(fileList).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (pdfFiles.length === 0) {
      alert("Veuillez sélectionner des fichiers PDF uniquement.");
      return;
    }

    setUploading(true);
    setProgress({ current: 0, total: pdfFiles.length });
    setResults(null);

    // Process in batches of 5 to avoid payload too large
    const batchSize = 5;
    const allResults = [];

    for (let i = 0; i < pdfFiles.length; i += batchSize) {
      const batch = pdfFiles.slice(i, i + batchSize);
      const files = [];
      for (const file of batch) {
        const fileData = await readFileAsBase64(file);
        files.push({ fileName: file.name, fileData });
      }

      const res = await api.post("/api/bulk-cv-upload", { files });
      if (res.ok) {
        const data = await res.json();
        allResults.push(...data.results);
      } else {
        batch.forEach(f => allResults.push({ fileName: f.name, status: "error", error: "Erreur réseau" }));
      }
      setProgress({ current: Math.min(i + batchSize, pdfFiles.length), total: pdfFiles.length });
    }

    const summary = {
      total: pdfFiles.length,
      created: allResults.filter(r => r.status === "created").length,
      duplicates: allResults.filter(r => r.status === "duplicate").length,
      errors: allResults.filter(r => r.status === "error").length,
      results: allResults,
    };

    setResults(summary);
    setUploading(false);
    setProgress(null);
    if (onComplete) onComplete();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  return (
    <div className="card" style={{ marginBottom: 20, padding: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
        Import en masse de CV
      </div>
      <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 16 }}>
        Glissez-déposez vos CV (PDF) pour créer automatiquement les fiches candidats. Le nom, email et téléphone seront extraits de chaque CV.
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#3b82f6" : "#cbd5e1"}`,
          borderRadius: 12,
          padding: "36px 20px",
          textAlign: "center",
          cursor: uploading ? "wait" : "pointer",
          background: dragging ? "#eff6ff" : "#f8fafc",
          transition: "all 0.2s",
        }}
      >
        {uploading ? (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>...</div>
            <div style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600 }}>
              Traitement en cours... {progress?.current}/{progress?.total} CV
            </div>
            <div style={{ width: "60%", height: 6, background: "#e2e8f0", borderRadius: 3, margin: "12px auto 0" }}>
              <div style={{
                width: `${(progress?.current / progress?.total) * 100}%`,
                height: "100%",
                background: "#3b82f6",
                borderRadius: 3,
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>PDF</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#374151" }}>
              Glissez vos CV ici ou cliquez pour sélectionner
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              Fichiers PDF uniquement — plusieurs fichiers acceptés
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        style={{ display: "none" }}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />

      {/* Results */}
      {results && (
        <div style={{ marginTop: 16, padding: 14, background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#166534", marginBottom: 8 }}>
            Import terminé
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12.5 }}>
            <span style={{ color: "#059669" }}>{results.created} créé{results.created > 1 ? "s" : ""}</span>
            {results.duplicates > 0 && <span style={{ color: "#d97706" }}>{results.duplicates} doublon{results.duplicates > 1 ? "s" : ""}</span>}
            {results.errors > 0 && <span style={{ color: "#dc2626" }}>{results.errors} erreur{results.errors > 1 ? "s" : ""}</span>}
          </div>
          {results.results.length > 0 && (
            <div style={{ marginTop: 10, maxHeight: 200, overflowY: "auto" }}>
              {results.results.map((r, i) => (
                <div key={i} style={{ fontSize: 12, padding: "4px 0", display: "flex", gap: 8, alignItems: "center", borderBottom: "1px solid #dcfce7" }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: r.status === "created" ? "#22c55e" : r.status === "duplicate" ? "#f59e0b" : "#ef4444",
                    flexShrink: 0,
                  }} />
                  <span style={{ color: "#374151", fontWeight: 500 }}>{r.fileName}</span>
                  {r.status === "created" && <span style={{ color: "#059669" }}>{r.contact?.name}</span>}
                  {r.status === "duplicate" && <span style={{ color: "#d97706" }}>Doublon ({r.email})</span>}
                  {r.status === "error" && <span style={{ color: "#dc2626" }}>{r.error}</span>}
                </div>
              ))}
            </div>
          )}
          <button
            className="btn btn-ghost"
            style={{ marginTop: 10, fontSize: 12, padding: "6px 12px" }}
            onClick={() => setResults(null)}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
