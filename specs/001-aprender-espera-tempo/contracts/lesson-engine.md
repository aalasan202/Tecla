# Contract: motor de lección (`src/engine/lesson.ts`)

Interfaz entre la pantalla de lección y el motor. Los cambios son **aditivos**: las llamadas y
los tests existentes siguen siendo válidos sin modificación (SC-004).

## Constructor

```ts
export interface LessonOptions {
  /** Solo en mode = "learn": la partitura avanza a tempo y espera las notas pendientes. */
  atTempo?: boolean; // por defecto false
}

new Lesson(score, mode, hands, tempo, host, options?: LessonOptions)
```

- `options.atTempo` se ignora si `mode !== "learn"`.
- `readonly atTempo: boolean` queda expuesto en la instancia.

## `LessonHost`

Sin cambios de forma. Uso en modo a tempo:

| Callback | Cuándo se llama en «A tempo» |
|----------|------------------------------|
| `frame(cb)` / `cancelFrame(id)` | Bucle continuo mientras la práctica corre, también detenida. |
| `now()` | En cada fotograma, para calcular el avance del cursor. |
| `playhead(x)` | Cada fotograma con `x = STAFF_LEFT + pos·px + 16`; `null` al terminar. |
| `scrollTo(x, false)` | Cada fotograma, siguiendo al cursor. |
| `mark(id, "now")` | Notas del grupo pendiente y notas automáticas al sonar. |
| `mark(id, "hit")` | Nota del alumno acertada. |
| `guide(notes)` | Siempre el grupo pendiente sin hacer; `[]` al terminar. |
| `tone` / `flash` | Igual que Aprender (acierto, fallo, nota neutra) y acompañamiento. |
| `status(text, next)` | `text = "Compás X de Y · N fallos"`; `next = "Toca: <notas>"` mientras haya grupo pendiente. |
| `click` | No se usa (sin metrónomo ni cuenta atrás). |
| `finish(result)` | Una vez, con `mode: "learn"`. |

## Métodos públicos

| Método | Comportamiento en «A tempo» |
|--------|-----------------------------|
| `start()` | `pos = 0`, `gi = 0`, `mistakes = 0`, arranca el bucle. Si no hay notas del alumno, termina. |
| `stop()` | Detiene el bucle y los temporizadores; limpia la guía. Sin cambios. |
| `input(m)` | Reglas de acierto / fallo / neutra de [data-model.md](../data-model.md). |
| `tempo` (campo) | Puede cambiarse en cualquier momento; afecta desde el siguiente fotograma, sin salto. |
| `progress()` | `gi / groups.length`. |
| `result()` | Igual que Aprender. |

## Contrato de interfaz (pantalla de lección)

- En el paso **Aprender** aparece una casilla **«A tempo»** en la barra de controles, ligada a
  `settings.learnAtTempo`. En Escuchar y Tocar no aparece.
- El control **Tempo** es visible en Escuchar, Tocar y en Aprender solo si «A tempo» está
  activado.
- El texto de ayuda de Aprender con «A tempo» activado explica que la partitura avanza sola y se
  detiene en la nota hasta que la toques.
- Cambiar la casilla recrea la lección (detiene la práctica en curso y guarda el intento).
