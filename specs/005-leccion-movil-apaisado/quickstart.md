# Quickstart: validar «Lección en móvil apaisado»

## Requisitos

- `npm install`.
- Chrome o Edge con las herramientas de desarrollo (modo responsive) y, si es posible, un móvil
  real en la misma red (`npm run dev -- --host`).

## 1. Tests automáticos

```bash
npm test
npm run build   # tipos + compilación
```

Esperado: todo en verde, los tests existentes sin cambios y los nuevos de
`src/ui/layout.test.ts` ([contrato §1](contracts/lesson-layout.md)):

| Escenario | Spec |
|-----------|------|
| `fitScale` reduce, no amplía, no baja de 0,55 y tolera ceros | FR-002, SC-006 |
| `keyScroll` no se mueve si las guiadas se ven; las trae con una tecla de margen; respeta límites; prioriza la más grave | FR-004 |

## 2. Prueba manual

`npm run dev`, modo responsive en **640 × 320** salvo que se indique otra cosa.

1. **Himno a la alegría a dos manos**, Aprender: la página no se desplaza; se ven fila de
   práctica, los dos pentagramas enteros, estado y teclado completo. Tocar varias notas.
2. Cambiar a Escuchar y a Tocar desde la fila; elegir mano Derecha: un toque cada cosa.
3. Abrir **Opciones**: título, ayuda, tempo, nombres, dedos, MIDI y Ajustes; subir el tempo en
   Tocar con la práctica en marcha: no se detiene. Cerrar tocando fuera.
4. Activar **Bucle**, marcar compases 2–3: aparece «2–3 ▾»; abrirlo y pulsar fin «+»: «2–4».
5. Terminar Aprender de **Cinco dedos**: el resultado aparece encima, Repetir y Cerrar funcionan
   y la disposición no cambia.
6. **Canon** y **Preludio**: el teclado (no la página) se desplaza solo hasta la nota guiada.
7. Las 12 piezas × 3 pasos (y mano en las de dos manos): nunca hay desplazamiento de página
   (SC-001/002). Comprobar también 667 × 375 y 844 × 390.
8. Girar a vertical durante Tocar: aviso de girar; volver a horizontal: la lección sigue.
9. Tema oscuro y notación C‑D‑E: se respetan en fila, paneles, partitura y teclado.
10. Escritorio 1280 × 800 y tablet 1024 × 768: la lección se ve exactamente como antes
    (SC-005).
11. Móvil real: con la barra del navegador visible y oculta, y como app instalada; acertar teclas
    con el dedo (SC-003) y leer la nota pendiente a un brazo (SC-006); nada bajo la muesca.
12. Con teclado del ordenador y, si hay, MIDI: las notas llegan también con un panel abierto.
