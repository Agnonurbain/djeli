// src/components/chibi/ChibiAvatar.tsx
"use client";

import { useRef } from "react";
import type { ChibiEmotion } from "./chibi-emotions";

interface ChibiAvatarProps {
  /** Émotion actuelle du personnage Chibi */
  emotion?: ChibiEmotion;
  /** Taille du canvas en pixels */
  size?: number;
}

/**
 * Wrapper pour le canvas Rive affichant l'avatar Prof Chibi.
 *
 * TODO: Intégrer @rive-app/react-canvas pour piloter les animations
 * Rive selon l'état émotionnel de l'avatar. Le fichier .riv sera
 * chargé depuis /public/rive/chibi.riv.
 */
export default function ChibiAvatar({
  emotion = "happy",
  size = 120,
}: ChibiAvatarProps) {
  // Ref pour le conteneur Rive — sera branché sur le canvas Rive
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center rounded-full bg-amber-100"
      style={{ width: size, height: size }}
      aria-label={`Prof Chibi — émotion : ${emotion}`}
    >
      {/* Placeholder — remplacer par <RiveComponent /> une fois Rive intégré */}
      <span className="text-4xl select-none" role="img" aria-hidden>
        🎓
      </span>
    </div>
  );
}
