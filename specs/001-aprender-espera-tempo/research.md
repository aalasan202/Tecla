# Research: Aprender con espera a tempo

No quedaban `NEEDS CLARIFICATION` en el contexto técnico: el stack (Vite + React + TypeScript +
Vitest) y la arquitectura (motor sin DOM con `LessonHost`) ya existen. La investigación se centra
en las decisiones de diseño del motor.

## R1. Cómo modelar el tiempo: reloj virtual frente a reloj de pared

- **Decision**: el modo a tempo usa una **posición musical virtual** `pos` (en pulsos) que el bucle
  de animación hace avanzar en cada fotograma con `pos += (now − últimoFrame) / 1000 / spb`, y que
  se limita a la posición de la primera nota pendiente: `pos = min(pos + Δ, sPendiente)`.
- **Rationale**: con un reloj virtual, detenerse, reanudar y cambiar el tempo son triviales y sin
  saltos (FR-006, FR-010): pausar es no sumar, y un tempo nuevo solo cambia el `spb` de los
  siguientes incrementos. Tocar calcula el pulso como `(now − t0) / spb`, lo que haría saltar el
  cursor al cambiar el tempo o al reanudar.
- **Alternatives considered**:
  - Reutilizar `t0` y desplazarlo al reanudar (`t0 += duración de la pausa`): funciona para la
    pausa pero no para el cambio de tempo en caliente; habría que reanclar `t0` en cada cambio.
  - Temporizadores (`setTimeout`) por grupo, como el Aprender actual: no da un cursor continuo.

## R2. Dónde se detiene el cursor y cuándo cuenta una nota "a tiempo"

- **Decision**: el cursor se detiene **exactamente en el pulso de inicio** de la primera nota (o
  acorde) pendiente. Una pulsación correcta del grupo pendiente cuenta en cualquier momento desde
  que ese grupo pasa a ser el siguiente (es decir, en cuanto se completó el anterior), incluido
  antes de que llegue el cursor. Si el alumno toca a tiempo o antes, el cursor no se detiene; si
  toca tarde, el cursor espera sobre la nota exactamente lo que el alumno tarde.
- **Rationale**: es la semántica de "espera" más simple y coherente con el Aprender actual (que
  espera cada nota). Evita los dos problemas del enfoque con margen tras la nota: dejar el cursor
  pasado de la nota o tener que hacerlo retroceder al reanudar (FR-006, "sin saltos visibles").
  Como Aprender solo puntúa por teclas equivocadas, no hace falta clasificar aciertos por cercanía.
- **Alternatives considered**:
  - Margen de gracia de `HIT_WINDOW` (0,45 pulsos) tras la nota antes de detenerse: el cursor se
    pararía ~22 px después de la nota y, al reanudar, o saltaría hacia atrás o adelantaría la
    siguiente nota. Rechazado.
  - Limitar las pulsaciones adelantadas a `HIT_WINDOW` antes de la nota: castiga a quien va por
    delante, contra el caso límite de la spec.
- **Impacto en la spec**: FR-004, el escenario 2 de la Historia 1 y la suposición sobre el margen
  se ajustaron para reflejar esta decisión (la nota cuenta desde que es la siguiente; el margen de
  Tocar no se usa).

## R3. Acompañamiento de la otra mano

- **Decision**: en el bucle, una nota automática suena cuando `pos ≥ n.s` **y** `n.s < sPendiente`
  (con `sPendiente = ∞` si no queda ninguna). Las notas automáticas simultáneas a la nota
  pendiente esperan a que el alumno la toque y suenan en el mismo fotograma en que se completa.
- **Rationale**: cumple SC-003 (nunca suena por delante de una nota pendiente) y mantiene juntos
  los acordes repartidos entre manos, igual que hace hoy `playAutos(from, to)`.
- **Alternatives considered**: hacer sonar las simultáneas al llegar el cursor (`n.s ≤ pos`): el
  acompañamiento sonaría antes que la nota del alumno y la pieza "se adelantaría" al alumno.

## R4. Dónde vive la opción y cómo llega al motor

- **Decision**: nuevo ajuste persistente `learnAtTempo: boolean` (por defecto `false`) en
  `src/state/settings.ts`. La pantalla lo pasa al motor con un sexto parámetro opcional del
  constructor `Lesson`: `{ atTempo?: boolean }`.
- **Rationale**: los ajustes ya se guardan en el navegador con `createStore`, que mezcla los
  valores por defecto con lo guardado, así que no hace falta migración (Principio V). Un parámetro
  opcional mantiene intactas las llamadas y los tests existentes (SC-004). No es un `Mode` nuevo:
  progreso, rutas, resultados y "Continuar" siguen tratando el intento como `learn` (FR-012).
- **Alternatives considered**:
  - Nuevo `Mode = "learnTempo"`: obligaría a tocar `LastSession`, `MODES`, `HINTS`, el resultado y
    la pantalla de progreso. Rechazado por complejidad.
  - Estado local de la pantalla sin persistir: incumple FR-013.

## R5. Cambio de tempo en caliente y cambio de la opción durante la práctica

- **Decision**: el tempo sigue siendo el campo público `tempo` del motor; el reloj virtual lo lee
  en cada fotograma, así que el cambio se aplica sin más. Cambiar «A tempo» con la práctica en
  marcha recrea la lección (como al cambiar de mano o de paso): se detiene y se guarda el intento.
- **Rationale**: no requiere API nueva. Cambiar el modo de espera a mitad de pieza no tiene un
  significado claro y la spec pide activarlo antes de empezar.

## R6. Cómo probar el bucle sin navegador

- **Decision**: en los tests, el `fakeHost` guarda la última función pasada a `frame(cb)` y un
  ayudante `tick(ms)` avanza el reloj falso y la ejecuta. Se usan los temporizadores falsos de
  Vitest para el sonido diferido.
- **Rationale**: respeta el Principio I (el motor no conoce `requestAnimationFrame`) y permite
  probar paradas, reanudación, acompañamiento y tempo de forma determinista (Principio II).
