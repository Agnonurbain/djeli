// src/components/exercices/PhotoCapture.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PhotoCaptureProps {
  /** Consigne affichée au-dessus du bouton de capture */
  prompt?: string;
  /** Callback avec l'image capturée (data URL JPEG) pour traitement OCR/Vision */
  onCapture?: (imageData: string) => void;
  /** Qualité JPEG entre 0 et 1 (par défaut 0.7 — 3G ivoirien instable) */
  quality?: number;
  /** Largeur max en pixels avant compression (par défaut 1280) */
  maxWidth?: number;
}

/**
 * Capture photo pour les brouillons manuscrits.
 *
 * Implémentation :
 *   - Accès caméra arrière (facingMode: "environment") via getUserMedia
 *   - Snapshot dans un <canvas> hors-DOM
 *   - Export JPEG compressé (qualité 0.7 par défaut, redimensionné à maxWidth)
 *   - Le flux est arrêté dès la capture pour libérer la caméra
 *
 * Conformité CLAUDE.md : aucune persistance disque — tout reste en mémoire.
 */
export default function PhotoCapture({
  prompt = "Prends en photo ton travail",
  onCapture,
  quality = 0.7,
  maxWidth = 1280,
}: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  /** Coupe le flux vidéo et libère la caméra. */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Sécurité : libérer la caméra si le composant est démonté
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    setPreview(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Ton navigateur ne supporte pas la caméra.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      // Messages d'erreur fréquents : NotAllowedError (refusé), NotFoundError (pas de caméra)
      if (msg.includes("NotAllowed") || msg.includes("Permission")) {
        setError(
          "Accès à la caméra refusé. Autorise-le dans les paramètres du navigateur."
        );
      } else if (msg.includes("NotFound")) {
        setError("Aucune caméra détectée sur cet appareil.");
      } else {
        setError(`Impossible d'ouvrir la caméra : ${msg}`);
      }
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setError("Le flux vidéo n'est pas prêt — réessaie.");
      return;
    }

    // Redimensionner si la vidéo est plus large que maxWidth
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Impossible de préparer le canvas pour la capture.");
      return;
    }

    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);

    setPreview(dataUrl);
    stopCamera();
    onCapture?.(dataUrl);
  }, [maxWidth, quality, onCapture, stopCamera]);

  const retake = useCallback(() => {
    setPreview(null);
    void startCamera();
  }, [startCamera]);

  return (
    <div className="my-4 rounded-xl bg-gray-800 p-5">
      <p className="mb-3 text-base font-medium text-white">{prompt}</p>

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-md border border-red-300 bg-red-50/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      {preview && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Capture du brouillon"
            className="aspect-[4/3] w-full rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={retake}
            className="w-full rounded-lg border border-gray-500 bg-gray-700 py-2.5 text-sm font-medium text-gray-100 hover:bg-gray-600"
          >
            Reprendre la photo
          </button>
        </div>
      )}

      {!preview && isCameraActive && (
        <div className="space-y-3">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-700">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={capturePhoto}
              className="flex-1 rounded-lg bg-amber-500 py-3 text-sm font-semibold text-gray-900 hover:bg-amber-400"
            >
              📸 Capturer
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-lg border border-gray-500 bg-gray-700 px-4 py-3 text-sm font-medium text-gray-100 hover:bg-gray-600"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {!preview && !isCameraActive && (
        <button
          type="button"
          onClick={() => void startCamera()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-600 py-8 text-sm text-gray-300 transition-colors hover:border-amber-400 hover:text-amber-300"
        >
          <span aria-hidden>📷</span>
          Ouvrir la caméra
        </button>
      )}
    </div>
  );
}
