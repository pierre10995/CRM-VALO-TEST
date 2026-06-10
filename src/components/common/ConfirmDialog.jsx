import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

/**
 * Modale de confirmation maison, remplaçant window.confirm().
 *
 * Usage :
 *   const confirm = useConfirm();
 *   if (!(await confirm("Supprimer ce contact ?"))) return;
 *
 * Options : confirm(message, { title, confirmLabel, danger })
 * - danger (défaut true) : bouton de confirmation rouge, sinon bleu.
 */
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise(resolve => {
      resolveRef.current = resolve;
      setDialog({
        message,
        title: options.title || "Confirmation",
        confirmLabel: options.confirmLabel || "Confirmer",
        cancelLabel: options.cancelLabel || "Annuler",
        danger: options.danger !== false,
      });
    });
  }, []);

  const close = useCallback((result) => {
    if (resolveRef.current) resolveRef.current(result);
    resolveRef.current = null;
    setDialog(null);
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dialog, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="modal-bg" style={{ zIndex: 10000, padding: 16 }} onClick={e => e.target === e.currentTarget && close(false)}>
          <div className="card" role="alertdialog" aria-modal="true" aria-label={dialog.title} style={{ width: "min(420px, 100%)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: dialog.danger ? "#fee2e2" : "#dbeafe",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dialog.danger ? "#dc2626" : "#2563eb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{dialog.title}</h2>
            </div>
            <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5, marginBottom: 20 }}>{dialog.message}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => close(false)} autoFocus>{dialog.cancelLabel}</button>
              <button
                className={`btn ${dialog.danger ? "btn-danger" : "btn-primary"}`}
                style={dialog.danger ? { background: "#dc2626", color: "white" } : undefined}
                onClick={() => close(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
