import { useState, useRef, useEffect } from "react";

export default function SearchSelect({ value, onChange, options, placeholder = "-- Sélectionner --", renderOption }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));
  const q = query.toLowerCase();
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q) || (o.sub || "").toLowerCase().includes(q)) : options;

  const handleSelect = (opt) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        className="input"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, minHeight: 38 }}
      >
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={selected ? selected.label : placeholder}
            onClick={e => e.stopPropagation()}
            style={{ border: "none", outline: "none", flex: 1, fontSize: "inherit", fontFamily: "inherit", background: "transparent", padding: 0, minWidth: 0 }}
          />
        ) : (
          <span style={{ flex: 1, color: selected ? "#0f172a" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected ? selected.label : placeholder}
          </span>
        )}
        {selected && (
          <span onClick={handleClear} style={{ cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1, flexShrink: 0 }} title="Effacer">&times;</span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1000,
          background: "white", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          border: "1px solid #e2e8f0", maxHeight: 220, overflowY: "auto",
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: "12px 14px", fontSize: 12.5, color: "#94a3b8", textAlign: "center" }}>Aucun résultat</div>
          )}
          {filtered.map(opt => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt)}
              style={{
                padding: "8px 12px", cursor: "pointer", fontSize: 13,
                background: String(opt.value) === String(value) ? "#eff6ff" : "transparent",
                borderBottom: "1px solid #f8fafc",
              }}
              onMouseEnter={e => { if (String(opt.value) !== String(value)) e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={e => { if (String(opt.value) !== String(value)) e.currentTarget.style.background = "transparent"; }}
            >
              {renderOption ? renderOption(opt) : (
                <>
                  <div style={{ fontWeight: 500, color: "#0f172a" }}>{opt.label}</div>
                  {opt.sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{opt.sub}</div>}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
