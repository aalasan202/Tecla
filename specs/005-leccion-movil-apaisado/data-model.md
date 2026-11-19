# Data Model: Lección en móvil apaisado

Funcionalidad solo de presentación: no hay entidades nuevas en el motor ni datos guardados.
Todo lo de abajo es estado efímero de la interfaz (ver [research.md](research.md)).

## Modo compacto (`compact`, pantalla)

| Campo | Tipo | Origen |
|-------|------|--------|
| `compact` | `boolean` | `useCompactLesson()`: `matchMedia("(orientation: landscape) and (max-height: 500px)")`, actualizado en cada `change` |

- No se guarda; cambia con el giro, la barra del navegador o el tamaño de ventana (FR-012).
- Cambiar `compact` MUST NOT recrear la `Lesson` (no está en las dependencias de su efecto).

## Paneles superpuestos (`LessonView`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `panel` | `"options" \| "loop" \| null` | Panel abierto; como mucho uno a la vez. |

- Transiciones: `null ──Opciones──▶ "options"`, `null ──«2–3 ▾»──▶ "loop"`,
  cualquier panel `──tocar fuera / cerrar / Escape──▶ null`.
- Pasar a no compacto cierra el panel (`panel = null`).
- `"loop"` solo es alcanzable con `rangeOf(sel) !== null`; si el fragmento deja de estar
  completo (bucle desactivado o toque nuevo en la partitura) el panel se cierra.
- Abrir o cerrar un panel no cambia `running` (FR-007).

## Escala de la partitura (`Staff` con `fit`)

| Derivado | Fórmula |
|----------|---------|
| `content` | alto del contenido dibujado (`getBBox`) + 2 · 6 de margen |
| `avail` | alto de la fila de la partitura (`ResizeObserver`) |
| `scale` | `fitScale(content, avail)` = `clamp(avail / content, 0.55, 1)` |
| pantalla → partitura | `xPartitura = xPantalla / scale` |
| partitura → pantalla | `xPantalla = xPartitura · scale` |

## Desplazamiento del teclado (`Keyboard` con `fit`)

| Entrada | Descripción |
|---------|-------------|
| `whites` | teclas blancas del rango (`keyboardRange`) |
| `targets` | índices de tecla blanca de las notas guiadas (una negra cuenta como su blanca de la izquierda) |
| `view`, `content` | ancho visible y ancho total del teclado |
| `left` | desplazamiento actual |

Salida: nuevo `left` con `keyScroll(...)`; igual a `left` si todas las teclas guiadas ya se
ven con una tecla de margen.

## Efecto en datos persistentes

Ninguno: sin campos nuevos en `settings` ni en `progress`.
