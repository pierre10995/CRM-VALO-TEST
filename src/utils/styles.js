export const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');

/* ─── Design tokens ──────────────────────────────────────────────────────── */
:root {
  --brand: #2563eb;
  --brand-2: #4f7cf7;
  --brand-strong: #1d4ed8;
  --brand-tint: #eff4ff;
  --ink: #0f172a;
  --ink-soft: #475569;
  --muted: #64748b;
  --faint: #64748b; /* 4,76:1 sur blanc — conforme WCAG AA pour le texte */
  --line: #e8ecf3;
  --line-soft: #eef2f8;
  --surface: #ffffff;
  --radius-lg: 18px;
  --radius: 12px;
  --radius-sm: 9px;
  --shadow-xs: 0 1px 2px rgba(15,23,42,0.04);
  --shadow-sm: 0 1px 3px rgba(15,23,42,0.05), 0 6px 18px rgba(15,23,42,0.04);
  --shadow-md: 0 6px 16px rgba(15,23,42,0.08), 0 18px 40px rgba(15,23,42,0.06);
  --shadow-brand: 0 6px 18px rgba(37,99,235,0.32);
  --ring: 0 0 0 3px rgba(37,99,235,0.18);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  font-family: 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--ink);
  background: #eef2fb;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
::selection { background: rgba(37,99,235,0.16); }

/* ─── Scrollbar ──────────────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 9px; height: 9px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cdd6e4; border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
::-webkit-scrollbar-thumb:hover { background: #aab6c9; background-clip: padding-box; }

/* ─── Animations ─────────────────────────────────────────────────────────── */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes popIn { from { opacity: 0; transform: translateY(12px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes toastIn { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
@keyframes toastOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(60px); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shimmer { to { background-position: -200% 0; } }

/* ─── Navigation ─────────────────────────────────────────────────────────── */
.nav-item { display: flex; align-items: center; gap: 11px; padding: 10px 13px; border-radius: var(--radius); cursor: pointer; font-size: 13.5px; font-weight: 500; color: var(--muted); transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease; }
.nav-item:hover { background: var(--brand-tint); color: var(--brand); }
.nav-item.active { background: linear-gradient(135deg, var(--brand-strong), var(--brand-2)); color: #fff; box-shadow: var(--shadow-brand); }
.nav-item.active svg { stroke: #fff; }

/* ─── Cards ──────────────────────────────────────────────────────────────── */
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); animation: fadeIn 0.4s ease; transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease; }
.card:hover { box-shadow: var(--shadow-md); }

/* ─── Buttons ────────────────────────────────────────────────────────────── */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 18px; border-radius: var(--radius); border: none; cursor: pointer; font-size: 13.5px; font-weight: 600; font-family: inherit; letter-spacing: 0.01em; transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, color 0.16s ease; }
.btn:active { transform: translateY(0) scale(0.97); }
.btn-primary { background: linear-gradient(135deg, var(--brand-strong), var(--brand-2)); color: #fff; box-shadow: var(--shadow-brand); }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 9px 24px rgba(37,99,235,0.42); }
.btn-ghost { background: #fff; color: var(--ink-soft); border: 1px solid var(--line); box-shadow: var(--shadow-xs); }
.btn-ghost:hover { background: #f8fafc; color: var(--ink); border-color: #d7dfea; }
.btn-danger { background: #fee2e2; color: #dc2626; border: none; }
.btn-danger:hover { background: #fecaca; }
.btn-success { background: #d1fae5; color: #059669; border: none; }
.btn-success:hover { background: #a7f3d0; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

/* ─── Inputs ─────────────────────────────────────────────────────────────── */
.input { width: 100%; padding: 10px 14px; border: 1.5px solid var(--line); border-radius: var(--radius); font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; color: #1e293b; background: #f7f9fc; }
.input::placeholder { color: var(--faint); }
.input:hover { border-color: #d7dfea; }
.input:focus { border-color: var(--brand); background: #fff; box-shadow: var(--ring); }

/* ─── Focus accessibilité ────────────────────────────────────────────────── */
/* Indicateur de focus visible partout (WCAG 2.4.7), affiné pour .btn/.input */
:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.btn:focus-visible, .nav-item:focus-visible, .input:focus-visible { outline: none; box-shadow: var(--ring); }
[role="button"]:focus-visible, tr[tabindex]:focus-visible { outline: 2px solid var(--brand); outline-offset: -2px; }

/* Éléments de navigation rendus par des <button> natifs */
button.nav-item { width: 100%; border: none; background: transparent; font-family: inherit; text-align: left; }

/* Texte réservé aux lecteurs d'écran */
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

/* Respect de la préférence « réduire les animations » */
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after { animation: none !important; transition: none !important; }
}

/* ─── Tags ───────────────────────────────────────────────────────────────── */
.tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 11px; border-radius: 999px; font-size: 11.5px; font-weight: 600; letter-spacing: 0.01em; }

/* ─── Tables / lignes ────────────────────────────────────────────────────── */
.row-hover { transition: background 0.15s ease; }
.row-hover:hover { background: var(--brand-tint); cursor: pointer; }

/* ─── Modals ─────────────────────────────────────────────────────────────── */
.modal-bg { position: fixed; inset: 0; background: rgba(15,23,42,0.45); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.2s ease; }
.modal-bg > * { animation: popIn 0.24s cubic-bezier(0.22, 1, 0.36, 1); }

/* ─── Utilitaires ────────────────────────────────────────────────────────── */
.spinner { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; flex-shrink: 0; }
.skeleton { background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
.table-wrap { width: 100%; overflow-x: auto; }

/* ─── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .app-main { padding: 16px !important; }
  .app-sidebar { width: 72px !important; padding: 20px 6px !important; }
  .app-sidebar .sidebar-text { display: none !important; }
  .app-sidebar .nav-item { justify-content: center; padding: 10px !important; }
}
/* Les grilles (KPI, formulaires, fiches) passent en une colonne sur mobile */
@media (max-width: 640px) {
  .resp-grid { grid-template-columns: 1fr !important; }
  .page-header-actions { flex-wrap: wrap; }
}
`;
