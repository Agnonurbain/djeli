// src/components/audio/BulleConcentration.tsx
"use client";

import { useRef, useState } from "react";

/**
 * Lecteur audio ambiant Lo-Fi — « Bulle de concentration ».
 * Joue un fond sonore doux pour aider l'élève à se concentrer
 * pendant les sessions d'apprentissage.
 *
 * TODO: Charger les pistes audio depuis /public/audio/lofi/
 * et implémenter le contrôle de volume + boucle infinie.
 * Prévoir un fondu à l'ouverture/fermeture pour ne pas brusquer l'élève.
 */
export default function BulleConcentration() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    // TODO: Implémenter play/pause avec audioRef.current
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2">
      <button
        type="button"
        onClick={togglePlay}
        className="flex items-center gap-2 text-sm text-indigo-300 transition-colors hover:text-indigo-200"
        aria-label={isPlaying ? "Couper le son ambiant" : "Activer le son ambiant"}
      >
        <span aria-hidden>{isPlaying ? "🔊" : "🔇"}</span>
        <span>Bulle de concentration</span>
      </button>
      {/* Élément audio caché — sera connecté aux fichiers Lo-Fi */}
      <audio ref={audioRef} loop preload="none">
        {/* TODO: <source src="/audio/lofi/track.mp3" type="audio/mpeg" /> */}
      </audio>
    </div>
  );
}
