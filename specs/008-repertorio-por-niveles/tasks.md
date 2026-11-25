# Tasks: Ampliar el repertorio de dominio público por niveles

**Input**: Design documents from `specs/008-repertorio-por-niveles/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/repertorio.md, quickstart.md

**Tests**: obligatorios por la constitución (Principio II: cambios en `src/music/` con tests).

## Phase 1: Setup

- [X] T001 Comprobar que `npm test` y `npm run build` pasan en la rama antes de cambiar nada

## Phase 2: Foundational

- [X] T002 Añadir `origin?: string` a `SongDef` en src/music/types.ts ("Compositor con fechas o procedencia popular; añade «arreglo» o «fragmento» si aplica")
- [X] T003 Rellenar `origin` en las 15 piezas existentes sin tocar id, notas, tempo ni nivel en src/music/songs.ts
- [X] T004 Crear src/music/repertoire.ts exportando `MORE: SongDef[]` (vacío) y en src/music/songs.ts unir existentes + `MORE` y ordenar `SONGS` por una lista `ORDER` de ids (research R4); `SONGS[0]` sigue siendo `cinco`
- [X] T005 Crear src/music/repertoire.test.ts con: ids únicos y todos en `ORDER`, `SONGS[0]` = `cinco`, niveles no decrecientes, `origin` no vacío en todas, reglas por nivel de contracts/repertorio.md para las piezas de `MORE` (≤ 32 compases; nivel 1: una mano, teclas blancas, cinco notas, un dedo por altura; nivel 2: una mano; nivel 4: dos manos) y 3 estrellas tocando sin fallos

**Checkpoint**: la suite pasa con `MORE` vacío; la no regresión no cambia.

## Phase 3: User Story 1 - Más piezas en los primeros niveles (P1) 🎯 MVP

**Goal**: niveles 1 y 2 con al menos 6 piezas cada uno.

**Independent Test**: Canciones muestra 6 piezas en el nivel 1 y 7 en el 2; cada nueva se completa en los tres pasos con el teclado en pantalla.

- [X] T006 [US1] Añadir en src/music/repertoire.ts las piezas de nivel 1 `corderito`, `hanschen`, `santos`, `jingle` (research R2) y colocarlas en `ORDER` de src/music/songs.ts
- [X] T007 [US1] Añadir en src/music/repertoire.ts las piezas de nivel 2 `bollos`, `macdonald`, `puente`, `susana` y colocarlas en `ORDER` de src/music/songs.ts
- [X] T008 [US1] Añadir a src/music/repertoire.test.ts la comprobación de recuento: niveles 1 y 2 con ≥ 6 piezas y ≥ 3 nuevas

## Phase 4: User Story 2 - Más piezas a dos manos en los niveles 3 y 4 (P2)

**Goal**: niveles 3 y 4 con al menos 3 piezas nuevas cada uno.

**Independent Test**: cada pieza nueva de los niveles 3 y 4 se puntúa de principio a fin a dos manos y con una sola mano.

- [X] T009 [US2] Añadir en src/music/repertoire.ts las piezas de nivel 3 `largo`, `despedida`, `nochedepaz` (arreglos R3) y colocarlas en `ORDER` de src/music/songs.ts
- [X] T010 [US2] Añadir en src/music/repertoire.ts las piezas de nivel 4 `martinillo-canon`, `rema`, `elisa2` y colocarlas en `ORDER` de src/music/songs.ts
- [X] T011 [US2] Ampliar el recuento de src/music/repertoire.test.ts a los cuatro niveles (≥ 6 por nivel, ≥ 3 nuevas por nivel, ≥ 12 nuevas, total ≥ 27)

## Phase 5: User Story 3 - Progresión clara dentro de cada nivel (P3)

**Goal**: orden de menor a mayor dificultad y descripciones de nivel exactas.

**Independent Test**: revisar el orden de cada nivel y las descripciones en Canciones.

- [X] T012 [US3] Revisar `ORDER` en src/music/songs.ts para que cada nivel vaya de menor a mayor dificultad mezclando nuevas y existentes (research R2)
- [X] T013 [US3] Actualizar `LEVEL_TEXT` en src/screens/Songs.tsx con las descripciones de contracts/repertorio.md (FR-013)

## Phase 6: Polish

- [X] T014 Ejecutar `npm test` y `npm run build`
- [X] T015 Marcar el punto «Ampliar el repertorio de dominio público por niveles» como hecho en old_docs/ROADMAP.md
- [ ] T016 Revisión manual con quickstart.md (escuchar cada pieza nueva, móvil apaisado)

## Dependencies

- T001 → T002 → T003/T004 → T005 → US1 → US2 → US3 → Polish (todas las fases tocan `songs.ts`/`repertoire.ts`: secuenciales).
- US2 y US3 no dependen funcionalmente de US1, pero comparten archivos.

## Parallel Opportunities

- T013 (Songs.tsx) puede hacerse en paralelo con cualquier tarea de datos.

## Implementation Strategy

MVP = Fases 1–3 (niveles 1 y 2 completos). Luego US2 y US3 de forma incremental, con la suite en verde tras cada fase.
