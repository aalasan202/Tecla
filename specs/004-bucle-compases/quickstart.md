# Quickstart: validar «Bucle de compases»

## Requisitos

- Node y dependencias instaladas (`npm install`).
- Chrome o Edge si se quiere probar también con teclado MIDI (opcional).

## 1. Tests automáticos

```bash
npm test
npm run build   # comprobación de tipos + compilación
```

Esperado: todo en verde, con los tests existentes sin modificar (SC-004) y los nuevos:

**`src/engine/fragment.test.ts`** — selección ([contrato §2](contracts/lesson-engine.md))

| Escenario | Spec |
|-----------|------|
| Dos toques forman el rango ordenado; un toque con fragmento completo empieza otro | FR-002, casos límite |
| Mismo compás dos veces = fragmento de un compás | caso límite |
| `nudge` respeta los límites de la pieza y no cruza inicio y fin | FR-016, caso límite |
| Desactivar borra la selección; `rangeOf` es `null` si está incompleta | FR-001, FR-004 |

**`src/music/score.test.ts`** — `measureAt` en 4/4 y 3/4, y recorte a los extremos.

**`src/engine/lesson.test.ts`** — motor con `loop` (host falso y reloj controlado)

| Escenario | Spec |
|-----------|------|
| Aprender: solo pide notas del fragmento y, tras la última, vuelve a la primera | US1-2/3, FR-005/006/008 |
| Aprender «A tempo»: `pos` vuelve a `start` al pasar `end` | US2-4 |
| Escuchar: nunca suena una nota con `n.s` fuera de `[start, end)` | FR-007, SC-002 |
| Tocar: cuenta atrás solo una vez; descanso de un compás con clics; la 2.ª repetición empieza en `COUNT_IN + P` pulsos | FR-009, SC-003 |
| Tocar: pulsación adelantada a la 1.ª nota de la repetición siguiente cuenta como acierto | R4 |
| Una mano: el acompañamiento se limita al fragmento y se repite | FR-010 |
| Duración de sonido recortada en notas que cruzan `end` | FR-011 |
| Estado con número de repetición y resultado anterior | FR-012 |
| `loopSummary()`: reps, mejor y última; `null` en Escuchar | FR-013 |
| Nunca se llama a `finish` con bucle | FR-006, FR-014 |
| Fragmento sin notas de la mano elegida: no arranca | FR-017 |

## 2. Prueba manual

```bash
npm run dev
```

1. **Cinco dedos › Aprender**: sin tocar «Bucle», todo funciona como antes.
2. Activar **Bucle**: el estado pide el compás de inicio. Tocar el compás 2 y luego el 3: quedan
   resaltados y la barra muestra «Compases 2–3». Empezar: solo se piden esas notas y, tras la
   última, se vuelve a la primera del compás 2 con «Repetición 2 · anterior …».
3. Pulsar **+** de fin: pasa a «Compases 2–4». Con la práctica en marcha, tocar otro compás: la
   práctica se detiene y empieza una selección nueva.
4. Cambiar a **Escuchar** sin volver a marcar: suena solo el fragmento, en bucle, sin pausa.
5. Cambiar a **Tocar**: cuatro clics de cuenta atrás, el fragmento, un compás de descanso con
   clics y «Otra vez… 4, 3, 2, 1», y la siguiente repetición sin perder el pulso.
6. Pulsar **Parar** tras varias repeticiones: panel con número de repeticiones, la mejor y la
   última. Ir a **Progreso**: las estrellas de la pieza no han cambiado, el tiempo practicado sí.
7. **Pregunta y respuesta**, mano **Izquierda**, marcar un compás donde solo toca la derecha y
   pulsar Empezar en Aprender: aviso de que no hay notas de esa mano; no arranca.
8. **Himno a la alegría a dos manos**, mano **Derecha**, bucle en Tocar: la izquierda suena solo
   dentro del fragmento y se repite con él.
9. **Minueto en Sol** (3/4): fragmento de dos compases en Tocar; el descanso dura 3 pulsos.
10. Salir a Canciones y volver a la pieza: el bucle está desactivado.
11. Repetir 2 con el teclado del ordenador y, si hay, con MIDI.
12. Móvil en horizontal (o modo responsive): partitura, controles del bucle y teclado caben sin
    desplazamiento, y tocar compases con el dedo es fiable (SC-006).
