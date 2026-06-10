import { Children, cloneElement, isValidElement, useId } from "react";

/**
 * Champ de formulaire : label lié au champ (htmlFor/id) et affichage d'erreur.
 * Quand `error` est défini : bordure rouge sur le champ + message sous le champ.
 */
export default function Field({ label, error, children }) {
  const autoId = useId();
  const kids = Children.toArray(children);
  const decorated = kids.map((child, i) => {
    if (i !== 0 || !isValidElement(child)) return child;
    return cloneElement(child, {
      id: child.props.id || autoId,
      "aria-invalid": error ? true : undefined,
      style: error ? { ...child.props.style, borderColor: "#dc2626" } : child.props.style,
    });
  });

  return (
    <div>
      <label htmlFor={autoId} style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
      {decorated}
      {error && <p style={{ fontSize: 11.5, color: "#dc2626", marginTop: 4 }}>{error}</p>}
    </div>
  );
}
