// src/components/exercices/QCM.tsx
"use client";

import { useState } from "react";

interface QCMOption {
  id: string;
  label: string;
}

interface QCMProps {
  /** Énoncé de la question */
  question: string;
  /** Liste des choix possibles */
  options: QCMOption[];
  /** Callback déclenché quand l'élève valide sa réponse */
  onAnswer?: (selectedId: string) => void;
}

/**
 * Composant Question à Choix Multiples (QCM).
 * L'élève sélectionne une réponse parmi les options proposées.
 */
export default function QCM({ question, options, onAnswer }: QCMProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedId && onAnswer) {
      onAnswer(selectedId);
    }
  };

  return (
    <div className="my-4 rounded-xl bg-gray-800 p-5">
      <p className="mb-4 text-base font-medium text-white">{question}</p>
      <ul className="space-y-2">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => setSelectedId(option.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                selectedId === option.id
                  ? "border-amber-400 bg-amber-400/10 text-amber-300"
                  : "border-gray-600 bg-gray-700 text-gray-200 hover:border-gray-400"
              }`}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedId}
        className="mt-4 rounded-lg bg-amber-500 px-6 py-2 text-sm font-semibold text-gray-900 transition-opacity disabled:opacity-40"
      >
        Valider
      </button>
    </div>
  );
}
