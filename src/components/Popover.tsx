import { useEffect, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose(): void;
  /** Nombre del diálogo para lectores de pantalla. */
  label: string;
  /** Alineado al borde izquierdo o derecho de la pantalla. */
  anchor: "start" | "end";
  children: ReactNode;
}

/**
 * Panel pequeño por encima de la lección. Se cierra tocando fuera, con su botón o con Escape;
 * no captura las teclas de nota del teclado del ordenador.
 */
export function Popover({ open, onClose, label, anchor, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="popover-backdrop" onPointerDown={onClose} />
      <div className={`popover ${anchor}`} role="dialog" aria-label={label}>
        <button type="button" className="popover-close" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </>
  );
}
