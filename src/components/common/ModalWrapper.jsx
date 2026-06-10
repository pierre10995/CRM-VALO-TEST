import { useEffect } from "react";

export default function ModalWrapper({ onClose, title, children, width = 520 }) {
  // Fermeture au clavier (Échap) pour l'accessibilité
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-bg" style={{ padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width: `min(${width}px, 100%)`, maxHeight: "90vh", overflowY: "auto", padding: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose} aria-label="Fermer" title="Fermer">X</button>
        </div>
        {children}
      </div>
    </div>
  );
}
