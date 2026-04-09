// src/hooks/useAudio.ts
'use client';

/**
 * Hook contrôle ambiance sonore Lo-Fi.
 *
 * Gère la lecture de l'ambiance sonore "Bulle de Concentration"
 * avec contrôle du volume et persistance de la préférence utilisateur.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAudioReturn {
  /** true si l'audio est en lecture */
  isPlaying: boolean;
  /** Volume actuel (0 à 1) */
  volume: number;
  /** Démarrer / reprendre la lecture */
  play: () => void;
  /** Mettre en pause */
  pause: () => void;
  /** Basculer lecture / pause */
  toggle: () => void;
  /** Modifier le volume (0 à 1) */
  setVolume: (volume: number) => void;
}

export function useAudio(src: string): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.3);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
    // Initialisation unique — le src ne doit pas changer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const play = useCallback(() => {
    void audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    setVolumeState(clamped);
  }, []);

  return { isPlaying, volume, play, pause, toggle, setVolume };
}
