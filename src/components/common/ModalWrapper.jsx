export default function ModalWrapper({ onClose, title, children, width = 520 }) {
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>X</button>
        </div>
        {children}
      </div>
    </div>
  );
}
