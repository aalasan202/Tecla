# Quickstart: validar «Aprender con espera a tempo»

## Requisitos

- Node y dependencias instaladas (`npm install`).
- Navegador Chrome o Edge (para probar también con teclado MIDI, opcional).

## 1. Tests automáticos

```bash
npm test
npm run build   # comprobación de tipos + compilación
```

Esperado: todo en verde, incluidos los tests existentes de Aprender y Tocar sin modificar
(SC-004) y los nuevos de «A tempo» en `src/engine/lesson.test.ts`, que cubren:

| Escenario | Spec |
|-----------|------|
| Tocando cada nota a su tiempo el cursor no se detiene y la práctica dura lo que la pieza | US1-1/2, SC-001 |
| Sin tocar, el cursor queda fijo en el pulso de la primera nota pendiente | US1-3, FR-005 |
| Al tocar la nota pendiente, el cursor sigue desde esa posición | US1-4, FR-006 |
| Tecla equivocada: suma un fallo y el cursor no avanza | US1-5, FR-007 |
| Acorde a medias: el cursor sigue detenido | US3-3, FR-008 |
| Una sola mano: el acompañamiento posterior no suena mientras se espera | US3-2, SC-003 |
| Cambiar `tempo` cambia la velocidad sin salto de posición | US2-2, FR-010 |
| Resultado igual que Aprender (`n / (n + fallos)`) | US1-6, FR-012 |
| `atTempo` se ignora fuera de Aprender | contrato |

## 2. Prueba manual

```bash
npm run dev
```

1. Abrir **Canciones › Cinco dedos › Aprender**. Comprobar que aparece la casilla «A tempo»
   desactivada y que el control Tempo está oculto (comportamiento actual intacto).
2. Activar «A tempo»: aparece el control Tempo con 80 ppm. Pulsar **Empezar**.
3. Tocar cada nota cuando llega el cursor: el cursor no se detiene en ninguna.
4. Dejar de tocar: el cursor se detiene sobre la nota resaltada y la barra de estado indica
   «Toca: …». Tocarla: el cursor sigue sin saltar.
5. Pulsar una tecla equivocada: suena, se marca en rojo y el contador de fallos sube.
6. Bajar el tempo a 40 durante la práctica: el cursor va más lento sin reiniciar.
7. Terminar la pieza: aparecen porcentaje, estrellas y «Siguiente paso».
8. Abrir **Himno a la alegría a dos manos**, elegir **Derecha**, Aprender con «A tempo»: la mano
   izquierda suena sola y se detiene a la vez que el cursor.
9. Recargar la página y abrir otra canción en Aprender: «A tempo» sigue activado.
10. Repetir 3–4 con el teclado del ordenador y, si hay, con un teclado MIDI.
11. En un móvil en horizontal (o el modo responsive del navegador), comprobar que partitura,
    controles y teclado caben sin desplazamiento (SC-006).
