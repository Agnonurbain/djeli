// src/components/ui/Button.tsx

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Style visuel du bouton */
  variant?: ButtonVariant;
}

/** Classes Tailwind par variante */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-amber-500 text-gray-900 hover:bg-amber-400 focus-visible:ring-amber-500",
  secondary:
    "bg-gray-700 text-gray-100 hover:bg-gray-600 focus-visible:ring-gray-500",
  outline:
    "border-2 border-amber-500 text-amber-500 hover:bg-amber-500/10 focus-visible:ring-amber-500",
};

/**
 * Bouton réutilisable avec variantes visuelles.
 * Étend les attributs HTML natifs du bouton.
 */
export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
