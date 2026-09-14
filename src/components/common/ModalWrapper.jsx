import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modale accessible : rôle dialog, Échap pour fermer, focus placé dans la
 * modale à l'ouverture, piégé (Tab/Shift+Tab) tant qu'elle est ouverte, et
 * rendu à l'élément déclencheur à la fermeture.
 */
export default function ModalWrapper({ onClose, title, children, width = 520 }) {
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    const dialog = dialogRef.current;
    // Focus initial : premier champ/bouton, sinon le titre
    const first = dialog?.querySelector(FOCUSABLE);
    (first || dialog)?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
      if (items.length === 0) { e.preventDefault(); return; }
      const firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previousFocus.current && previousFocus.current.focus) previousFocus.current.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-bg" style={{ padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{ width: `min(${width}px, 100%)`, maxHeight: "90vh", overflowY: "auto", padding: 28, outline: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>{title}</h2>
          <button type="button" className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose} aria-label="Fermer" title="Fermer">X</button>
        </div>
        {children}
      </div>
    </div>
  );
}
