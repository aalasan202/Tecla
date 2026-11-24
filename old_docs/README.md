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

En móvil y tablet la app funciona en horizontal; en vertical pide girar el dispositivo.

Web MIDI solo funciona en Chrome o Edge y en páginas `https` o `localhost`.

## Estructura

```
src/
  screens/      Inicio, Canciones, Lección, Piano libre, Progreso y Ajustes
  state/        ajustes y progreso guardados en el navegador
  router.ts     rutas por hash (#canciones, #leccion/oda2, #piano…)
  music/        teoría, canciones, partitura lógica, ortografía, grabado, posiciones y digitación (sin DOM)
  engine/       motor de lección (Escuchar / Aprender / Tocar), sin DOM
  audio/        sintetizador Web Audio
  midi/         Web MIDI: una conexión para toda la app (MidiProvider)
  components/   Partitura (ScoreView, con VexFlow), Teclado, barra superior, iconos
  App.tsx       elige la pantalla según la ruta y aplica el tema
prototype/      el prototipo original en un solo archivo, como referencia
```

El motor (`src/engine/lesson.ts`) no toca el DOM: recibe un `LessonHost` con callbacks para marcar notas, sonar, mover el cursor, etc. Así se puede probar con tests y cambiar la interfaz sin tocar la lógica.

### Añadir una canción

En `src/music/songs.ts`, cada pista es una lista de `[nota MIDI, duración en pulsos]`; `0` es un silencio. Do central = 60. Las piezas a dos manos usan `r` y `l`; las de una mano, `n`. Los tests comprueban que cada mano llena compases completos.

Además (desde 007):

- **Acordes**: un array de notas, `[[48, 52, 55], 2]`.
- **Opciones** como tercer elemento: `{ tie: true }` liga con el evento siguiente (mismas notas), `{ slur: "start" }` / `{ slur: "end" }` para ligaduras de expresión y `{ spell: "b" }` para forzar la ortografía (Re♭ en vez de Do♯).
- **Duraciones** en negras, también tercios (`1/3`, tresillos) y cuartos (`0.25`, semicorcheas). Una duración sin figura propia (`2.5`) se escribe tal cual: la partitura la parte en figuras ligadas.
- **Pieza**: `key` (armadura, −7 bemoles … +7 sostenidos), `keyChanges` (`[{ at: compás, key }]`) y `time: "6/8"` (el tempo va entonces en negras con puntillo por minuto).

La partitura se dibuja con [VexFlow](https://www.vexflow.com/) 5.0.0 (licencia MIT), en un chunk aparte que solo carga la lección.

## Despliegue

Cada push a `main` pasa los tests, compila y publica en GitHub Pages (`.github/workflows/deploy.yml`). En *Settings › Pages*, la fuente debe ser **GitHub Actions**.

Hoja de ruta: [ROADMAP.md](ROADMAP.md).
