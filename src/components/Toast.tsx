import { useEffect } from "react";
import { notice } from "../state/history";

/** Aviso breve de récord de racha u objetivo cumplido (011, FR-012, FR-020). */
export function Toast() {
  const n = notice.use();
  useEffect(() => {
    if (!n) return;
    const t = setTimeout(() => notice.clear(), 4000);
    return () => clearTimeout(t);
  }, [n]);
  if (!n) return null;
  return (
    <div className="toast toast-top" role="status" aria-live="polite">
      <span aria-hidden="true">{n.kind === "record" ? "🔥" : "🎯"}</span>
      <span>{n.text}</span>
      <button type="button" className="toast-close" aria-label="Cerrar" onClick={() => notice.clear()}>
        ×
      </button>
    </div>
  );
}
