# Implementation Plan: Ampliar el repertorio de dominio público por niveles

**Branch**: `008-repertorio-por-niveles` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-repertorio-por-niveles/spec.md`

## Summary

Se añaden 14 piezas de dominio público (5 en el nivel 1 y 3 en cada uno de los demás) escritas
con el formato actual de `SongDef`, sin cambios en el motor ni en la partitura. Cada pieza del
repertorio gana un campo `origin` que justifica el dominio público, y una lista `ORDER` fija el
orden de menor a mayor dificultad dentro de cada nivel. Nuevos tests convierten las reglas de
cada nivel en comprobaciones automáticas. Detalles en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5, VexFlow 5 (ya presentes); ninguna nueva

**Storage**: sin cambios; los ids existentes se conservan, así que el progreso guardado sigue valiendo

**Testing**: Vitest 2 (`npm test`)

**Target Platform**: navegadores actuales en escritorio, tablet y móvil apaisado; PWA sin conexión

**Project Type**: aplicación web estática (SPA)

**Performance Goals**: sin cambios (piezas ≤ 32 compases, muy por debajo de los límites de 007)

**Constraints**: piezas existentes intactas (FR-008, test de no regresión); dominio público (R1)

**Scale/Scope**: 1 archivo nuevo de datos (`src/music/repertoire.ts`), 1 de tests
(`src/music/repertoire.test.ts`); cambios pequeños en `types.ts` (`origin`), `songs.ts`
(`origin`, `ORDER`) y `Songs.tsx` (textos de nivel)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Estado |
|-----------|--------------|--------|
| I. Motor separado de la interfaz | Solo datos en `src/music/`; el motor no cambia. | ✅ |
| II. Lógica musical probada | Toda pieza pasa `validateSong`; tests nuevos de reglas por nivel, digitación del nivel 1, 3 estrellas tocando sin fallos y orden; la no regresión de las 12 piezas sigue. | ✅ |
| III. Funciona sin hardware | Las piezas se tocan con el teclado en pantalla como las demás. | ✅ |
| IV. Para quien empieza | Progresión ordenada por nivel; títulos en español cuando existen; tres pasos sin cambios. | ✅ |
| V. Sencillez y dominio público | Sin dependencias; origen documentado en cada pieza (R1, R5). | ✅ |
| Flujo de trabajo | `npm test` y `npm run build` antes de integrar. | ✅ |

**Post-design re-check**: el único cambio de tipos es un campo opcional; sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/008-repertorio-por-niveles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/repertorio.md
└── tasks.md
```

### Source Code (repository root)

```text
src/music/
├── types.ts             # + origin?: string
├── songs.ts             # origin en las 15 piezas, ORDER y SONGS ordenado
├── repertoire.ts        # NUEVO: las 14 piezas nuevas
└── repertoire.test.ts   # NUEVO: reglas por nivel, orden, origen, 3 estrellas
src/screens/Songs.tsx    # descripciones de nivel (FR-013)
```

**Structure Decision**: las piezas nuevas van en un archivo aparte para que `songs.ts` no crezca
sin control y se vea qué añade esta entrega; `songs.ts` sigue siendo el único punto de entrada
(`SONGS`).

## Complexity Tracking

Sin desviaciones que justificar.
