# Quickstart: validar «Sonido de piano real»

## Requisitos

- Node y dependencias instaladas (`npm install`).
- Las muestras ya están en `public/samples/piano/`. Para volver a descargarlas:
  `node scripts/prepare-piano.mjs` (ver [research.md](research.md) R1–R2).

## 1. Tests automáticos

```bash
npm test
npm run build
```

Esperado: todo en verde. Los tests existentes del motor y la música no cambian (SC-006), y
`src/audio/samples.test.ts` cubre:

| Escenario | Referencia |
|-----------|------------|
| Hay 30 muestras, de 21 a 108, cada 3 semitonos, con nombres `A0`…`C8` | data-model |
| Para cada nota de 21 a 108 la muestra elegida está a ≤ 1 semitono | FR-002 |
| Empate imposible con paso 3; fuera de rango se usa el extremo | data-model |
| `playbackRate` da 1 en la nota exacta y 2^(±1/12) a un semitono | FR-002 |

Comprobar también el tamaño: `public/samples/piano/` ≤ 3 MB (SC-003).

## 2. Prueba manual

```bash
npm run dev
```

1. Abrir **Piano libre**, tocar graves, medios y agudos: suena piano, afinado, sin retraso
   apreciable (SC-002). Comparar con un afinador o con la nota anterior al cambio.
2. Tocar un acorde de tres notas y repetir una nota muy rápido: sin chasquidos, cortes ni
   saturación (FR-005).
3. **Canciones › Himno a la alegría a dos manos › Escuchar**: ambas manos con piano y ritmo
   igual que antes.
4. Practicar solo la **Derecha** en Aprender y Tocar: la izquierda suena con el mismo piano y
   sin tapar las notas propias; el metrónomo sigue siendo un clic (FR-006).
5. **Ajustes**: la prueba de sonido suena con piano y aparece la línea de créditos (FR-011).
6. DevTools › Network › **Offline**, borrar los datos del sitio y recargar: las teclas suenan
   con el sintetizador, sin errores visibles (SC-005).
7. Volver a **Online**, recargar: con «Fast 4G» o similar el piano está listo en < 5 s; mientras
   tanto suena el sintetizador y luego cambia solo (FR-008).
8. Recargar otra vez: en Network las muestras salen de la caché y el piano suena casi al
   instante (SC-004). Con **Offline** también suena piano.
9. Repetir 1 con el teclado del ordenador y, si hay, con un teclado MIDI, y en un móvil en
   horizontal.
