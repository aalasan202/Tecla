# Data Model: Sonido de piano real

No hay datos del usuario nuevos: ni ajustes ni progreso cambian. Las entidades son de
ejecución, dentro de `src/audio/`.

## Muestra (`PianoSample`)

| Campo | Tipo | Regla |
|-------|------|-------|
| `midi` | número | 21, 24, 27, … 108: múltiplos de 3 desde La0 (21) hasta Do8 (108); 30 valores |
| `file` | texto | nombre derivado de la nota: `A0.mp3`, `C1.mp3`, `Ds1.mp3`, `Fs1.mp3`, … `C8.mp3` |

- La lista es fija y se calcula en `samples.ts`; no hay archivo de índice.
- **Muestra para una nota `m`**: la de `midi` más cercano; en empate, la inferior. Para
  `m` < 21 se usa 21 y para `m` > 108 se usa 108 (la transposición puede superar ±1 semitono
  solo fuera del teclado de 88 teclas).
- **Afinación**: `playbackRate = 2 ** ((m - sample.midi) / 12)`.

## Banco de piano (`PianoBank`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `state` | `"loading" \| "ready" \| "unavailable"` | ver transiciones |
| `buffers` | mapa `midi → AudioBuffer` | solo se usa cuando `state = "ready"` |

### Transiciones de estado

```text
           arranque de la app
                  │
                  ▼
             ┌─────────┐   30 muestras descargadas y decodificadas   ┌───────┐
             │ loading │ ───────────────────────────────────────────▶ │ ready │
             └─────────┘                                               └───────┘
                  │  fallo de red, de decodificación o sin Web Audio
                  ▼
           ┌─────────────┐
           │ unavailable │  (hasta recargar la página)
           └─────────────┘
```

- `loading` y `unavailable` → `playTone` usa el sintetizador.
- `ready` → `playTone` usa el piano. Nunca se vuelve de `ready` a otro estado.

## Voz (`Voice`)

Una nota sonando con el piano: fuente + ganancia, con su nota MIDI y su instante de fin.

- Hay como mucho una voz activa por nota MIDI: al repetir la nota, la anterior se apaga en 30 ms.
- Se elimina del registro al terminar (`onended`).

## Caché

- Nombre: `tecla-piano-v1` (Cache Storage). Clave: la URL de cada muestra.
- Al cambiar las muestras se sube la versión y se borran las cachés `tecla-piano-*` antiguas.
