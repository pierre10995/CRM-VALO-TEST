export const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-size: 13.5px; font-weight: 500; color: #64748b; transition: all 0.2s; }
.nav-item:hover { background: #eff6ff; color: #2563eb; }
.nav-item.active { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
.card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.04); animation: fadeIn 0.4s ease; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 10px; border: none; cursor: pointer; font-size: 13.5px; font-weight: 600; font-family: inherit; transition: all 0.2s; }
.btn-primary { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37,99,235,0.4); }
.btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
.btn-ghost:hover { background: #f8fafc; color: #1e293b; }
.btn-danger { background: #fee2e2; color: #dc2626; border: none; }
.btn-danger:hover { background: #fecaca; }
.btn-success { background: #d1fae5; color: #059669; border: none; }
.btn-success:hover { background: #a7f3d0; }
.input { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; transition: border 0.2s; color: #1e293b; background: #fafbfd; }
.input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
.tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; }
.row-hover:hover { background: #f8fafc; cursor: pointer; }
.modal-bg { position: fixed; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
`;
