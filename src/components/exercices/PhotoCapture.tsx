// src/components/exercices/PhotoCapture.tsx
"use client";

import { useRef, useState } from "react";

interface PhotoCaptureProps {
  /** Consigne affichée au-dessus du bouton de capture */
  prompt?: string;
  /** Callback avec l'image capturée (base64 ou Blob) pour traitement OCR */
  onCapture?: (imageData: string) => void;
}

/**
 * Composant de capture photo pour les brouillons manuscrits.
 * Utilise navigator.mediaDevices.getUserMedia pour accéder à la caméra.
 *
 * IMPORTANT : Le traitement de l'image se fait en mémoire uniquement,
 * pas de persistance sur disque (cf. CLAUDE.md).
 *
 * TODO: Implémenter l'accès caméra via navigator.mediaDevices.getUserMedia()
 * et le canvas pour capturer le snapshot. Ajouter la compression JPEG
 * avant envoi (réseau 3G instable en CI).
 */
export default function PhotoCapture({
  prompt = "Prends en photo ton travail",
  onCapture,
}: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async () => {
    // TODO: Implémenter navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    setIsCameraActive(true);
  };

  const capturePhoto = () => {
    // TODO: Dessiner le frame vidéo sur un canvas, exporter en JPEG compressé
    if (onCapture) {
      onCapture("placeholder-base64-data");
    }
  };

  return (
    <div className="my-4 rounded-xl bg-gray-800 p-5">
      <p className="mb-3 text-base font-medium text-white">{prompt}</p>

      {isCameraActive ? (
        <div className="space-y-3">
          {/* Placeholder pour le flux vidéo de la caméra */}
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-gray-700">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-full w-full rounded-lg object-cover"
            />
          </div>
          <button
            type="button"
            onClick={capturePhoto}
            className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-gray-900"
          >
            Capturer
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-600 py-8 text-sm text-gray-300 transition-colors hover:border-amber-400 hover:text-amber-300"
        >
          <span aria-hidden>📷</span>
          Ouvrir la caméra
        </button>
      )}
    </div>
  );
}
