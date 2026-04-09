// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisation PWA : headers de cache pour les assets statiques
  headers: async () => [
    {
      source: "/rive/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
