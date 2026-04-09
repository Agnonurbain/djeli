// src/components/exercices/TextInput.tsx
"use client";

import { useState } from "react";

interface TextInputProps {
  /** Consigne affichée au-dessus du champ de saisie */
  prompt: string;
  /** Texte placeholder dans le champ */
  placeholder?: string;
  /** Callback déclenché quand l'élève soumet sa réponse */
  onAnswer?: (answer: string) => void;
}

/**
 * Champ de saisie libre pour réponses textuelles.
 * Utilisé pour les questions ouvertes, dissertations courtes, etc.
 */
export default function TextInput({
  prompt,
  placeholder = "Écris ta réponse ici...",
  onAnswer,
}: TextInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim() && onAnswer) {
      onAnswer(value.trim());
    }
  };

  return (
    <div className="my-4 rounded-xl bg-gray-800 p-5">
      <p className="mb-3 text-base font-medium text-white">{prompt}</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-y rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-400 focus:border-amber-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="mt-3 rounded-lg bg-amber-500 px-6 py-2 text-sm font-semibold text-gray-900 transition-opacity disabled:opacity-40"
      >
        Envoyer
      </button>
    </div>
  );
}
