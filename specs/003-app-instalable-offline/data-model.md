# Data Model: App instalable y uso sin conexión

No hay datos nuevos del alumno. Las entidades son estados del navegador y archivos estáticos.

## Copia de la app en el dispositivo (precarga del service worker)

| Campo | Descripción |
|-------|-------------|
| Lista de archivos | Bundle JS/CSS, `index.html`, fuentes, iconos, 30 muestras de piano, manifiesto. Generada en el build con su revisión (hash). |
| Versión | Implícita en la lista: cualquier cambio de archivo produce un service worker distinto. |
| Ubicación | Cache Storage gestionado por Workbox (`workbox-precache-v2-…`). |

Reglas:
- Se instala entera o no se instala (precarga atómica): nunca queda una copia a medias activa.
- Al activar una versión nueva se borran las entradas de la anterior.
- Tamaño ≤ 10 MB (SC-004); estimado ≈ 3 MB.

## Estado PWA (`src/pwa/sw.ts`, en memoria)

```ts
type PwaStatus = {
  offlineReady: boolean;     // hay un service worker activo con la precarga completa
  updateWaiting: boolean;    // hay una versión nueva instalada esperando
  online: boolean;           // navigator.onLine
};
```

Transiciones del service worker (las impone el navegador):

```text
(sin SW) ──registro──▶ installing ──precarga OK──▶ activo  → offlineReady = true
                            └──precarga falla──▶ descartado (la app sigue con red, sin aviso)
activo + versión nueva ──▶ installing ──OK──▶ waiting      → updateWaiting = true
waiting ──«Actualizar» (SKIP_WAITING)──▶ activo ──controllerchange──▶ recarga
waiting ──todas las pestañas cerradas──▶ activo (en la siguiente apertura)
```

## Opción de instalación (`src/pwa/install.ts`)

```ts
type InstallOption = "installed" | "button" | "ios-instructions" | "unsupported";

interface InstallEnv {
  standalone: boolean;          // display-mode: standalone o navigator.standalone
  hasPrompt: boolean;           // se capturó beforeinstallprompt
  isIOS: boolean;               // iPhone/iPad (incl. iPadOS que se identifica como Mac táctil)
}
```

Prioridad: `installed` > `button` > `ios-instructions` > `unsupported`. Tras usar el
`beforeinstallprompt` (aceptado o rechazado) se descarta y deja de haber botón; el evento
`appinstalled` pasa a `installed`.

## Preferencias locales nuevas (`localStorage`)

| Clave | Valor | Uso |
|-------|-------|-----|
| `tecla-offline-ready` | `true` | El aviso «ya funciona sin conexión» se ha mostrado; no repetirlo. |

Ajustes (`tecla-settings`) y progreso (`tecla-best`) no cambian y no los toca el service worker,
así que sobreviven a cualquier actualización (FR-004, FR-009).

## Identidad de la app instalada (`manifest.webmanifest`)

| Campo | Valor |
|-------|-------|
| `name` / `short_name` | «Tecla · aprende piano» / «Tecla» |
| `lang` | `es` |
| `start_url` / `scope` | `./` / `./` |
| `display` | `standalone` |
| `orientation` | `any` |
| `theme_color` | `#3A4EDF` |
| `background_color` | fondo claro de la app (`--bg` de `styles.css`) |
| `icons` | 64, 192, 512 y 512 *maskable* (PNG) |
