// src/components/audio/BulleConcentration.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BulleConcentrationProps {
  /** Chemin vers le fichier audio (relatif à /public). Par défaut /audio/lofi/track.mp3 */
  src?: string;
  /** Volume initial entre 0 et 1 (par défaut 0.4 — volume doux pour fond sonore) */
  initialVolume?: number;
  /** Durée du fondu in/out en ms (par défaut 800) */
  fadeMs?: number;
}

const DEFAULT_SRC = "/audio/lofi/track.mp3";

/**
 * Lecteur audio ambiant Lo-Fi — « Bulle de concentration ».
 *
 * Comportement :
 *   - Tente de charger /audio/lofi/track.mp3 (modifiable via prop `src`)
 *   - Si le fichier est absent : affiche un état désactivé avec tooltip explicite
 *   - Lecture en boucle, fondu in/out pour ne pas brusquer
 *   - Slider de volume conservé en mémoire (state local — pas de localStorage)
 */
export default function BulleConcentration({
  src = DEFAULT_SRC,
  initialVolume = 0.4,
  fadeMs = 800,
}: BulleConcentrationProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [available, setAvailable] = useState<boolean | null>(null); // null = checking
  const [showVolume, setShowVolume] = useState(false);

  // Vérifier que le fichier existe (HEAD request)
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(src, { method: "HEAD" });
        if (!cancelled) setAvailable(res.ok);
      } catch {
        if (!cancelled) setAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Cleanup au démontage : couper le son et le fondu en cours
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (audio) {
        audio.pause();
        audio.volume = 0;
      }
    };
  }, []);

  /** Fondu progressif vers une valeur cible. */
  const fadeTo = useCallback(
    (target: number, onComplete?: () => void) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

      const steps = 20;
      const stepMs = fadeMs / steps;
      const start = audio.volume;
      const delta = (target - start) / steps;
      let i = 0;

      fadeIntervalRef.current = setInterval(() => {
        i += 1;
        const next = Math.max(0, Math.min(1, start + delta * i));
        if (audioRef.current) audioRef.current.volume = next;
        if (i >= steps) {
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
          onComplete?.();
        }
      }, stepMs);
    },
    [fadeMs]
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !available) return;

    if (isPlaying) {
      // Fade out puis pause
      fadeTo(0, () => {
        audio.pause();
      });
      setIsPlaying(false);
    } else {
      try {
        audio.volume = 0;
        await audio.play();
        fadeTo(volume);
        setIsPlaying(true);
      } catch {
        // Autoplay refusé — l'utilisateur doit cliquer (ce qui est notre cas)
        // ou lecteur indisponible
      }
    }
  }, [isPlaying, volume, available, fadeTo]);

  // Synchroniser le volume du slider avec l'élément audio (sans fondu)
  useEffect(() => {
    if (audioRef.current && isPlaying && fadeIntervalRef.current === null) {
      audioRef.current.volume = volume;
    }
  }, [volume, isPlaying]);

  // État "vérification" → invisible le temps du HEAD
  if (available === null) {
    return null;
  }

  // Fichier absent → état désactivé explicite
  if (available === false) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-500"
        title="Le fichier audio /audio/lofi/track.mp3 est introuvable. Ajoute-le dans /public pour activer la bulle."
      >
        <span aria-hidden>🎧</span>
        <span>Bulle de concentration (audio indisponible)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1.5">
      <button
        type="button"
        onClick={() => void togglePlay()}
        className="flex items-center gap-2 text-sm text-indigo-300 transition-colors hover:text-indigo-200"
        aria-label={isPlaying ? "Couper le son ambiant" : "Activer le son ambiant"}
        aria-pressed={isPlaying}
      >
        <span aria-hidden>{isPlaying ? "🔊" : "🔇"}</span>
        <span>Bulle de concentration</span>
      </button>

      {isPlaying && (
        <button
          type="button"
          onClick={() => setShowVolume((s) => !s)}
          className="text-xs text-indigo-300 hover:text-indigo-200"
          aria-label="Régler le volume"
        >
          ⚙
        </button>
      )}

      {isPlaying && showVolume && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-1 w-20 accent-indigo-400"
          aria-label="Volume du son ambiant"
        />
      )}

      <audio ref={audioRef} loop preload="none" src={src} />
    </div>
  );
}
