// src/components/exercices/CalculInput.tsx
"use client";

import { useState } from "react";

interface CalculInputProps {
  /** Énoncé du calcul à résoudre */
  prompt: string;
  /** Unité de mesure affichée après le champ (ex: "cm", "FCFA", "kg") */
  unit?: string;
  /** Callback déclenché quand l'élève soumet sa réponse numérique */
  onAnswer?: (value: number) => void;
}

/**
 * Champ de saisie numérique pour les exercices de calcul.
 * Affiche un clavier numérique sur mobile (inputMode="decimal").
 */
export default function CalculInput({
  prompt,
  unit,
  onAnswer,
}: CalculInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && onAnswer) {
      onAnswer(parsed);
    }
  };

  return (
    <div className="my-4 rounded-xl bg-gray-800 p-5">
      <p className="mb-3 text-base font-medium text-white">{prompt}</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0"
          className="w-32 rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-center text-lg font-mono text-gray-100 focus:border-amber-400 focus:outline-none"
        />
        {unit && (
          <span className="text-sm text-gray-400">{unit}</span>
        )}
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim() || isNaN(parseFloat(value))}
        className="mt-4 rounded-lg bg-amber-500 px-6 py-2 text-sm font-semibold text-gray-900 transition-opacity disabled:opacity-40"
      >
        Valider
      </button>
    </div>
  );
}
