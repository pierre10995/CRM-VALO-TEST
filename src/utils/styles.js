export const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');

/* ─── Design tokens ──────────────────────────────────────────────────────── */
:root {
  color-scheme: light;
  --brand: #2563eb;
  --brand-2: #4f7cf7;
  --brand-strong: #1d4ed8;
  --brand-tint: #eff4ff;
  --ink: #0f172a;
  --ink-2: #374151;
  --ink-soft: #475569;
  --muted: #64748b;
  --faint: #64748b; /* 4,76:1 sur blanc — conforme WCAG AA pour le texte */
  --line: #e2e8f0;
  --line-soft: #eef2f7;
  --surface: #ffffff;
  --surface-2: #f8fafc;
  --surface-3: #f1f5f9;
  --bg: #eef2fb;
  --app-bg: linear-gradient(160deg, #f6f8fe 0%, #eef2fb 55%, #e9eef9 100%);
  --sidebar-bg: rgba(255,255,255,0.85);
  /* Teintes (fonds de tags, KPI, colonnes) — adaptées en sombre */
  --tint-blue: #dbeafe; --tint-blue-soft: #eff6ff;
  --tint-green: #d1fae5; --tint-green-soft: #ecfdf5;
  --tint-amber: #fef3c7; --tint-amber-soft: #fffbeb;
  --tint-red: #fee2e2; --tint-red-soft: #fef2f2;
  --tint-violet: #ede9fe; --tint-violet-soft: #f5f3ff;
  --tint-pink: #fce7f3;
  /* Couleurs sémantiques de texte/icône (éclaircies en sombre) */
  --c-green: #059669; --c-blue: #2563eb; --c-red: #dc2626; --c-amber: #d97706;
  --c-violet: #7c3aed; --c-indigo: #4f46e5; --c-pink: #be185d;
  --text-success: #065f46; --text-danger: #991b1b; --text-info: #1e40af; --text-warning: #92400e;
  --radius-lg: 18px;
  --radius: 12px;
  --radius-sm: 9px;
  --shadow-xs: 0 1px 2px rgba(15,23,42,0.04);
  --shadow-sm: 0 1px 3px rgba(15,23,42,0.05), 0 6px 18px rgba(15,23,42,0.04);
  --shadow-md: 0 6px 16px rgba(15,23,42,0.08), 0 18px 40px rgba(15,23,42,0.06);
  --shadow-brand: 0 6px 18px rgba(37,99,235,0.32);
  --ring: 0 0 0 3px rgba(37,99,235,0.18);
}

/* ─── Thème sombre ───────────────────────────────────────────────────────── */
/* Activé par data-theme="dark", ou par la préférence système si aucun choix
   explicite (data-theme absent ou "auto"). */
:root[data-theme="dark"] { --_dark: 1; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --_dark: 1; }
}
:root[data-theme="dark"],
:root:not([data-theme="light"]):has(body):where([data-theme="auto"], :not([data-theme])) {}
:root[data-theme="dark"] {
  color-scheme: dark;
  --brand: #5b8cff;
  --brand-2: #7aa2ff;
  --brand-strong: #3b6cf5;
  --brand-tint: #1c2942;
  --ink: #e6eaf3;
  --ink-2: #cfd6e3;
  --ink-soft: #b3bdcf;
  --muted: #98a4b8;
  --faint: #98a4b8;
  --line: #273249;
  --line-soft: #1f293d;
  --surface: #141c2f;
  --surface-2: #1a2438;
  --surface-3: #212d45;
  --bg: #0b1220;
  --app-bg: linear-gradient(160deg, #0e1526 0%, #0b1220 55%, #0a101c 100%);
  --sidebar-bg: rgba(20,28,47,0.88);
  --tint-blue: #1e2f55; --tint-blue-soft: #172440;
  --tint-green: #123d2f; --tint-green-soft: #0f3327;
  --tint-amber: #3d2e0c; --tint-amber-soft: #2e2410;
  --tint-red: #4a1c1c; --tint-red-soft: #3a1717;
  --tint-violet: #2a2350; --tint-violet-soft: #211c40;
  --tint-pink: #45203a;
  --c-green: #34d399; --c-blue: #7aa2ff; --c-red: #f87171; --c-amber: #fbbf24;
  --c-violet: #a78bfa; --c-indigo: #818cf8; --c-pink: #f472b6;
  --text-success: #a7f3d0; --text-danger: #fecaca; --text-info: #bfdbfe; --text-warning: #fde68a;
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.35), 0 6px 18px rgba(0,0,0,0.3);
  --shadow-md: 0 6px 16px rgba(0,0,0,0.45), 0 18px 40px rgba(0,0,0,0.4);
  --ring: 0 0 0 3px rgba(91,140,255,0.35);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) {
    color-scheme: dark;
    --brand: #5b8cff;
    --brand-2: #7aa2ff;
    --brand-strong: #3b6cf5;
    --brand-tint: #1c2942;
    --ink: #e6eaf3;
    --ink-2: #cfd6e3;
    --ink-soft: #b3bdcf;
    --muted: #98a4b8;
    --faint: #98a4b8;
    --line: #273249;
    --line-soft: #1f293d;
    --surface: #141c2f;
    --surface-2: #1a2438;
    --surface-3: #212d45;
    --bg: #0b1220;
    --app-bg: linear-gradient(160deg, #0e1526 0%, #0b1220 55%, #0a101c 100%);
    --sidebar-bg: rgba(20,28,47,0.88);
  --tint-blue: #1e2f55; --tint-blue-soft: #172440;
  --tint-green: #123d2f; --tint-green-soft: #0f3327;
  --tint-amber: #3d2e0c; --tint-amber-soft: #2e2410;
  --tint-red: #4a1c1c; --tint-red-soft: #3a1717;
  --tint-violet: #2a2350; --tint-violet-soft: #211c40;
  --tint-pink: #45203a;
  --c-green: #34d399; --c-blue: #7aa2ff; --c-red: #f87171; --c-amber: #fbbf24;
  --c-violet: #a78bfa; --c-indigo: #818cf8; --c-pink: #f472b6;
  --text-success: #a7f3d0; --text-danger: #fecaca; --text-info: #bfdbfe; --text-warning: #fde68a;
    --shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.35), 0 6px 18px rgba(0,0,0,0.3);
    --shadow-md: 0 6px 16px rgba(0,0,0,0.45), 0 18px 40px rgba(0,0,0,0.4);
    --ring: 0 0 0 3px rgba(91,140,255,0.35);
  }
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  font-family: 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--ink);
  background: var(--bg);
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
.btn-ghost { background: var(--surface); color: var(--ink-soft); border: 1px solid var(--line); box-shadow: var(--shadow-xs); }
.btn-ghost:hover { background: var(--surface-2); color: var(--ink); border-color: var(--line); }
.btn-danger { background: var(--tint-red); color: #dc2626; border: none; }
.btn-danger:hover { filter: brightness(0.95); }
.btn-success { background: var(--tint-green); color: #059669; border: none; }
.btn-success:hover { filter: brightness(0.95); }
:root[data-theme="dark"] .btn-danger { color: #f87171; }
:root[data-theme="dark"] .btn-success { color: #34d399; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

/* ─── Inputs ─────────────────────────────────────────────────────────────── */
.input { width: 100%; padding: 10px 14px; border: 1.5px solid var(--line); border-radius: var(--radius); font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; color: var(--ink); background: var(--surface-2); }
.input::placeholder { color: var(--faint); }
.input:hover { border-color: var(--muted); }
.input:focus { border-color: var(--brand); background: var(--surface); box-shadow: var(--ring); }
select.input option { color: var(--ink); background: var(--surface); }

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
.skeleton { background: linear-gradient(90deg, var(--line-soft) 25%, var(--surface-2) 50%, var(--line-soft) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
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
