# Research: Lección en móvil apaisado

Decisiones tomadas a partir de la spec, sus aclaraciones y el código actual
(`src/screens/LessonScreen.tsx`, `src/components/Staff.tsx`, `src/components/Keyboard.tsx`,
`src/components/TopBar.tsx`, `src/styles.css`).

## R0. Medidas de partida (640 × 320 puntos)

| Elemento hoy | Alto |
|--------------|------|
| `body` (relleno arriba/abajo en apaisado) | 12 + 14 |
| `TopBar` (botones de 44) | 44 |
| cabecera + pasos + ayuda + controles (con `gap: 12`) | ≈ 190 |
| partitura (`Staff`: 178 una mano, 262 dos manos) | 178 / 262 |
| barra de estado | ≈ 40 |
| teclado (`Keyboard`, `height` 170) | 170 |
| **Total (dos manos)** | **≈ 750** frente a 320 disponibles |

Teclas blancas por pieza (`keyboardRange`, mín. 28 puntos cada una): `cinco`, `oda`,
`estrellita`, `luna` 10; `martinillo`, `minueto` 11; `elisa` 14; `pregunta`, `oda2` 15;
`estrellita2` 16; `preludio` 23; `canon` 27. Con ≈ 616 puntos de ancho útil caben 22: todas
caben enteras salvo `preludio` (644) y `canon` (756), que necesitan el seguimiento de R5.

## R1. Cuándo se aplica la disposición compacta

- **Decision**: la misma condición que ya usan Inicio y Piano libre:
  `(orientation: landscape) and (max-height: 500px)`. En CSS, con una media query; en React,
  con un hook `useCompactLesson()` (`matchMedia` + escucha de `change`) que la pantalla usa para
  decidir qué controles van en la fila y cuáles en el panel de opciones.
- **Rationale**: coherencia con el resto de la app; deja intactos escritorio y tablet
  (FR-013, SC-005). Escuchar `change` cubre el giro y la barra del navegador (FR-012).
- **Alternatives considered**: solo CSS, duplicando los controles y ocultando una copia: dos
  `<input>` por ajuste, foco y lectores de pantalla duplicados.

## R2. Disposición en rejilla de altura fija

- **Decision**: en modo compacto, `.screen.lesson` ocupa exactamente la altura visible
  (`100dvh` menos las zonas seguras) como una rejilla de cuatro filas:
  `fila de práctica (44) / partitura (1fr) / barra de estado (24) / teclado (clamp(110px, 34dvh, 170px))`,
  con huecos de 6 y relleno de 6 + zonas seguras. El `TopBar` no se muestra en la lección
  compacta: Atrás pasa a la fila de práctica; el título, el estado MIDI y el acceso a Ajustes
  pasan al panel de opciones. La línea informativa (nivel, notas, compases) se oculta.
- **Rationale**: a 320 de alto quedan ≈ 120 puntos para la partitura
  (320 − 12 − 44 − 24 − 110 − 18), suficiente para los dos pentagramas recortados (R3).
  `dvh` sigue a la barra del navegador sin JavaScript.
- **Alternatives considered**: columna lateral de controles (descartada en la aclaración 1);
  dos filas de controles (deja la partitura a dos manos ilegible).

## R3. Partitura escalada al alto disponible

- **Decision**: `Staff` recibe `fit?: boolean`. Con `fit`, mide el contenido real del `<svg>`
  (`getBBox()` del grupo de notas y pentagramas, recalculado al cambiar partitura, nombres o
  dedos), ajusta el `viewBox` vertical a ese contenido (más un margen de 6) y calcula
  `scale = fitScale(altoContenido, altoDisponible)` con un `ResizeObserver` sobre su contenedor.
  El `<svg>` se dibuja con `height = altoContenido · scale` y `width = ancho · scale`. Los dos
  métodos que usan coordenadas de pantalla se corrigen con la escala: `scrollTo(x)` desplaza a
  `x · scale` y el clic del bucle calcula `measureAt(score, xPantalla / scale)`. El cursor
  (`setPlayhead`) sigue en unidades del `viewBox` y no cambia.
- `fitScale(content, avail)` = `clamp(avail / content, 0.55, 1)`: nunca se amplía y nunca baja
  de 0,55 (interlineado ≥ 6,6 puntos, cabezas de nota ≈ 6 puntos: legibles a 40 cm, SC-006).
  Recortado, el pentagrama doble mide ≈ 180 (≈ 210 con nombres): a 120 de alto, escala 0,57–0,67.
- **Rationale**: escalar el SVG conserva toda la lógica de dibujo y el motor no se entera
  (Principio I; «un cambio de diseño MUST NOT requerir cambios en el motor»). Sin `fit`,
  `Staff` es idéntico a hoy.
- **Alternatives considered**: recalcular la geometría de la partitura con otro `H`: toca todo
  el dibujo y los tests de `score.ts`; zoom CSS (`transform`): rompe el desplazamiento y el clic.

## R4. Fila de práctica y paneles superpuestos

- **Decision** (aclaraciones 1 y 4), presupuesto a 616 puntos de ancho:

  | Control | Ancho |
  |---------|-------|
  | Atrás (icono) | 40 |
  | Pasos: el elegido con número y nombre, los otros solo número (con `aria-label`) | ≈ 166 |
  | Mano (dos manos): «Ambas» + dos puntos de color con `aria-label` Derecha/Izquierda | ≈ 132 |
  | Empezar / Parar | ≈ 92 |
  | Bucle (casilla) y, con fragmento, botón de rango «2–3 ▾» | ≈ 76 / ≈ 110 |
  | Opciones (icono) | 40 |
  | huecos (6 × 6) | 36 |
  | **Total** | **≈ 580 / ≈ 616** |

- **Panel de opciones** (botón Opciones): título de la pieza, ayuda del paso (FR-008), tempo,
  «A tempo» (solo en Aprender), nombres de nota, números de dedo, estado MIDI y enlace a
  Ajustes. Se abre por encima de la partitura (posición fija, anclado arriba a la derecha, alto
  máximo = alto visible − 12, con desplazamiento interno si hiciera falta), se cierra tocando
  fuera, con su botón o con Escape, y no detiene la práctica (FR-007).
- **Panel del bucle** (botón «2–3 ▾»): los cuatro botones ±1 con `canNudge`, igual que hoy.
- Los paneles son un único componente `Popover` (`src/components/Popover.tsx`) sin
  dependencias: botón ancla + capa con `role="dialog"`, cierre al tocar fuera.
- Las teclas del ordenador siguen llegando con un panel abierto: `Keyboard` ya ignora solo
  `INPUT`/`TEXTAREA`/`SELECT` de texto.
- **Alternatives considered**: botones ±1 en línea (no caben, aclaración 4); ayuda con un
  botón propio en la fila (no cabe: +46).

## R5. Teclado en modo compacto

- **Decision**: `Keyboard` recibe `fit?: boolean`. Con `fit`, el alto lo da la rejilla (100 %
  de su fila) en lugar de `height`, el ancho mínimo por tecla blanca baja de 34 a 28
  (`minWidth = whites · 28`) y las letras del teclado del ordenador se ocultan (como ya pasa con
  `hover: none`). Si el teclado es más ancho que su contenedor (`preludio`, `canon`), al cambiar
  `guide` se desplaza el `.kb-wrap` lo justo para que las teclas guiadas queden visibles con un
  margen de una tecla: `keyScroll(...)` puro (ver contrato). La página nunca se desplaza.
- **Rationale**: FR-004 con el mínimo de 28; el seguimiento evita que la nota pendiente quede
  fuera en las dos piezas anchas.

## R6. Resultado superpuesto

- **Decision**: en modo compacto, `.result` se muestra como tarjeta fija centrada sobre la
  partitura, con botón de cerrar (además de Repetir y Siguiente paso). Cerrar solo hace
  `setResult(null)`. En escritorio sigue en su sitio actual.
- **Rationale**: FR-009 sin tocar la lógica del resultado.

## R7. Zonas seguras, giro y estado

- `index.html` ya declara `viewport-fit=cover`, así que `env(safe-area-inset-*)` funciona; la
  rejilla usa `max(6px, env(safe-area-inset-*))` en los cuatro lados (FR-011).
- Al girar a vertical, `.app` se oculta por CSS y React no se desmonta: la lección, el fragmento
  y la práctica en marcha se conservan (caso límite «girar durante la práctica»).
- Textos largos del estado: una línea con `text-overflow: ellipsis`.

## R8. Pruebas

- Puras con Vitest: `fitScale` y `keyScroll` en `src/ui/layout.ts` (+ `layout.test.ts`).
- El resto es presentación: verificación manual en escritorio, tablet y móvil apaisado
  (Principio II) con la lista de [quickstart.md](quickstart.md). Los tests existentes no cambian.
