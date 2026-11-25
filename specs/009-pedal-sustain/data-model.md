# Data Model: Pedal de resonancia (sustain)

## PedalSpan (nuevo, `src/music/types.ts`)

```ts
/** Tramo con el pedal de resonancia pisado: [pulso de inicio, pulso de fin), en negras. */
export type PedalSpan = [from: number, to: number];
```

| Campo | Tipo | Regla |
|-------|------|-------|
| `from` | pulsos (negras) | Múltiplo de 1/48; ≥ 0; coincide con el inicio de alguna nota de la pieza |
| `to` | pulsos (negras) | Múltiplo de 1/48; `to > from`; coincide con el inicio de una nota o con el final de la pieza (`score.total`) |

**Cambio de pedal**: dos tramos consecutivos con `a.to === b.from`. No hay un tipo aparte.

## SongDef (ampliado)

```ts
interface SongDef {
  // … campos existentes sin cambios …
  /** Tramos de pedal de resonancia, ordenados y sin solaparse. Solo se usan desde el nivel 3. */
  pedal?: PedalSpan[];
}
```

### Reglas de validación (`validateSong`, FR-002, FR-004)

1. Cada tramo tiene `from` y `to` múltiplos de 1/48 de negra y `from < to`.
2. Los tramos están ordenados y no se solapan: `prev.to <= next.from`.
3. `from` coincide con el inicio de una nota (de cualquier mano) y `to` con el inicio de una
   nota o con el final de la pieza.
4. `to <= total` de la pieza.
5. **Solo en el repertorio incluido** (test de `repertoire`, no `validateSong`, que también
   valida las importadas): una pieza con `pedal` tiene nivel ≥ 3 y su `level` contiene
   «Pedal»; una sin `pedal` no lo contiene (R11).

Cada incumplimiento produce un mensaje que nombra la regla, como el resto de `validateSong`.

## Score (ampliado, `buildScore`)

```ts
interface Score {
  // … campos existentes …
  /** Tramos de pedal en uso: los de la pieza si su nivel es ≥ 3; si no, vacío (R3). */
  pedals: PedalSpan[];
}
```

`levelOf(song)` se mueve de `src/screens/Songs.tsx` a `src/music/level.ts` (Songs.tsx lo importa
de ahí).

## RawPiece (ampliado, importación)

```ts
interface RawPiece {
  // … campos existentes …
  /** Tramos de pedal leídos del archivo, en pulsos de negra sin cuantizar. */
  pedal?: [number, number][];
}
```

`MidiEvent` gana `{ tick, type: "pedal", channel, down: boolean }`.

## Funciones puras nuevas (`src/music/pedal.ts`)

Detalle de la interfaz en [contracts/pedal.md](contracts/pedal.md).

| Función | Uso |
|---------|-----|
| `sustainedEnd(s, d, pedals)` | Fin del sonido de una nota con el pedal (R4) |
| `pedalMarks(pedals)` | Ganchos, muescas y líneas que dibujar (R7) |
| `clipPedals(pedals, from, to)` | Tramos recortados al fragmento del bucle (R8) |
| `fitPedals(spans, song)` | Ajusta los tramos importados a las notas de la pieza (R9) |
| `validatePedal(song)` | Reglas 1–4, llamada desde `validateSong` |

## Settings (ampliado)

| Campo | Tipo | Por defecto | Uso |
|-------|------|-------------|-----|
| `pedalHelpSeen` | `boolean` | `false` | La explicación de primera vez ya se cerró (FR-011) |

## Estado de audio (no persistente, `src/audio/synth.ts`)

| Estado | Transiciones |
|--------|--------------|
| `sustain: boolean` | `setSustain(true)` al pisar el pedal MIDI; `setSustain(false)` al soltarlo o al desconectar el dispositivo |
| Voces activas (piano y sintetizador) | Se registran en `playTone`; `releaseAll()` las apaga todas; con `sustain`, el apagado se aplaza hasta soltar el pedal (como mucho `SUSTAIN_MAX`) |

## LessonHost (ampliado)

```ts
interface LessonHost {
  // … existentes …
  /** Apaga todo lo que suena (al parar y al empezar cada repetición del bucle). */
  release?(): void;
}
```
