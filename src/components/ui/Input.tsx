// src/components/ui/Input.tsx

import { type InputHTMLAttributes, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Libellé affiché au-dessus du champ */
  label?: string;
  /** Message d'erreur affiché sous le champ */
  error?: string;
}

/**
 * Champ de saisie réutilisable avec label et message d'erreur.
 * Étend les attributs HTML natifs de l'input.
 */
export default function Input({
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = props.id ?? generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-gray-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-600 focus:ring-amber-500"
        } ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
