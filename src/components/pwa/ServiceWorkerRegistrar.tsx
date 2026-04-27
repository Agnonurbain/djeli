// src/components/pwa/ServiceWorkerRegistrar.tsx
"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/offline/register-sw";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return null;
}
