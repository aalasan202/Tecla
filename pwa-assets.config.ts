import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// Genera los iconos PNG y favicon.ico a partir de public/icon.svg: `npm run icons`.
// Se versionan en git; el build no los regenera.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // el SVG ya trae su fondo azul a sangre: sin márgenes ni fondo añadido
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: "#3a4edf" } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: "#3a4edf" } },
  },
  images: ["public/icon.svg"],
});
