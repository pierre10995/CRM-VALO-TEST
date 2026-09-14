/**
 * Pagination simple et réutilisable.
 * Affiche "Précédent / page X sur N / Suivant" + le décompte des éléments.
 */
export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 4px", flexWrap: "wrap" }}>
      <span style={{ fontSize: 12.5, color: "#64748b" }}>
        {from}–{to} sur {total}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: "6px 12px", fontSize: 12.5 }}
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Page précédente"
        >
          Précédent
        </button>
        <span aria-live="polite" style={{ fontSize: 12.5, color: "#0f172a", fontWeight: 600 }}>
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: "6px 12px", fontSize: 12.5 }}
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Page suivante"
        >
          Suivant
        </button>
      </div>
    </nav>
  );
}
