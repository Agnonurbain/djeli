// src/components/ui/Modal.tsx
"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  /** Contrôle la visibilité de la modale */
  isOpen: boolean;
  /** Callback pour fermer la modale */
  onClose: () => void;
  /** Contenu affiché dans la modale */
  children: ReactNode;
}

/**
 * Modale avec overlay sombre.
 * Se ferme au clic sur l'overlay ou en appuyant sur Échap.
 */
export default function Modal({ isOpen, onClose, children }: ModalProps) {
  // Fermeture au clavier (Échap)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Empêcher le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay sombre */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Contenu de la modale */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-gray-800 p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-200"
          aria-label="Fermer"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
