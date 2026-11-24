import { useEffect, useId, useRef, type ReactNode } from "react";

interface Props {
  title: string;
  /** Escape y tocar fuera; si falta, el diálogo no se puede cerrar así (p. ej., mientras guarda). */
  onCancel?(): void;
  children: ReactNode;
  /** Botones al pie, de menos a más importante. */
  actions: ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo modal centrado. Al abrir pone el foco en el título; Tab no sale del diálogo y, al
 * cerrar, el foco vuelve a donde estaba. En móvil apaisado se desplaza por dentro (FR-018).
 */
export function Dialog({ title, onCancel, children, actions }: Props) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const cancel = useRef(onCancel);
  cancel.current = onCancel;

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && cancel.current) {
        e.preventDefault();
        cancel.current();
      } else if (e.key === "Tab" && box.current) {
        const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (before?.isConnected) before.focus();
    };
  }, []);

  // el foco vuelve al título cuando cambia (otro paso del mismo diálogo)
  useEffect(() => heading.current?.focus(), [title]);

  return (
    <div className="dialog-backdrop" onPointerDown={(e) => e.target === e.currentTarget && cancel.current?.()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={id} ref={box}>
        <h2 id={id} tabIndex={-1} ref={heading}>
          {title}
        </h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
  );
}
