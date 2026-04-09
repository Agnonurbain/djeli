// src/components/tableau/MessageBubble.tsx

interface MessageBubbleProps {
  /** Contenu du message */
  content: string;
  /** true si le message vient de l'IA (Prof Chibi), false si c'est l'élève */
  isAi: boolean;
}

/**
 * Bulle de message dans la conversation pédagogique.
 * Style différent selon que le message vient de l'IA ou de l'élève.
 */
export default function MessageBubble({ content, isAi }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${isAi ? "justify-start" : "justify-end"} mb-3`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAi
            ? "rounded-tl-none bg-amber-50 text-gray-900"
            : "rounded-tr-none bg-blue-600 text-white"
        }`}
      >
        {isAi && (
          <span className="mb-1 block text-xs font-semibold text-amber-700">
            Prof Chibi
          </span>
        )}
        <p>{content}</p>
      </div>
    </div>
  );
}
