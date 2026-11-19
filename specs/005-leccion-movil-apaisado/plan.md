# Implementation Plan: Lección en móvil apaisado

**Branch**: `005-leccion-movil-apaisado` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-leccion-movil-apaisado/spec.md`

## Summary

Hacer que la pantalla de lección quepa sin desplazamiento en móvil apaisado (≥ 640 × 320). Con
la misma condición que Inicio y Piano libre (`landscape` y alto ≤ 500), la lección pasa a una
rejilla de altura fija: una fila de práctica (Atrás, pasos, mano, Empezar/Parar, Bucle con
rango «X–Y ▾», Opciones), la partitura escalada al alto que queda (mín. 0,55, ambos pentagramas
siempre), una barra de estado de una línea y el teclado (≥ 110 de alto, ≥ 28 por tecla blanca,
con seguimiento de la nota guiada en `canon` y `preludio`). Tempo, «A tempo», nombres, dedos,
ayuda, título, MIDI y Ajustes van a un panel de opciones; los ±1 del bucle, a un panel propio;
el resultado se superpone. Solo interfaz: el motor no cambia. Ver [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (modo estricto)

**Primary Dependencies**: React 18, Vite 5 (sin dependencias nuevas)

**Storage**: ninguno nuevo

**Testing**: Vitest 2 (`npm test`, entorno `node`) para las funciones puras de disposición;
verificación manual de la interfaz (quickstart)

**Target Platform**: navegadores actuales en móvil apaisado (≥ 640 × 320 puntos), tablet y
escritorio; también como app instalada

**Project Type**: aplicación web estática (SPA) publicada en GitHub Pages

**Performance Goals**: sin saltos de disposición al tocar; recálculo de escala solo al cambiar
el tamaño (ResizeObserver), no por fotograma; cursor a 60 fps como hoy

**Constraints**: el motor no cambia; fuera del modo compacto la lección es idéntica a hoy;
zonas táctiles ≥ 40 × 40; teclas blancas ≥ 28; partitura ≥ 0,55 de escala

**Scale/Scope**: 1 pantalla, 2 componentes ampliados (`Staff`, `Keyboard`), 1 componente nuevo
(`Popover`), 1 hook y 1 módulo puro nuevos (`src/ui/`), estilos; 12 piezas (10–27 teclas blancas)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Estado |
|-----------|--------------|--------|
| I. Motor separado de la interfaz | Cambios solo en `src/components/`, `src/screens/`, `src/ui/` y estilos; `src/engine/` no se toca («un cambio de diseño MUST NOT requerir cambios en el motor»). | ✅ |
| II. Lógica musical probada | No cambian `engine`, `music` ni `state`. Las funciones puras de disposición (`fitScale`, `keyScroll`) llevan tests; los componentes se verifican a mano en escritorio y móvil apaisado (quickstart). | ✅ |
| III. Funciona sin hardware | El teclado en pantalla sigue siempre visible (aclaración 3); teclado del ordenador y MIDI llegan igual con paneles abiertos. | ✅ |
| IV. Para quien empieza, cualquier pantalla | Es el objetivo: partitura y teclado sin desplazamiento en móvil apaisado; vertical sigue pidiendo girar; textos en español; ajustes de notación, nombres, dedos y tema respetados; tres pasos intactos. | ✅ |
| V. Sencillez y datos en el dispositivo | Sin dependencias ni datos nuevos; `Popover` propio y mínimo; CSS + un hook en lugar de una librería de disposición. | ✅ |
| Restricciones técnicas | Stack actual. | ✅ |
| Flujo de trabajo | `npm test` y `npm run build` antes de integrar; verificación manual en móvil. | ✅ |

**Post-design re-check**: [data-model.md](data-model.md) y
[contracts/lesson-layout.md](contracts/lesson-layout.md) mantienen los cambios aditivos (props
opcionales), sin cambios en el motor ni en datos guardados. Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/005-leccion-movil-apaisado/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── lesson-layout.md # Phase 1: funciones puras, hook, componentes y pantalla
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
src/
├── ui/
│   ├── layout.ts            # NUEVO: fitScale, keyScroll (puras)
│   ├── layout.test.ts       # NUEVO
│   └── useCompactLesson.ts  # NUEVO: matchMedia del modo compacto
├── components/
│   ├── Staff.tsx            # prop fit: viewBox recortado y escala
│   ├── Keyboard.tsx         # prop fit: alto de la rejilla, 28 por tecla, seguimiento
│   └── Popover.tsx          # NUEVO: panel superpuesto mínimo
├── screens/
│   └── LessonScreen.tsx     # fila de práctica, paneles, resultado superpuesto en modo compacto
└── styles.css               # rejilla compacta de la lección, fila, paneles, resultado
```

**Structure Decision**: proyecto único existente. Las funciones puras de disposición van a un
directorio nuevo `src/ui/` (no son lógica musical, así que no van a `src/music/`).

### Enfoque de implementación (resumen)

1. **Puras** (`layout.ts` + tests) y **hook** `useCompactLesson`.
2. **`Staff fit`**: medir contenido, `viewBox` recortado, escala con `ResizeObserver`, corregir
   `scrollTo` y el clic del bucle.
3. **`Keyboard fit`**: alto de la fila, 28 por tecla, sin letras, seguimiento con `keyScroll`.
4. **`Popover`** y **CSS** de la rejilla compacta (`100dvh`, zonas seguras, fila de 44,
   estado de 24, teclado `clamp(110px, 34dvh, 170px)`).
5. **`LessonScreen`**: con `compact`, fila de práctica (pasos y mano compactos, Bucle con
   «X–Y ▾»), panel de opciones (incluye título, ayuda, MIDI y Ajustes), panel del bucle,
   resultado superpuesto; sin `TopBar` ni línea informativa. Fuera de `compact`, igual que hoy.
6. **Verificación**: quickstart completo en 640 × 320, 667 × 375, 844 × 390, tablet,
   escritorio y móvil real.

## Complexity Tracking

Sin violaciones de la constitución; no aplica.
