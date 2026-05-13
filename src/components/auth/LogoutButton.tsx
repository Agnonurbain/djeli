// src/components/auth/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
  /** Style — "ghost" pour un lien discret, "outlined" pour un vrai bouton */
  variant?: "ghost" | "outlined";
  /** Texte affiché — par défaut "Se déconnecter" */
  label?: string;
}

/**
 * Bouton de déconnexion réutilisable.
 * Appelle POST /api/auth/logout puis redirige vers /login.
 */
export default function LogoutButton({
  variant = "outlined",
  label = "Se déconnecter",
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Échec silencieux — on redirige quand même vers /login
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const className =
    variant === "ghost"
      ? "text-sm text-gray-500 hover:text-gray-900 hover:underline disabled:opacity-50"
      : "rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loading}
      className={className}
    >
      {loading ? "…" : label}
    </button>
  );
}
