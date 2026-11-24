/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// base relativa: funciona igual en https://usuario.github.io/Tecla/ que en un dominio propio
export default defineConfig({
  base: "./",
  // VexFlow con sus fuentes (≈ 720 KB) va en un chunk aparte que solo carga la lección (research R1)
  build: { chunkSizeWarningLimit: 800 },
  plugins: [
    react(),
    // solo genera sw.js y el manifiesto en el build; el registro y los avisos están en src/pwa/
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      // los iconos ya entran por globPatterns
      includeManifestIcons: false,
      // iconos generados con `npm run icons` (pwa-assets.config.ts)
      manifest: {
        name: "Tecla · aprende piano",
        short_name: "Tecla",
        description: "Tecla: aprende piano con partitura interactiva y teclado MIDI.",
        lang: "es",
        start_url: "./",
        scope: "./",
        display: "standalone",
        // la app ya pide girar el móvil en las pantallas que lo necesitan
        orientation: "any",
        theme_color: "#3A4EDF",
        background_color: "#f3f5fa",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // todo lo necesario sin conexión: bundle (incluye el repertorio), fuentes, muestras de piano,
        // iconos y licencias
        // (el plugin añade por su cuenta manifest.webmanifest)
        globPatterns: ["**/*.{js,css,html,woff2,mp3,png,svg,ico,txt}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
      },
    }),
  ],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
