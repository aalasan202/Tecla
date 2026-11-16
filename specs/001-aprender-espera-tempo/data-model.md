# Data Model: Aprender con espera a tempo

No hay datos nuevos en servidor ni cambios en el formato de las canciones. Hay un ajuste
persistente nuevo y estado de ejecución nuevo dentro del motor.

## Ajustes (persistente, navegador)

`Settings` en `src/state/settings.ts`, clave `tecla-settings`.

| Campo | Tipo | Defecto | Notas |
|-------|------|---------|-------|
| `learnAtTempo` | `boolean` | `false` | Nuevo. Si Aprender empieza en modo «A tempo» (FR-013). |

- **Migración**: ninguna. `createStore` mezcla los valores por defecto con lo guardado, así que
  los ajustes antiguos reciben `learnAtTempo: false`.
- **Validación**: cualquier valor distinto de `true` se trata como desactivado.

## Práctica de Aprender (en memoria, motor)

Estado de una instancia de `Lesson` con `mode = "learn"` y `atTempo = true`. Lo existente se
reutiliza; lo nuevo va marcado.

| Campo | Tipo | Origen | Descripción |
|-------|------|--------|-------------|
| `atTempo` | `boolean` | **nuevo**, constructor | Modo de espera: libre (`false`) o a tempo (`true`). |
| `tempo` | `number` (ppm) | existente | Leído en cada fotograma; 40–140 en la interfaz. |
| `hands` | `HandChoice` | existente | Decide qué notas son del alumno y cuáles automáticas. |
| `groups` | `ScoreNote[][]` | existente | Notas del alumno agrupadas por pulso de inicio. |
| `gi` | `number` | existente | Índice del grupo pendiente (el siguiente a tocar). |
| `mistakes` | `number` | existente | Teclas equivocadas. |
| `pos` | `number` (pulsos) | **nuevo** | Posición musical virtual del cursor. |
| `lastFrame` | `number` (ms) | **nuevo** | Instante del último fotograma, para calcular Δ. |
| `rt[id].done` | `boolean` | existente | Nota del alumno ya acertada. |
| `rt[id].played` | `boolean` | existente | Nota automática ya sonada. |

**Derivados**:

- `sPendiente = groups[gi]?.[0].s ?? ∞`: pulso donde el cursor debe esperar.
- `waiting = pos ≥ sPendiente`: el cursor está detenido sobre la nota pendiente.

### Reglas

- `pos` empieza en 0 y nunca decrece. En cada fotograma:
  `pos = min(pos + (now − lastFrame) / 1000 / (60 / tempo), sPendiente)`.
- Una pulsación `m` es **acierto** si `m` pertenece a `groups[gi]` y esa nota no está hecha.
- Una pulsación es **fallo** si `m` no pertenece a `groups[gi]` (suma `mistakes`).
- Una pulsación de una nota ya hecha del grupo actual es **neutra** (suena, sin efecto).
- Al completarse `groups[gi]`, `gi` avanza; si el cursor estaba detenido, reanuda desde `pos`
  (que coincide con el pulso de esa nota), sin salto.
- Una nota automática `n` suena una sola vez cuando `pos ≥ n.s` y `n.s < sPendiente`.
- **Fin**: cuando `gi = groups.length` y `pos > total + 0,6`, se llama a `complete()`.
- **Resultado**: igual que Aprender: `score = n / (n + mistakes)`, `stars = starsFor(score)`.
- **Progreso** (`progress()`): `gi / groups.length`, igual que Aprender.

### Transiciones del cursor

```text
            Empezar
               │
               ▼
        ┌─────────────┐  pos alcanza sPendiente   ┌─────────────┐
        │  Avanzando  │ ────────────────────────► │  Detenido   │
        │ (pos crece) │ ◄──────────────────────── │ (pos fijo)  │
        └─────────────┘  se completa el grupo     └─────────────┘
               │
               │ sin grupos pendientes y pos > total + 0,6
               ▼
          Terminada ── finish(result)

  Parar / cambiar de paso, mano u opción «A tempo» desde cualquier estado → detenida (stop)
```
