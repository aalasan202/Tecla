---

description: "Task list for App instalable y uso sin conexión"
---

# Tasks: App instalable y uso sin conexión

**Input**: Design documents from `specs/003-app-instalable-offline/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/pwa.md](contracts/pwa.md),
[quickstart.md](quickstart.md)

**Tests**: solo para las funciones puras de `src/pwa/install.ts` (`installOption`,
`isIOSDevice`; ver plan › Constitution Check, Principio II). El service worker, los avisos y la
instalación se validan a mano con [quickstart.md](quickstart.md) sobre `npm run build && npm run preview`.
Los tests se escriben antes y deben fallar primero.

**Organization**: tareas agrupadas por historia de usuario de la spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede hacerse en paralelo (otro archivo, sin dependencias pendientes)
- **[Story]**: historia de usuario de la spec (US1–US3)

## Path Conventions

Proyecto único (SPA): código en `src/`, tests junto al módulo (`*.test.ts`), entorno de Vitest
`node` (sin DOM ni service worker). Archivos estáticos en `public/` (Vite los copia tal cual y
Workbox los precarga). El service worker solo se registra en el build de producción.

---

## Phase 1: Setup (dependencias de build)

**Purpose**: instalar las herramientas de build sin añadir código de producción de terceros.

- [ ] T001 Instalar como devDependencies exactas `vite-plugin-pwa@2.0.0` y `@vite-pwa/assets-generator@2.0.0` (`npm i -D -E …`) y comprobar que `package.json` no gana entradas en `dependencies` ni aparece `workbox-window` en el bundle (research R1, R5; Principio V)
- [ ] T002 [P] Añadir a `.gitignore` (si no existe ya) `dev-dist/`, carpeta que `vite-plugin-pwa` puede crear en desarrollo

---

## Phase 2: Foundational (fuentes propias)

**Purpose**: que textos y notación no dependan de Google Fonts; sin esto ninguna historia se ve
bien sin conexión (FR-012).

**⚠️ CRITICAL**: debe completarse antes de comprobar cualquier historia sin conexión.

- [ ] T003 Crear `scripts/fetch-fonts.mjs` (Node, sin dependencias npm, mismo estilo que `scripts/prepare-piano.mjs`): pedir `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600&family=Noto+Music&display=swap` con un `User-Agent` de Chrome de escritorio (para recibir `woff2`); de la respuesta, quedarse con los bloques `@font-face` cuyo comentario de subconjunto sea `/* latin */` (las tres familias) y `/* music */` (Noto Music); descargar cada `woff2` a `public/fonts/` con nombre legible (`bricolage-grotesque-latin.woff2`, `figtree-latin.woff2`, `noto-music-music.woff2`, `noto-music-latin.woff2`; si una familia variable devuelve el mismo archivo para varios pesos, descargarlo una sola vez); escribir `public/fonts/fonts.css` con los `@font-face` reescritos a `url("./<archivo>")`, conservando `font-weight`, `unicode-range` y `font-display: swap`; imprimir el tamaño total (research R4)
- [ ] T004 Ejecutar `node scripts/fetch-fonts.mjs`, comprobar que `public/fonts/` contiene los `woff2` y `fonts.css`, y añadir `public/fonts/OFL.txt` con el texto de la SIL Open Font License 1.1 y los titulares de copyright de Bricolage Grotesque, Figtree y Noto Music
- [ ] T005 En `index.html`, sustituir los `<link rel="preconnect">` y `<link rel="stylesheet">` de `fonts.googleapis.com` por `<link rel="stylesheet" href="./fonts/fonts.css" />`; no tocar las pilas de reserva de `--display`, `--body` y `--music` en `src/styles.css`
- [ ] T006 Comprobar con `npm run build && npm run preview` que inicio, partitura (claves, figuras, alteraciones) y teclado se ven igual que antes y que la pestaña Network no hace ninguna petición a `fonts.googleapis.com` ni `fonts.gstatic.com`

**Checkpoint**: la app ya no contacta con terceros; fuentes servidas desde el propio sitio.

---

## Phase 3: User Story 1 - Practicar sin conexión (Priority: P1) 🎯 MVP

**Goal**: tras una visita con conexión, toda la app (pantallas, repertorio, piano grabado,
ajustes y progreso) funciona en modo avión, y el alumno sabe cuándo está lista.

**Independent Test**: quickstart › 1. Abrir el build en incógnito, esperar el aviso «Tecla ya
funciona sin conexión», pasar a *Offline*, recargar y recorrer Canciones → lección (Escuchar,
Aprender, Tocar), Piano libre y Ajustes; abrir `#leccion/<id>` directamente.

### Implementation for User Story 1

- [ ] T007 [US1] En `vite.config.ts`, añadir `VitePWA({ registerType: "prompt", injectRegister: false, manifest: false, includeAssets: ["samples/piano/*.mp3", "samples/piano/LICENSE.txt", "fonts/*"], workbox: { globPatterns: ["**/*.{js,css,html,woff2,mp3,png,svg,ico,webmanifest}"], navigateFallback: "index.html", cleanupOutdatedCaches: true, clientsClaim: false, skipWaiting: false } })`, manteniendo `base: "./"` y la configuración de `test`; `manifest` se completa en US2 (research R1–R3)
- [ ] T008 [US1] Comprobar tras `npm run build` que existen `dist/sw.js` y `dist/workbox-*.js`, que la lista de precarga de `dist/sw.js` contiene las 30 `.mp3`, los `.woff2` e `index.html`, y que el total precargado que imprime el build es ≤ 10 MB (SC-004)
- [ ] T009 [US1] Crear `src/pwa/sw.ts` según [contracts/pwa.md](contracts/pwa.md): estado `PwaStatus = { offlineReady: boolean; updateWaiting: boolean; online: boolean }` en memoria con suscripción y hook `usePwaStatus()` (mismo patrón que `src/state/store.ts`, con `useSyncExternalStore`); `online` inicial de `navigator.onLine` y actualizado con los eventos `online`/`offline`; `registerServiceWorker()` que no hace nada si `!import.meta.env.PROD` o `!("serviceWorker" in navigator)`, y si no, tras `window` `load` llama a `navigator.serviceWorker.register("./sw.js", { scope: "./" })`; `offlineReady = true` cuando hay `registration.active` (ya preparado antes) o cuando el `installing` inicial pasa a `activated`; cualquier error se registra con un único `console.warn("Tecla: …")` y nunca se lanza (FR-011, FR-014). Dejar `updateWaiting` en `false` y `applyUpdate` sin exportar todavía (US3)
- [ ] T010 [US1] En `src/main.tsx`, llamar a `registerServiceWorker()` junto a `preloadPiano()`, antes de `createRoot`
- [ ] T011 [P] [US1] Crear `src/components/PwaToast.tsx`: aviso fijo abajo, no modal, con `role="status"`; cuando `offlineReady` pasa a `true` y `localStorage["tecla-offline-ready"]` no es `"true"`, mostrar «Tecla ya funciona sin conexión» durante 5 s con botón de cerrar (`aria-label="Cerrar"`), y guardar `tecla-offline-ready = "true"` (envolver lecturas/escrituras de `localStorage` en `try/catch`) (data-model › Preferencias locales; FR-007)
- [ ] T012 [P] [US1] En `src/styles.css`, añadir estilos `.toast` (fijo abajo, centrado, por encima del teclado, márgenes seguros con `env(safe-area-inset-bottom)`, colores con las variables de tema existentes para claro/oscuro, sin tapar partitura ni teclado en móvil apaisado más de lo imprescindible)
- [ ] T013 [US1] En `src/App.tsx`, montar `<PwaToast route={route} />` una vez, fuera del `switch` de pantallas (la prop `route` se usará en US3)
- [ ] T014 [P] [US1] En `src/components/TopBar.tsx`, mostrar a la izquierda del chip MIDI un chip no interactivo «Sin conexión» (clase `chip warn`, sin `chip-dot` pulsante) cuando `usePwaStatus().online === false`; en pantallas estrechas puede mostrarse solo el punto con `aria-label="Sin conexión"` si el texto no cabe
- [ ] T015 [P] [US1] En `src/screens/SettingsScreen.tsx`, sección «Datos», añadir bajo el texto existente la línea «Disponible sin conexión: sí» o «Disponible sin conexión: preparando…» según `usePwaStatus().offlineReady` (contracts/pwa.md › Interfaz); no mostrar la línea si el navegador no admite service workers
- [ ] T016 [US1] Validar quickstart › 1 completo en Chrome: carga sin conexión, lección con los tres pasos, piano grabado (no sintetizador), ajustes y progreso persistentes, enlace directo `#leccion/<id>` y fuentes correctas (SC-001, SC-002); y quickstart › 4: con `npm run dev` no se registra service worker

**Checkpoint**: MVP. Tecla se puede usar sin conexión aunque no se instale.

---

## Phase 4: User Story 2 - Instalar Tecla como una app (Priority: P2)

**Goal**: Tecla se instala con su nombre, icono y colores, se abre en ventana propia y Ajustes
explica cómo instalarla en cada navegador.

**Independent Test**: quickstart › 2. Instalar desde Ajustes en Chrome/Edge escritorio y
Android; seguir las instrucciones en iPhone; ver el mensaje de Firefox; Lighthouse sin errores
de instalabilidad.

### Tests for User Story 2 ⚠️

> Escribir primero y comprobar que fallan.

- [ ] T017 [P] [US2] Crear `src/pwa/install.test.ts` (Vitest, entorno `node`): `installOption` devuelve `"installed"` si `standalone` aunque `hasPrompt` o `isIOS` sean `true`; `"button"` si `hasPrompt` y no `standalone`, aunque `isIOS`; `"ios-instructions"` si `isIOS` sin `hasPrompt` ni `standalone`; `"unsupported"` en el resto (prioridad «`installed` > `button` > `ios-instructions` > `unsupported`», data-model). `isIOSDevice` es `true` para UA de iPhone y de iPad, y para `platform === "MacIntel"` con `maxTouchPoints > 1` (iPadOS); `false` para Mac de escritorio (`maxTouchPoints` 0), Android, Windows y Firefox de escritorio

### Implementation for User Story 2

- [ ] T018 [P] [US2] Crear `public/icon.svg` (cuadrado 512×512, fondo azul de marca `#3A4EDF` a sangre, con dos o tres teclas de piano blancas y una negra estilizadas centradas dentro del 80 % central para que sirva como icono *maskable*); y `pwa-assets.config.ts` con `defineConfig({ preset: "minimal-2023", images: ["public/icon.svg"] })` de `@vite-pwa/assets-generator/config`; añadir a `package.json` el script `"icons": "pwa-assets-generator"` (research R5)
- [ ] T019 [US2] Ejecutar `npm run icons` y comprobar que se generan en `public/` `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png` y `favicon.ico`; versionarlos en git (el build no los regenera)
- [ ] T020 [US2] En `vite.config.ts`, sustituir `manifest: false` por el manifiesto de data-model › Identidad: `name: "Tecla · aprende piano"`, `short_name: "Tecla"`, `description` igual que la `<meta name="description">`, `lang: "es"`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `orientation: "any"`, `theme_color: "#3A4EDF"`, `background_color` = valor de `--bg` del tema claro en `src/styles.css`, `icons` con 64, 192 y 512 (`purpose: "any"`) y `maskable-icon-512x512.png` (`purpose: "maskable"`); añadir `favicon.ico`, `apple-touch-icon-180x180.png` e `icon.svg` a `includeAssets`
- [ ] T021 [P] [US2] En `index.html`, añadir `<link rel="icon" href="./favicon.ico" sizes="48x48">`, `<link rel="icon" href="./icon.svg" type="image/svg+xml">`, `<link rel="apple-touch-icon" href="./apple-touch-icon-180x180.png">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="mobile-web-app-capable" content="yes">` y `<meta name="apple-mobile-web-app-title" content="Tecla">`; el `<link rel="manifest">` lo inyecta el plugin (comprobarlo en `dist/index.html`)
- [ ] T022 [US2] Crear `src/pwa/install.ts` según [contracts/pwa.md](contracts/pwa.md) hasta que pase T017: funciones puras `installOption(env)` e `isIOSDevice(ua, platform, maxTouchPoints)`; `initInstall()` que, una sola vez, escucha `beforeinstallprompt` (llamar a `preventDefault()` y guardar el evento), `appinstalled` (descartar el evento y marcar instalado) y los cambios de `matchMedia("(display-mode: standalone)")`; `standalone` = ese `matchMedia` o `navigator.standalone === true`; estado con suscripción y hook `useInstallOption()`; `promptInstall()` que llama a `prompt()`, espera `userChoice`, descarta el evento en ambos casos (deja de haber botón) y resuelve `true` si `outcome === "accepted"`, sin lanzar nunca. Tipar `BeforeInstallPromptEvent` localmente (no está en `lib.dom`)
- [ ] T023 [US2] En `src/main.tsx`, llamar a `initInstall()` antes de `createRoot` (Chrome puede disparar `beforeinstallprompt` antes de que exista Ajustes; research R6)
- [ ] T024 [US2] En `src/screens/SettingsScreen.tsx`, añadir antes de «Datos» una sección `<section className="panel">` con `<h2>Instalar Tecla</h2>` según `useInstallOption()`: `"button"` → texto «Ábrela desde un icono, en su propia ventana y sin conexión.» y botón `btn` «Instalar» que llama a `promptInstall()`; `"ios-instructions"` → «En iPhone o iPad: pulsa Compartir y luego “Añadir a pantalla de inicio”.»; `"unsupported"` → «Este navegador no permite instalar apps, pero Tecla funciona sin conexión.»; `"installed"` → no renderizar la sección (FR-008)
- [ ] T025 [US2] Validar quickstart › 2: instalación en Chrome/Edge escritorio (ventana propia, nombre e icono, mismos ajustes y progreso, sección oculta tras instalar), Android (pantalla completa, color de marca, orientación como en el navegador), iPhone/iPad (instrucciones y apertura sin conexión desde el icono), Firefox (mensaje), y Lighthouse sin errores de instalabilidad (SC-005)

**Checkpoint**: Tecla se instala y se abre como app; sigue funcionando sin conexión.

---

## Phase 5: User Story 3 - Recibir las novedades sin perder nada (Priority: P3)

**Goal**: las versiones nuevas llegan solas en segundo plano, se ofrecen con un aviso que nunca
interrumpe la práctica y conservan ajustes y progreso.

**Independent Test**: quickstart › 3. Publicar en local un build con un texto cambiado; en una
lección no aparece el aviso ni se recarga; en Inicio aparece «Hay una versión nueva ·
Actualizar» y al pulsarlo se ve el cambio con los datos intactos.

### Implementation for User Story 3

- [ ] T026 [US3] En `src/pwa/sw.ts`, tras registrar: si `registration.waiting` existe y hay `navigator.serviceWorker.controller`, poner `updateWaiting = true`; escuchar `updatefound` y, cuando el nuevo `installing` pase a `installed` habiendo ya un `controller`, poner `updateWaiting = true` (si no había `controller`, es la primera preparación de US1, no una actualización); exportar `applyUpdate()` que envía `registration.waiting.postMessage({ type: "SKIP_WAITING" })` y recarga (`location.reload()`) una sola vez en el primer `controllerchange` posterior; nunca recargar sin `applyUpdate()` (FR-009, FR-010)
- [ ] T027 [US3] En `src/pwa/sw.ts`, comprobar actualizaciones en apps que se quedan abiertas: en `visibilitychange` a `visible`, llamar a `registration.update()` si han pasado ≥ 60 min desde la última comprobación; ignorar errores (sin conexión) con `catch` silencioso (research R7, FR-011)
- [ ] T028 [US3] En `src/components/PwaToast.tsx`, cuando `updateWaiting` sea `true` y `route.name !== "lesson"`, mostrar «Hay una versión nueva» con botón `btn` «Actualizar» que llama a `applyUpdate()` y botón «Ahora no» que oculta el aviso hasta la siguiente apertura de la app; si el aviso «ya funciona sin conexión» estaba visible, el de actualización lo sustituye; durante una lección no se muestra (SC-007)
- [ ] T029 [US3] Validar quickstart › 3: aviso pospuesto en lección, actualización al pulsar con ajustes y progreso intactos, actualización al cerrar todas las pestañas sin pulsar, varias pestañas abiertas sin roturas, y pérdida de conexión durante la descarga sin errores visibles (SC-006, SC-007)

**Checkpoint**: las tres historias funcionan juntas.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: calidad, documentación y verificación final.

- [ ] T030 [P] Comprobar en móvil apaisado (o emulación de DevTools a 844×390) que el aviso y el chip «Sin conexión» no provocan desplazamiento en la pantalla de lección ni tapan teclas (Principio IV)
- [ ] T031 [P] Revisar `src/screens/SettingsScreen.tsx`: añadir a los créditos existentes «Fuentes: Bricolage Grotesque, Figtree y Noto Music (SIL Open Font License)»
- [ ] T032 [P] Marcar como hecho (✅) «App instalable (PWA) y uso sin conexión» en `old_docs/ROADMAP.md`
- [ ] T033 Ejecutar `npm test` (los tests existentes pasan sin cambios + `install.test.ts`; SC-008) y `npm run build` (tipos estrictos), y repasar la consola del build servido sin conexión: ningún error, como mucho un `console.warn` de Tecla

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: independiente de Setup; bloquea la *validación* sin conexión de
  todas las historias (sin fuentes propias, la notación se rompe offline).
- **US1 (Phase 3)**: depende de Setup (plugin) y Foundational.
- **US2 (Phase 4)**: depende de Setup (plugin y generador de iconos). Su instalación es
  comprobable sin US1, pero para abrirla sin conexión desde el icono hace falta US1.
- **US3 (Phase 5)**: depende de US1 (`sw.ts`, `PwaToast`).
- **Polish (Phase 6)**: tras las historias elegidas.

### User Story Dependencies

- **US1 (P1)**: tras Phase 2; sin dependencias de otras historias.
- **US2 (P2)**: tras Phase 1; comparte `vite.config.ts`, `index.html`, `main.tsx` y
  `SettingsScreen.tsx` con US1, así que conviene hacerla después de US1 para evitar conflictos.
- **US3 (P3)**: extiende `src/pwa/sw.ts` y `PwaToast.tsx` de US1.

### Within Each User Story

- US2: T017 (test) antes de T022; T018 → T019 → T020 (iconos antes del manifiesto).
- US1: T007 → T008; T009 → T010, T011, T014, T015; T011 → T013.
- US3: T026 → T027, T028.

### Parallel Opportunities

- T001 ∥ T002 ∥ T003 (archivos distintos).
- En US1, tras T009: T011, T012, T014 y T015 en paralelo.
- En US2: T017, T018 y T021 en paralelo.
- En Polish: T030, T031 y T032 en paralelo.

---

## Parallel Example: User Story 1 (tras T009)

```bash
Task: "Crear el aviso de lista sin conexión en src/components/PwaToast.tsx"
Task: "Estilos .toast en src/styles.css"
Task: "Chip «Sin conexión» en src/components/TopBar.tsx"
Task: "Línea «Disponible sin conexión» en src/screens/SettingsScreen.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "Tests de installOption e isIOSDevice en src/pwa/install.test.ts"
Task: "Icono fuente public/icon.svg y pwa-assets.config.ts"
Task: "Iconos y metas de iOS en index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Setup) y Phase 2 (fuentes propias).
2. Phase 3 (US1): service worker con precarga completa, aviso de lista y chip de conexión.
3. **STOP and VALIDATE**: quickstart › 1 en modo avión.
4. Publicar: ya aporta valor (practicar sin conexión desde el navegador).

### Incremental Delivery

1. Setup + Foundational → sin peticiones a terceros.
2. US1 → uso sin conexión (MVP) → publicar.
3. US2 → instalación con icono → publicar.
4. US3 → aviso de actualización → publicar.

> Nota: desde que se publica US1, los alumnos que ya tengan la app guardada reciben las
> versiones siguientes con el comportamiento por defecto del navegador (al cerrar todas las
> pestañas) hasta que llegue US3. No se pierde ningún dato.

---

## Notes

- [P] = otro archivo, sin dependencias pendientes.
- El service worker solo existe en el build: probar siempre con `npm run build && npm run preview`
  y, para empezar de cero, DevTools › Application › *Clear site data* o una ventana de incógnito.
- `main` despliega en cada push: no integrar US1 sin haber validado quickstart › 1, porque un
  service worker defectuoso queda guardado en los dispositivos de los alumnos.
- Commit tras cada tarea o grupo lógico.
