// src/components/tableau/CodeBlock.tsx

interface CodeBlockProps {
  /** Code source à afficher */
  code: string;
  /** Langage pour la coloration syntaxique */
  language: string;
}

/**
 * Bloc de code avec coloration syntaxique.
 *
 * TODO: Intégrer une bibliothèque légère de syntax highlighting
 * (ex: highlight.js ou Shiki) pour coloriser le code selon le langage.
 */
export default function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="my-4 rounded-lg bg-gray-950 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {language}
        </span>
        {/* TODO: Bouton copier le code */}
      </div>
      <pre className="overflow-x-auto text-sm leading-relaxed text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
