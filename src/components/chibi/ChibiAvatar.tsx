// src/components/chibi/ChibiAvatar.tsx
"use client";

import { useEffect, useState } from "react";
import type { ChibiEmotion } from "./chibi-emotions";

interface ChibiAvatarProps {
  /** Émotion actuelle du personnage Chibi */
  emotion?: ChibiEmotion;
  /** Taille du canvas en pixels */
  size?: number;
}

/**
 * Avatar Prof Chibi — animation Rive si /public/rive/chibi.riv existe,
 * fallback CSS animé sinon (emoji + halo qui pulse selon l'émotion).
 *
 * Pour activer Rive : déposer le fichier `chibi.riv` dans `public/rive/`.
 * Le composant le détecte automatiquement (fetch HEAD) et bascule sur
 * le rendu Rive sans recharger la page. En cas d'absence du fichier,
 * le fallback emoji reste — l'app fonctionne, juste sans animation Rive.
 */

const RIVE_FILE = "/rive/chibi.riv";

/** Mapping émotion → emoji + halo Tailwind. */
const EMOTION_STYLES: Record<
  ChibiEmotion,
  { emoji: string; halo: string; animation: string }
> = {
  happy: {
    emoji: "🎓",
    halo: "bg-amber-200",
    animation: "animate-pulse-slow",
  },
  thinking: {
    emoji: "🤔",
    halo: "bg-sky-200",
    animation: "animate-think",
  },
  sad: {
    emoji: "😔",
    halo: "bg-gray-200",
    animation: "animate-pulse-slow",
  },
  excited: {
    emoji: "🤩",
    halo: "bg-pink-200",
    animation: "animate-bounce-soft",
  },
};

export default function ChibiAvatar({
  emotion = "happy",
  size = 120,
}: ChibiAvatarProps) {
  const [riveAvailable, setRiveAvailable] = useState(false);

  // Détecte la présence du fichier Rive (HEAD request, mis en cache par le SW)
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(RIVE_FILE, { method: "HEAD" });
        if (!cancelled && res.ok) setRiveAvailable(true);
      } catch {
        // Pas de Rive — on garde le fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const style = EMOTION_STYLES[emotion] ?? EMOTION_STYLES.happy;

  // Si Rive est dispo, on fait un import dynamique léger côté client
  if (riveAvailable) {
    return <RiveChibi emotion={emotion} size={size} />;
  }

  // Fallback CSS animé
  return (
    <div
      className={`relative flex items-center justify-center rounded-full ${style.halo} ${style.animation}`}
      style={{ width: size, height: size }}
      aria-label={`Prof Chibi — émotion : ${emotion}`}
      role="img"
    >
      <span
        className="select-none"
        style={{ fontSize: size * 0.5 }}
        aria-hidden
      >
        {style.emoji}
      </span>
    </div>
  );
}

/**
 * Wrapper Rive — chargé uniquement si le fichier .riv existe.
 * Import dynamique pour éviter d'embarquer @rive-app/react-canvas
 * dans le bundle initial quand l'asset n'est pas présent.
 */
function RiveChibi({
  emotion,
  size,
}: {
  emotion: ChibiEmotion;
  size: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [RiveComponent, setRiveComponent] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@rive-app/react-canvas").then((mod) => {
      if (!cancelled) setRiveComponent(() => mod.default ?? mod.Rive);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!RiveComponent) {
    return (
      <div
        className="rounded-full bg-amber-100"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className="overflow-hidden rounded-full"
      style={{ width: size, height: size }}
      aria-label={`Prof Chibi — émotion : ${emotion}`}
      role="img"
    >
      <RiveComponent
        src={RIVE_FILE}
        stateMachines="emotions"
        artboard="Chibi"
        // Le fichier .riv doit déclarer une input "emotion" (string)
        // pour que les changements d'humeur soient pilotables.
      />
    </div>
  );
}
