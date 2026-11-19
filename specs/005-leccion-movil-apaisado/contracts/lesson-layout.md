# Contract: disposición compacta de la lección

Cambios **aditivos**: sin las props nuevas y fuera del modo compacto, `Staff`, `Keyboard`,
`TopBar` y `LessonScreen` se ven y se comportan como hoy (FR-013, SC-005). El motor
(`src/engine/`) no cambia. Términos en [data-model.md](../data-model.md).

## 1. Funciones puras (`src/ui/layout.ts`)

```ts
/** Escala para que `content` quepa en `avail`; nunca amplía ni baja de `min`. */
export function fitScale(content: number, avail: number, min = 0.55): number;

/**
 * Desplazamiento horizontal del teclado para que las teclas blancas `targets` (índices) se
 * vean con `margin` teclas de margen. Devuelve `left` si ya se ven, y siempre un valor en
 * [0, max(0, whites·keyW − view)].
 */
export function keyScroll(args: {
  targets: number[];   // índices de tecla blanca; vacío → devuelve left
  whites: number;      // número de teclas blancas
  keyW: number;        // ancho de una tecla blanca en pantalla
  view: number;        // ancho visible
  left: number;        // desplazamiento actual
  margin?: number;     // en teclas; 1 por defecto
}): number;
```

- `fitScale(200, 120)` → 0,6; `fitScale(100, 300)` → 1; `fitScale(400, 100)` → 0,55;
  `content ≤ 0` o `avail ≤ 0` → 1.
- `keyScroll`: si las teclas guiadas no caben juntas en `view`, prioriza la más grave.

## 2. Hook (`src/ui/useCompactLesson.ts`)

```ts
export const COMPACT_QUERY = "(orientation: landscape) and (max-height: 500px)";
export function useCompactLesson(): boolean;
```

Sin `matchMedia` (tests, SSR) devuelve `false`.

## 3. Componentes

### `Staff` (`src/components/Staff.tsx`)

| Prop nueva | Tipo | Efecto |
|------------|------|--------|
| `fit` | `boolean` (opcional) | Recorta el `viewBox` vertical al contenido y escala el `<svg>` al alto del contenedor con `fitScale`. `scrollTo(x)` usa `x · scale`; `onMeasure` recibe `measureAt(score, xPantalla / scale)`. |

### `Keyboard` (`src/components/Keyboard.tsx`)

| Prop nueva | Tipo | Efecto |
|------------|------|--------|
| `fit` | `boolean` (opcional) | Alto = 100 % del contenedor (ignora `height`); `minWidth = whites · 28`; sin letras; al cambiar `guide`, desplaza `.kb-wrap` con `keyScroll`. |

### `Popover` (`src/components/Popover.tsx`, nuevo)

```ts
interface PopoverProps {
  open: boolean;
  onClose(): void;
  label: string;              // aria-label del diálogo
  anchor: "start" | "end";    // alineado a la izquierda o derecha de su botón
  children: ReactNode;
}
```

- Capa `role="dialog"` posicionada sobre la lección; cierra con toque fuera, botón de cerrar o
  Escape. No captura las teclas de nota (no es un campo de texto).

### `TopBar`

Sin cambios de interfaz. `LessonScreen` no lo renderiza en modo compacto y muestra su
contenido equivalente (título, estado MIDI, Ajustes) en el panel de opciones.

## 4. Pantalla de lección (`src/screens/LessonScreen.tsx`) en modo compacto

| Zona | Contenido |
|------|-----------|
| Fila de práctica | Atrás · pasos (elegido con nombre, resto solo número, `aria-label` completo) · mano (solo dos manos) · Empezar/Parar · Bucle (+ «X–Y ▾» con fragmento) · Opciones |
| Partitura | `Staff fit` |
| Estado | barra de una línea, recorte con «…» |
| Teclado | `Keyboard fit` |
| Panel «options» | título, ayuda del paso, tempo, «A tempo» (Aprender), nombres, dedos, estado MIDI, Ajustes |
| Panel «loop» | botones ±1 de inicio y fin (`nudge` / `canNudge`) |
| Resultado | tarjeta superpuesta con Repetir, Siguiente paso (si aplica) y Cerrar |

- Zonas táctiles ≥ 40 × 40 (FR-010), salvo teclas negras.
- Ninguna prop ni efecto que cree la `Lesson` depende de `compact` o `panel`.
