// src/components/ui/Toast.tsx
"use client";

import { useEffect } from "react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  /** Message à afficher */
  message: string;
  /** Type visuel de la notification */
  type?: ToastType;
  /** Callback pour fermer le toast */
  onClose?: () => void;
  /** Durée d'affichage en ms avant fermeture automatique */
  duration?: number;
}

/** Styles Tailwind par type de toast */
const typeStyles: Record<ToastType, string> = {
  success: "border-green-500 bg-green-500/10 text-green-300",
  error: "border-red-500 bg-red-500/10 text-red-300",
  info: "border-blue-500 bg-blue-500/10 text-blue-300",
};

/**
 * Notification toast éphémère.
 * S'affiche brièvement puis disparaît automatiquement.
 */
export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 4000,
}: ToastProps) {
  // Fermeture automatique après la durée spécifiée
  useEffect(() => {
    if (!onClose) return;

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-5 py-3 text-sm shadow-lg ${typeStyles[type]}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span>{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 opacity-60 transition-opacity hover:opacity-100"
            aria-label="Fermer la notification"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
