# Research: App instalable y uso sin conexión

Fecha: 2026-11-18. Resuelve las incógnitas del contexto técnico de [plan.md](plan.md).

## R1. Cómo generar el service worker y la lista de archivos a guardar

- **Decision**: `vite-plugin-pwa` **2.0.0** como **devDependency**, en modo `generateSW`
  (Workbox), con `registerType: "prompt"` e `injectRegister: false`. El registro y el aviso de
  actualización se escriben a mano en `src/pwa/` con la API estándar
  (`navigator.serviceWorker.register`, `registration.waiting`, `postMessage({ type: "SKIP_WAITING" })`),
  sin importar `virtual:pwa-register` (que metería `workbox-window` en el bundle).
- **Rationale**: los archivos de Vite llevan hash en el nombre y cambian en cada build; el plugin
  genera en el build la lista de precarga con revisiones, el `manifest.webmanifest` y un service
  worker probado (precarga atómica, borrado de cachés antiguas, respuesta a navegaciones). No va
  al bundle de la app: no es dependencia de producción (Principio V). Compatible con Vite 5
  (`peerDependencies: vite ^3.1 … ^8`), Node ≥ 20.19 (CI usa Node 22). Publicada el 2026-10-03.
- **Alternatives considered**:
  - *Service worker escrito a mano + plugin propio en `vite.config.ts`* que liste el bundle:
    cero dependencias, pero hay que reimplementar revisiones, instalación atómica, limpieza y
    casos borde (≈150 líneas con riesgo de dejar a alumnos en una versión rota sin conexión).
  - *`virtual:pwa-register`*: más cómodo, pero añade `workbox-window` al código de producción
    para algo que son ~30 líneas.
  - *vite-plugin-pwa 1.3.0*: también válida; se elige 2.0.0 por ser la actual y estable.

## R2. Qué se guarda para usar sin conexión

- **Decision**: precarga completa en la instalación del service worker:
  `**/*.{js,css,html,woff2,mp3,png,svg,webmanifest}` (incluye las 30 muestras de piano, las
  fuentes, los iconos y `LICENSE.txt` vía `includeAssets`). `maximumFileSizeToCacheInBytes`
  por defecto (2 MiB) basta: cada muestra pesa < 150 KB. Total estimado ≈ 3 MB.
- **Rationale**: FR-002 pide todo el repertorio y el sonido sin descargas parciales. El
  repertorio va dentro del JS (`src/music/songs.ts`), así que basta con el bundle. Precargarlo
  todo hace que «lista sin conexión» sea un único momento observable (FR-007).
- **Interacción con `src/audio/piano.ts`**: se mantiene su caché propia (`tecla-piano-v1`) sin
  cambios. Con service worker, sus `fetch` se sirven desde la precarga; sin él (navegadores sin
  soporte), sigue funcionando como hoy. Coste: ~2 MB duplicados; dentro del límite de SC-004
  (≤ 10 MB). Quitarla se descarta porque tocaría código de audio que funciona y es la reserva en
  navegadores sin service worker.
- **Alternatives considered**: caché bajo demanda (runtime caching) de las muestras: rompe
  «sin conexión» si el alumno nunca llegó a cargar el piano en la primera visita.

## R3. Navegación sin conexión con rutas por hash

- **Decision**: `navigateFallback: "index.html"`; `start_url: "./"` y `scope: "./"` en el
  manifiesto. No hay rutas de servidor: `#leccion/<id>` siempre pide `index.html`.
- **Rationale**: con rutas por hash el navegador solo navega a `index.html`; los enlaces
  directos a lecciones funcionan sin conexión (FR-003) sin lógica extra. Rutas relativas para
  que funcione en `https://usuario.github.io/Tecla/` y en local (`base: "./"`).

## R4. Fuentes sin conexión

- **Decision**: alojar en el propio sitio las tres familias (Bricolage Grotesque, Figtree,
  Noto Music; todas SIL OFL 1.1) como `woff2`, subconjunto latino, en `public/fonts/` con
  `@font-face` en `src/styles.css` y `font-display: swap`. Se descargan una vez con un script
  de desarrollo (`scripts/fetch-fonts.mjs`, como `prepare-piano.mjs`) y se versionan en git
  junto con su `OFL.txt`. Se eliminan los `<link>` a Google Fonts de `index.html`.
- **Rationale**: FR-012 (nada roto sin conexión) y, de paso, deja de enviarse una petición a un
  tercero en cada visita (Principio V). Las pilas de reserva actuales (`system-ui`,
  `Segoe UI Symbol`, `Apple Symbols`) se mantienen por si falla la carga.
- **Alternatives considered**: paquetes `@fontsource/*` (dependencias de producción para tres
  archivos estáticos); caché en tiempo de ejecución de Google Fonts (sigue dependiendo de un
  tercero y la primera visita sin ellas dejaría la notación sin fuente).

## R5. Iconos e identidad de la app instalada

- **Decision**: un icono fuente `public/icon.svg` (tecla de piano estilizada sobre el azul de
  marca `#3A4EDF`) y PNG generados una vez con `@vite-pwa/assets-generator` 2.0.0
  (devDependency, preset `minimal-2023`): `pwa-64x64.png`, `pwa-192x192.png`,
  `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`.
  Se generan con `npm run icons` y se versionan; el build no los regenera.
- Manifiesto: `name: "Tecla · aprende piano"`, `short_name: "Tecla"`, `lang: "es"`,
  `display: "standalone"`, `orientation: "any"` (la app ya pide girar en vertical; forzar
  `landscape` impediría leer Inicio/Ajustes en vertical), `theme_color: "#3A4EDF"`,
  `background_color` = fondo claro de `styles.css`.
- iOS: `<link rel="apple-touch-icon">`, `<meta name="apple-mobile-web-app-capable">` y
  `apple-mobile-web-app-title` en `index.html`.

## R6. Ofrecer la instalación (FR-008)

- **Decision**: módulo `src/pwa/install.ts` que captura `beforeinstallprompt` lo antes posible
  (importado desde `main.tsx`, antes de montar React) y expone el estado con suscripción, igual
  que `state/store.ts`. La decisión de qué mostrar es una función pura
  `installOption(env) → "button" | "ios-instructions" | "unsupported" | "installed"`, probada en
  Vitest.
  - `installed`: `matchMedia("(display-mode: standalone)")` o `navigator.standalone` (iOS).
  - `button`: hay un `beforeinstallprompt` guardado (Chrome/Edge escritorio y Android).
  - `ios-instructions`: iPhone/iPad en Safari (incluye iPadOS que se presenta como Mac con
    pantalla táctil): «Pulsa Compartir y luego “Añadir a pantalla de inicio”».
  - `unsupported`: resto (Firefox escritorio): se indica que puede usarse sin conexión igual.
- **Rationale**: Chrome dispara el evento antes de que exista la pantalla de Ajustes; si no se
  guarda al arrancar se pierde. La función pura aísla la parte con lógica para testearla.

## R7. Aviso de «lista sin conexión», estado de conexión y actualizaciones

- **Decision**: módulo `src/pwa/sw.ts` que registra `./sw.js` tras `load` y publica un estado
  `PwaStatus` (ver [data-model.md](data-model.md)). Un único componente `src/components/PwaToast.tsx`
  montado en `App.tsx` muestra:
  - «Tecla ya funciona sin conexión» una vez, cuando el primer service worker queda activo y no
    había ninguno controlando la página (primera preparación). Se recuerda en `localStorage`
    (`tecla-offline-ready`) para no repetirlo.
  - «Hay una versión nueva · Actualizar» cuando hay un service worker en espera. «Actualizar»
    envía `SKIP_WAITING` y recarga en `controllerchange`. Nunca se recarga sin pulsar
    (FR-010); si no se pulsa, el navegador aplica la versión al cerrar todas las pestañas.
  - En la pantalla de lección (`route.name === "lesson"`) el aviso de actualización se pospone
    hasta salir de ella, para no distraer durante la práctica (SC-007).
- Indicador «Sin conexión»: chip discreto en `TopBar` cuando `navigator.onLine === false`
  (eventos `online`/`offline`). Es orientativo; la app no depende de él.
- Comprobación de versión nueva: el navegador la hace al abrir; además `registration.update()`
  al volver a primer plano (`visibilitychange`) como mucho cada hora, para apps instaladas que
  se quedan abiertas días.
- **Rationale**: cumple FR-007, FR-009, FR-010 y FR-011 con la API estándar; los fallos de
  registro o de precarga solo se registran con `console.warn` y la app sigue como antes.
- **Desarrollo**: el service worker solo se registra en el build (`import.meta.env.PROD`), para
  que `npm run dev` no sirva versiones viejas. Se prueba con `npm run build && npm run preview`.

## R8. MIDI en la app instalada

- **Decision**: sin cambios. Web MIDI funciona en apps instaladas de Chrome/Edge (mismo origen y
  permisos). Requiere `https` o `localhost`, que ya cumplen GitHub Pages y `vite preview`.
- **Rationale**: Principio III se mantiene; donde no hay MIDI se informa como hoy.

## R9. GitHub Pages y caché HTTP

- **Decision**: sin cambios en el despliegue. `sw.js` se sirve con `Cache-Control: max-age=600`
  en Pages; los navegadores ignoran la caché HTTP para el script del service worker cuando
  comprueban actualizaciones (`updateViaCache: "none"` por defecto para el script principal),
  así que una versión nueva se detecta en la siguiente apertura con conexión (SC-006).
