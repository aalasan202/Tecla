# Implementation Plan: App instalable y uso sin conexión

**Branch**: `003-app-instalable-offline` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-app-instalable-offline/spec.md`

## Summary

Convertir Tecla en una app web instalable que funciona sin conexión tras la primera visita.
`vite-plugin-pwa` (solo en desarrollo) genera en el build el manifiesto y un service worker de
Workbox que precarga todo: bundle, repertorio, las 30 muestras de piano, fuentes e iconos
(≈ 3 MB). Las fuentes pasan de Google Fonts a archivos propios. Un módulo `src/pwa/` registra el
service worker a mano, avisa cuando la app está lista sin conexión, ofrece actualizar cuando
hay versión nueva (nunca recarga sola, y no durante una lección) y muestra en Ajustes cómo
instalar según el navegador. El motor, la música y el estado no cambian. Ver
[research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5. Nuevas **devDependencies**: `vite-plugin-pwa`
2.0.0 (genera `sw.js` y manifiesto) y `@vite-pwa/assets-generator` 2.0.0 (genera los PNG de
iconos una vez). Sin dependencias de producción nuevas.

**Storage**: Cache Storage (precarga de Workbox); `localStorage` sin cambios salvo la marca
`tecla-offline-ready`. La caché `tecla-piano-v1` de `src/audio/piano.ts` se mantiene.

**Testing**: Vitest 2 (`npm test`): tests de las funciones puras de `src/pwa/install.ts`;
validación manual con `npm run build && npm run preview` según [quickstart.md](quickstart.md)

**Target Platform**: Chrome, Edge, Firefox y Safari actuales; instalación en Chrome/Edge
(escritorio y Android) y Safari iOS/iPadOS («Añadir a pantalla de inicio»)

**Project Type**: aplicación web estática (SPA) publicada en GitHub Pages

**Performance Goals**: apertura sin conexión o desde el icono < 2 s (SC-003); lista sin
conexión < 15 s la primera vez a ~10 Mbit/s (SC-004); sin efecto en la latencia de nota

**Constraints**: ≤ 10 MB guardados; sin recargas automáticas durante la práctica; funciona en
subruta de GitHub Pages (`base: "./"`); sin peticiones a terceros

**Scale/Scope**: 1 módulo nuevo (`src/pwa/`, 3 archivos + test), 1 componente de aviso, cambios
en `TopBar`, `SettingsScreen`, `App`, `main.tsx`, `index.html`, `styles.css`, `vite.config.ts`;
~10 archivos estáticos (iconos y fuentes)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Estado |
|-----------|--------------|--------|
| I. Motor separado de la interfaz | Todo vive en `src/pwa/` y en componentes; `engine/` y `music/` no se tocan ni conocen el service worker. | ✅ |
| II. Lógica musical probada | Sin cambios en `engine/`, `music/` ni `state/`. La lógica con decisiones (`installOption`, `isIOSDevice`) es pura y se prueba en `install.test.ts`. Verificación manual en escritorio y móvil apaisado (quickstart). | ✅ |
| III. Funciona sin hardware | El teclado en pantalla funciona sin conexión; el MIDI no cambia y se informa igual si no está disponible. | ✅ |
| IV. Para quien empieza, cualquier pantalla | Avisos breves en español, sin jerga («funciona sin conexión», «versión nueva»); instrucciones de instalación según el dispositivo; respetan tema claro/oscuro; la orientación sigue igual en la app instalada. | ✅ |
| V. Sencillez y datos en el dispositivo | Sin dependencias de producción: el plugin es solo de build y el registro se escribe a mano (se descartó `workbox-window`). Se elimina la petición a Google Fonts: ya no se contacta a ningún tercero. Fuentes con licencia OFL. Datos siguen en el dispositivo. | ✅ |
| Restricciones técnicas | Hosting estático, rutas por hash (sin cambios; facilitan la navegación sin conexión), mismos navegadores. | ✅ |
| Flujo de trabajo | `npm test` y `npm run build` en CI; el despliegue a Pages publica `sw.js` sin cambios en el workflow. | ✅ |

**Post-design re-check**: [data-model.md](data-model.md) y [contracts/pwa.md](contracts/pwa.md)
no añaden código de producción de terceros ni tocan el motor. La duplicación de las muestras
en dos cachés (~2 MB) es la opción más simple y queda dentro de SC-004. Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/003-app-instalable-offline/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── pwa.md           # Phase 1: API de src/pwa/, interfaz y archivos estáticos
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
src/
├── pwa/
│   ├── install.ts          # nuevo: beforeinstallprompt, installOption (puro), useInstallOption
│   ├── install.test.ts     # nuevo
│   └── sw.ts               # nuevo: registro, PwaStatus, applyUpdate, online/offline
├── components/
│   ├── PwaToast.tsx        # nuevo: «ya funciona sin conexión» / «versión nueva · Actualizar»
│   └── TopBar.tsx          # chip «Sin conexión»
├── screens/
│   └── SettingsScreen.tsx  # sección «Instalar Tecla» y estado sin conexión en «Datos»
├── App.tsx                 # monta PwaToast (con la ruta actual)
├── main.tsx                # initInstall() y registerServiceWorker()
└── styles.css              # @font-face locales; estilos del aviso

public/
├── fonts/                  # nuevo: 3 woff2 + OFL.txt
├── icon.svg                # nuevo: icono fuente
└── *.png, favicon.ico      # nuevo: iconos generados

scripts/
└── fetch-fonts.mjs         # nuevo (desarrollo): descarga los woff2 latinos una vez

index.html                  # sin Google Fonts; iconos y metas de iOS
vite.config.ts              # VitePWA({ registerType: "prompt", injectRegister: false, manifest, workbox })
pwa-assets.config.ts        # nuevo: preset de iconos (npm run icons)
package.json                # devDependencies y script "icons"
```

**Structure Decision**: aplicación única existente. La lógica del navegador para PWA se aísla
en `src/pwa/`, siguiendo el patrón de `src/audio/` y `src/midi/`; los archivos estáticos van en
`public/` para que Vite los copie y Workbox los precargue.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
