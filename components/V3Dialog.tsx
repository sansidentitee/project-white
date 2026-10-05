"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function V3Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) {
      ref.current?.showModal();
      const field = ref.current?.querySelector<HTMLElement>("[autofocus]") ||
        ref.current?.querySelector<HTMLElement>("input, textarea, select");
      field?.focus();
    }
    else if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className="v3-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="panel-head">
        <h2>{title}</h2>
        <button className="neo-pill" aria-label="Fermer" onClick={onClose}>
          ×
        </button>
      </div>
      {open && children}
    </dialog>
  );
}
