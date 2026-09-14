import { useState, useRef, useEffect, useId } from "react";

/**
 * Sélecteur avec recherche — pattern WAI-ARIA « combobox » :
 * ouverture au clic/focus, navigation ↑/↓, Entrée pour choisir, Échap pour
 * fermer, Retour arrière pour effacer, options annoncées aux lecteurs d'écran.
 */
export default function SearchSelect({ value, onChange, options, placeholder = "-- Sélectionner --", renderOption, id: idProp, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, style: styleProp }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const autoId = useId();
  const id = idProp || autoId;
  const listId = `${id}-listbox`;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(""); setActive(-1); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));
  const q = query.toLowerCase();
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q) || (o.sub || "").toLowerCase().includes(q)) : options;

  // Garde l'option active visible dans la liste
  useEffect(() => {
    if (!open || active < 0 || !listRef.current) return;
    const el = listRef.current.children[active];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const select = (opt) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
    setActive(-1);
    inputRef.current?.focus();
  };

  const clear = (e) => {
    if (e) e.stopPropagation();
    onChange("");
    setQuery("");
    setActive(-1);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); setActive(0); return; }
      setActive(a => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (open && active >= 0 && filtered[active]) { e.preventDefault(); select(filtered[active]); }
    } else if (e.key === "Escape") {
      if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); setQuery(""); setActive(-1); }
    } else if (e.key === "Backspace" && !query && selected) {
      clear();
    } else if (e.key === "Home" && open) {
      e.preventDefault(); setActive(0);
    } else if (e.key === "End" && open) {
      e.preventDefault(); setActive(filtered.length - 1);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", ...styleProp }}>
      <div className="input" style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 38, padding: "6px 10px 6px 14px" }} onClick={() => inputRef.current?.focus()}>
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 && filtered[active] ? `${id}-opt-${filtered[active].value}` : undefined}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          value={open ? query : (selected ? selected.label : "")}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected ? selected.label : placeholder}
          autoComplete="off"
          style={{ border: "none", outline: "none", flex: 1, fontSize: "inherit", fontFamily: "inherit", background: "transparent", padding: 0, minWidth: 0, color: "#0f172a" }}
        />
        {selected && (
          <button type="button" onClick={clear} aria-label="Effacer la sélection" title="Effacer" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 18, lineHeight: 1, padding: "0 4px", flexShrink: 0 }}>&times;</button>
        )}
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1000, listStyle: "none", margin: 0, padding: 0,
            background: "white", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            border: "1px solid #e2e8f0", maxHeight: 220, overflowY: "auto",
          }}
        >
          {filtered.length === 0 && (
            <li role="option" aria-disabled="true" aria-selected="false" style={{ padding: "12px 14px", fontSize: 12.5, color: "#64748b", textAlign: "center" }}>Aucun résultat</li>
          )}
          {filtered.map((opt, i) => {
            const isSel = String(opt.value) === String(value);
            const isActive = i === active;
            return (
              <li
                key={opt.value}
                id={`${id}-opt-${opt.value}`}
                role="option"
                aria-selected={isSel}
                onMouseDown={e => e.preventDefault()}
                onClick={() => select(opt)}
                onMouseEnter={() => setActive(i)}
                style={{
                  padding: "8px 12px", cursor: "pointer", fontSize: 13,
                  background: isSel ? "#eff6ff" : isActive ? "#f8fafc" : "transparent",
                  borderBottom: "1px solid #eef2f7",
                  outline: isActive ? "2px solid #2563eb" : "none", outlineOffset: -2,
                }}
              >
                {renderOption ? renderOption(opt) : (
                  <>
                    <div style={{ fontWeight: 500, color: "#0f172a" }}>{opt.label}</div>
                    {opt.sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{opt.sub}</div>}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
