# Contrato: módulo PWA

El módulo vive en `src/pwa/` (APIs del navegador, como `src/audio/` y `src/midi/`). El motor
(`src/engine/`) y la música (`src/music/`) no lo conocen (Principio I).

## `src/pwa/install.ts`

```ts
export type InstallOption = "installed" | "button" | "ios-instructions" | "unsupported";
export interface InstallEnv { standalone: boolean; hasPrompt: boolean; isIOS: boolean }

/** Puro: qué ofrecer en Ajustes. Probado en install.test.ts. */
export function installOption(env: InstallEnv): InstallOption;

/** Puro: detecta iPhone/iPad a partir de userAgent, platform y maxTouchPoints. */
export function isIOSDevice(ua: string, platform: string, maxTouchPoints: number): boolean;

/** Empieza a escuchar beforeinstallprompt y appinstalled. Se llama una vez en main.tsx. */
export function initInstall(): void;

/** Hook de React con la opción actual. */
export function useInstallOption(): InstallOption;

/** Muestra el diálogo nativo de instalación; resuelve true si se aceptó. No lanza errores. */
export function promptInstall(): Promise<boolean>;
```

## `src/pwa/sw.ts`

```ts
export interface PwaStatus { offlineReady: boolean; updateWaiting: boolean; online: boolean }

/** Registra ./sw.js en producción si hay soporte; en otro caso no hace nada. Nunca lanza. */
export function registerServiceWorker(): void;

/** Hook de React con el estado actual. */
export function usePwaStatus(): PwaStatus;

/** Activa la versión en espera y recarga cuando toma el control. Solo por acción del usuario. */
export function applyUpdate(): void;
```

## Interfaz

| Lugar | Elemento | Condición |
|-------|----------|-----------|
| `components/PwaToast.tsx` (en `App.tsx`) | «Tecla ya funciona sin conexión» (se cierra solo) | primera vez que `offlineReady` pasa a `true` |
| `components/PwaToast.tsx` | «Hay una versión nueva» + botón «Actualizar» | `updateWaiting` y la ruta no es una lección |
| `components/TopBar.tsx` | chip «Sin conexión» | `online === false` |
| `screens/SettingsScreen.tsx`, sección «Instalar Tecla» | botón «Instalar» | opción `button` |
| ídem | «En iPhone o iPad: pulsa Compartir y luego “Añadir a pantalla de inicio”.» | opción `ios-instructions` |
| ídem | «Este navegador no permite instalar apps, pero Tecla funciona sin conexión.» | opción `unsupported` |
| ídem | sección oculta | opción `installed` |
| ídem, sección «Datos» | línea «Disponible sin conexión: sí / preparando…» | según `offlineReady` |

Los textos están en español y siguen el tema claro/oscuro (Principio IV).

## Archivos generados por el build (`dist/`)

```text
sw.js                    # service worker de Workbox
workbox-*.js             # runtime de Workbox
manifest.webmanifest
```

## Archivos estáticos nuevos (`public/`)

```text
icon.svg, favicon.ico, pwa-64x64.png, pwa-192x192.png, pwa-512x512.png,
maskable-icon-512x512.png, apple-touch-icon-180x180.png
fonts/  bricolage-grotesque-latin.woff2, figtree-latin.woff2, noto-music.woff2, OFL.txt
```

## `index.html`

- Sin `<link>` a `fonts.googleapis.com`.
- `<link rel="icon">`, `<link rel="apple-touch-icon">`, `<link rel="manifest">` (lo inyecta el
  plugin), `<meta name="apple-mobile-web-app-capable" content="yes">`,
  `<meta name="apple-mobile-web-app-title" content="Tecla">`.
