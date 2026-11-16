# Implementation Plan: Sonido de piano real

**Branch**: `002-sonido-piano-real` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-sonido-piano-real/spec.md`

## Summary

Sustituir el timbre del sintetizador por grabaciones del **Salamander Grand Piano**
(CC BY 3.0): 30 muestras MP3, una cada 3 semitonos, recortadas y alojadas en
`public/samples/piano/` (≤ 3 MB). Las notas se reproducen con Web Audio puro, eligiendo la
muestra más cercana y ajustando su velocidad. `playTone` mantiene su firma: usa el piano cuando
está cargado y el sintetizador actual como reserva mientras carga o si falla. Las muestras se
guardan en Cache Storage para visitas posteriores y sin conexión. Ver [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5; Web Audio API y Cache Storage del navegador. Sin
dependencias de producción nuevas. Las muestras se descargan una vez con
`scripts/prepare-piano.mjs` (Node, sin `ffmpeg`; ver research R2).

**Storage**: Cache Storage (`tecla-piano-v1`) para las muestras; sin cambios en `localStorage`

**Testing**: Vitest 2 (`npm test`); tests de las funciones puras de `src/audio/samples.ts`;
prueba manual del sonido

**Target Platform**: navegadores actuales (Chrome, Edge, Firefox, Safari); escritorio, tablet y
móvil en horizontal

**Project Type**: aplicación web estática (SPA) publicada en GitHub Pages

**Performance Goals**: pulsación → sonido < 50 ms (constitución); piano listo en < 5 s la
primera vez a ~10 Mbit/s y < 1 s en visitas siguientes

**Constraints**: muestras ≤ 3 MB en total; ningún cambio en el motor ni en la firma de
`playTone`; sin teclas mudas en ningún estado de carga

**Scale/Scope**: 1 módulo de audio (3 archivos), 30 archivos estáticos, 1 línea en Ajustes,
1 llamada de precarga al arrancar

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Estado |
|-----------|--------------|--------|
| I. Motor separado de la interfaz | El cambio vive en `src/audio/`; `LessonHost.tone` y la firma de `playTone` no cambian; el motor no se toca (constitución, Restricciones técnicas › Audio). | ✅ |
| II. Lógica musical probada | No hay cambios en `engine/`, `music/` ni `state/`; aun así, la elección de muestra y la afinación se prueban en `samples.test.ts`. | ✅ |
| III. Funciona sin hardware | Todas las fuentes de nota (pantalla, ordenador, MIDI) ya pasan por `playTone`. | ✅ |
| IV. Para quien empieza, cualquier pantalla | No hay controles nuevos; la carga es invisible y nunca deja teclas mudas; los créditos van en Ajustes, en español. | ✅ |
| V. Sencillez y datos en el dispositivo | Sin dependencias de producción (se descartó Tone.js); las muestras se alojan en el propio sitio, sin terceros; licencia CC BY con atribución. | ✅ |
| Restricciones técnicas | Web Audio API; objetivo < 50 ms de latencia; hosting estático. | ✅ |
| Flujo de trabajo | Rama `002-sonido-piano-real`; `npm test` y `npm run build` antes de integrar. | ✅ |

**Post-design re-check**: el diseño de Phase 1 ([data-model.md](data-model.md),
[contracts/audio.md](contracts/audio.md)) mantiene la API pública de `synth.ts` y no añade
dependencias. Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/002-sonido-piano-real/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── audio.md         # Phase 1: API del módulo de audio y archivos estáticos
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
src/
├── audio/
│   ├── synth.ts           # misma API; playTone elige piano o sintetizador (synthTone interno)
│   ├── piano.ts           # nuevo: precarga, Cache Storage, decodificación, voces
│   ├── samples.ts         # nuevo: lista de muestras, muestra más cercana, playbackRate, URL
│   └── samples.test.ts    # nuevo
├── screens/
│   └── SettingsScreen.tsx # línea de créditos del sonido de piano
└── main.tsx               # llama a preloadPiano() al arrancar

public/
└── samples/piano/         # nuevo: A0.mp3 … C8.mp3 (30) + LICENSE.txt

scripts/
└── prepare-piano.mjs      # nuevo (desarrollo): recorta, normaliza y convierte con ffmpeg
```

**Structure Decision**: aplicación única existente. El cambio queda encapsulado en
`src/audio/` detrás de la API actual de `synth.ts`; los archivos de sonido van en `public/` para
que Vite los copie tal cual al build.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
