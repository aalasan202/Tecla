# Tecla

Aplicación web para aprender piano: partitura interactiva, teclado en pantalla y teclado MIDI (USB o Bluetooth), con tres pasos por pieza — **Escuchar**, **Aprender** (la partitura espera cada nota) y **Tocar** (a tempo, con puntuación).

Web: https://aalasan202.github.io/Tecla/

## Desarrollo

```bash
npm install
npm run dev        # servidor local con recarga
npm test           # tests de la lógica musical y del motor de lecciones
npm run build      # comprueba tipos y genera dist/
```

Web MIDI solo funciona en Chrome o Edge y en páginas `https` o `localhost`.

## Estructura

```
src/
  music/        teoría (nombres, posiciones), canciones, partitura y digitación
  engine/       motor de lección (Escuchar / Aprender / Tocar), sin DOM
  audio/        sintetizador Web Audio
  midi/         hook de Web MIDI
  components/   Partitura (SVG) y Teclado
  App.tsx       pantalla principal
prototype/      el prototipo original en un solo archivo, como referencia
```

El motor (`src/engine/lesson.ts`) no toca el DOM: recibe un `LessonHost` con callbacks para marcar notas, sonar, mover el cursor, etc. Así se puede probar con tests y cambiar la interfaz sin tocar la lógica.

### Añadir una canción

En `src/music/songs.ts`, cada pista es una lista de `[nota MIDI, duración en pulsos]`; `0` es un silencio. Do central = 60. Las piezas a dos manos usan `r` y `l`; las de una mano, `n`. Los tests comprueban que cada mano llena compases completos.

## Despliegue

Cada push a `main` pasa los tests, compila y publica en GitHub Pages (`.github/workflows/deploy.yml`). En *Settings › Pages*, la fuente debe ser **GitHub Actions**.

Hoja de ruta: [ROADMAP.md](ROADMAP.md).
