# Quickstart: validar app instalable y uso sin conexión

El service worker solo se registra en el build. Todas las pruebas se hacen con el build servido
en local (`localhost` cuenta como contexto seguro) o en GitHub Pages.

## Preparación

```bash
npm ci
npm test            # SC-008: pasan los tests existentes + install.test.ts
npm run build       # comprueba tipos y genera dist/ con sw.js y manifest.webmanifest
npm run preview     # http://localhost:4173
```

Comprobaciones del build:
- `dist/sw.js` y `dist/manifest.webmanifest` existen.
- La lista de precarga de `dist/sw.js` incluye las 30 `.mp3`, las `.woff2` y los iconos.
- `index.html` de `dist/` no menciona `fonts.googleapis.com`.

## 1. Uso sin conexión (US1, SC-001, SC-002)

1. En Chrome, abrir `http://localhost:4173` en una ventana de incógnito.
2. Esperar al aviso «Tecla ya funciona sin conexión». En DevTools › Application › Service
   workers, el estado es *activated*.
3. DevTools › Network › *Offline* (o desconectar la red). Recargar.
4. Esperado: carga la pantalla de inicio; aparece el chip «Sin conexión».
5. Recorrer Canciones → una lección: Escuchar, Aprender y Tocar. Las notas suenan con el piano
   grabado (no con el sintetizador).
6. Piano libre: suena el piano. Ajustes: cambiar notación y tema; recargar sin conexión y
   comprobar que se conservan. Terminar una pieza en Tocar y ver la puntuación en Progreso.
7. Escribir directamente `http://localhost:4173/#leccion/<id>` sin conexión: se abre la lección.
8. Textos y notación (claves, figuras, alteraciones) se ven con sus fuentes.

## 2. Instalación (US2, SC-005)

- **Chrome/Edge escritorio**: Ajustes › «Instalar Tecla» › Instalar. Se abre en ventana propia
  con nombre «Tecla» e icono. Ajustes y progreso son los mismos. La sección de instalación ya no
  aparece.
- **Android (Chrome)**: sobre GitHub Pages, instalar desde Ajustes o el menú. Abrir desde el
  icono: pantalla completa, color de marca al cargar; en vertical pide girar, en apaisado se ven
  partitura y teclado sin desplazamiento.
- **iPhone/iPad (Safari)**: Ajustes muestra las instrucciones de Compartir › «Añadir a pantalla
  de inicio». Tras añadirla, abrir desde el icono sin conexión y practicar.
- **Firefox escritorio**: Ajustes indica que no se puede instalar pero funciona sin conexión.
- Lighthouse (Chrome) › categoría PWA / «Installable»: sin errores de manifiesto.

## 3. Actualizaciones (US3, SC-006, SC-007)

1. Con la app ya preparada en `npm run preview`, cambiar un texto visible (p. ej. el subtítulo
   de la marca), `npm run build` y reiniciar `npm run preview`.
2. Abrir una lección y recargar: **no** aparece el aviso mientras se practica y la app no se
   recarga sola.
3. Volver a Inicio: aparece «Hay una versión nueva · Actualizar». Pulsar: la app se recarga con
   el texto nuevo; ajustes y progreso intactos.
4. Repetir sin pulsar el aviso: cerrar todas las pestañas y volver a abrir → versión nueva.
5. Con una versión nueva pendiente, pasar a *Offline* durante la descarga: la app sigue
   funcionando con la anterior, sin errores visibles.

## 4. Sin soporte y desarrollo

- `npm run dev`: no se registra service worker (Application › Service workers vacío).
- En un navegador o contexto sin service worker (p. ej. `http://` con IP de la red local), la
  app funciona como antes, con conexión, sin errores en consola salvo un `console.warn`.
- MIDI: en la app instalada en Chrome/Edge, conectar un teclado; funciona igual que en la
  pestaña, también sin conexión.
