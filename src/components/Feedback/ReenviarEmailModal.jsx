import React, { useEffect } from "react";

export default function ReenviarEmailModal({
  isOpen = false,
  onClose = () => {},
  onConfirm = () => {},
  feedback = null,
  isLoading = false,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function onEsc(event) {
      if (event.key === "Escape" && !isLoading) onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, isLoading, onClose]);

  function onBackdropClick(event) {
    if (event.target === event.currentTarget && !isLoading) {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onMouseDown={onBackdropClick}
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reenviar e-mail"
        className="fh-card w-full max-w-md p-5"
      >
        <h2 className="text-xl font-extrabold text-slate-900">Reenviar e-mail</h2>
        <p className="mt-2 text-sm text-slate-600">
          Deseja reenviar notificacao para{" "}
          <strong>{feedback?.destinatario_nome || feedback?.destinatario_email}</strong>?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="fh-button-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="fh-button-primary"
          >
            {isLoading ? "Enviando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
