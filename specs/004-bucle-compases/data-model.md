# Data Model: Bucle de compases

Todo vive en memoria mientras el alumno está en la lección; nada se guarda en `localStorage`
(ver [research.md](research.md), R6 y R8).

## Selección de fragmento (`FragmentSelection`, pantalla)

Estado de `LessonView`, manipulado con funciones puras de `src/engine/fragment.ts`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `on` | `boolean` | Bucle activado. |
| `a` | `number \| null` | Primer extremo marcado (compás, base 0). |
| `b` | `number \| null` | Segundo extremo; `null` mientras falta el segundo toque. |

- **Rango efectivo**: `{ from: min(a, b), to: max(a, b) }` solo si `on && a !== null && b !== null`;
  si no, no hay fragmento y la práctica recorre la pieza entera (FR-004).
- **Validación**: `0 ≤ from ≤ to < measures`.
- **Transiciones**:

```text
desactivado ──activar──▶ vacío (a=b=null) ──toque i──▶ medio (a=i) ──toque j──▶ completo (a=i, b=j)
completo ──toque k──▶ medio (a=k)          completo ──±1 inicio/fin──▶ completo (con límites)
cualquier estado ──desactivar──▶ desactivado (a=b=null)
```

## Fragmento (`LoopRange`, motor)

`LessonOptions.loop?: { from: number; to: number }` (compases, base 0, inclusivos).

| Derivado | Fórmula | Uso |
|----------|---------|-----|
| `start` | `from · bar` | primer pulso del fragmento |
| `end` | `(to + 1) · bar` | pulso donde acaba el fragmento |
| `L` | `end − start` | duración en pulsos |
| `P` | `L` (Escuchar), `L + bar` (Tocar) | período de repetición |
| notas del fragmento | `start ≤ n.s < end` | las únicas que suenan, se piden o puntúan |

## Repetición (`Repetition`, motor)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `n` | `number` | Número de orden (1, 2, …). |
| `result` | `LessonResult \| null` | Resultado con el criterio del paso; `null` en Escuchar. |

- Se cierra: **Escuchar**, al empezar una vuelta nueva (cambia `k`), antes de hacer sonar las
  notas de ese fotograma; **Tocar**, al pasar `local ≥ L + HIT_WINDOW + 0.15` (dentro del compás
  de descanso); **Aprender**, al completar el último grupo y sonar el acompañamiento hasta `end`
  o, en «A tempo», cuando `pos ≥ end`.
- Al cerrarse se reinician `played`, `done`, `judged` y las marcas de las notas del fragmento,
  y el contador de fallos/teclas extra de la repetición.

## Resumen de la sesión de bucle (`LoopSummary`, motor → pantalla)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `reps` | `number` | Repeticiones completas. |
| `best` | `LessonResult` | La de mayor `score`. |
| `last` | `LessonResult` | La última completa. |

`Lesson.loopSummary()` devuelve `null` en Escuchar o si `reps === 0`.

## Efecto en datos persistentes

| Dato | Sin bucle | Con bucle |
|------|-----------|-----------|
| `progress.best` (estrellas) | igual que hoy | **no cambia** |
| `progress.last` (paso, mano, progreso) | igual que hoy | **no cambia** |
| `progress.days` (tiempo practicado) | igual que hoy | se suma |
| `settings` | igual que hoy | sin campos nuevos |
