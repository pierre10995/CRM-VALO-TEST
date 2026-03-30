import { useState, useEffect, useCallback, createContext, useContext } from "react";

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46", icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  error: { bg: "#fef2f2", border: "#fecaca", color: "#991b1b", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  info: { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  warning: { bg: "#fffbeb", border: "#fde68a", color: "#92400e", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, removing: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, duration);
  }, []);

  const toast = useCallback({
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error", 5000),
    info: (msg) => addToast(msg, "info"),
    warning: (msg) => addToast(msg, "warning", 4000),
  }, [addToast]);

  // Reassign methods after creation since useCallback doesn't support object syntax
  const toastApi = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error", 5000),
    info: (msg) => addToast(msg, "info"),
    warning: (msg) => addToast(msg, "warning", 4000),
  };

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      {/* Toast container */}
      <div style={{
        position: "fixed", top: 20, right: 20, zIndex: 99999,
        display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none",
      }}>
        {toasts.map(t => {
          const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          return (
            <div
              key={t.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 18px", borderRadius: 12,
                background: s.bg, border: `1px solid ${s.border}`, color: s.color,
                fontSize: 13.5, fontWeight: 500, fontFamily: "'Sora', sans-serif",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                pointerEvents: "auto", maxWidth: 400, minWidth: 260,
                animation: t.removing ? "toastOut 0.3s ease forwards" : "toastIn 0.3s ease forwards",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={s.icon} />
              </svg>
              <span style={{ lineHeight: 1.4 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
