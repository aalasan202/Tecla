# Quickstart: validar el pedal de resonancia

## Requisitos

- `npm install` hecho; `npm run dev` para la app en `http://localhost:5173`.
- Opcional: teclado MIDI con pedal (USB) en Chrome o Edge.
- Archivos de prueba: un MIDI con CC 64 y un MusicXML con `<pedal>` (en
  `src/music/import/fixtures.ts`, añadidos por esta funcionalidad).

## Automático

```bash
npm test        # incluye pedal.test.ts, validate, repertorio, motor e importación
npm run build   # comprobación de tipos
```

Qué debe cubrir la suite:

| Comprobación | Requisito |
|--------------|-----------|
| `sustainedEnd`, `pedalMarks`, `clipPedals`, `fitPedals`, `validatePedal` con los ejemplos de [contracts/pedal.md](contracts/pedal.md) | FR-001, FR-004, FR-015 |
| Ninguna pieza incluida de nivel 1–2 tiene `pedal`; las 11 de research R2 sí; «Pedal» en `level` ⇔ `pedal` | FR-002, FR-003, FR-014, SC-001 |
| Todo el repertorio pasa `validateSong` y la no regresión (ids, notas, tempo, nivel) | FR-013, SC-003 |
| Tocar sin fallos cada pieza con pedal da 3 estrellas; mismo `LessonResult` con y sin `pedal` | FR-007, SC-002 |
| En Escuchar, una nota dentro de un tramo pide `tone` con la duración hasta el fin del tramo | FR-008 |
| `stop()` y cada repetición del bucle llaman a `release` | FR-010 |
| `buildScore` de una importada con pedal: `pedals` vacío en nivel 2 y lleno en nivel 3 | FR-015, SC-007 |
| MIDI con CC 64 y MusicXML con `pedal start/change/stop` producen los tramos esperados; tramos incoherentes no hacen fallar la importación | FR-015, SC-007 |

## Manual

1. **Partitura** (escritorio y móvil apaisado): abrir «Preludio en Do» y «Canción de cuna». Bajo
   el pentagrama inferior se ve la línea de pedal, con un gancho al empezar, una «V» en cada
   cambio y un gancho al final, alineada con las notas. Pasa por los límites de cada 8 compases
   sin cortarse. No hay desplazamiento vertical. Repetir en tema oscuro.
2. **Primera vez**: con los datos del sitio borrados, abrir una pieza con pedal: aparece la
   explicación; cerrarla y volver a abrir otra pieza con pedal: ya no aparece.
3. **Sin pedal**: abrir «Minueto en Sol» (nivel 3, una mano) y cualquier pieza de nivel 1–2:
   ninguna marca de pedal.
4. **Escuchar**: en «Canon de Pachelbel», las notas siguen sonando hasta cada cambio de pedal y
   se apagan en él. Pulsar parar a mitad de pieza: el sonido se corta en menos de un segundo.
5. **Bucle**: seleccionar dos compases en mitad de un tramo: la línea de pedal se ve solo dentro
   del fragmento, con ganchos en sus bordes; al quitar el bucle vuelve completa. Escuchar en
   bucle: al volver al
   inicio no se arrastra la resonancia del final.
6. **Tocar sin pedal**: completar una pieza con pedal sin fallos con el teclado en pantalla:
   3 estrellas, y el resumen no menciona el pedal.
7. **Teclado MIDI**: pisar el pedal y tocar notas en Piano libre y en una lección: se
   sostienen; soltar el pedal: se apagan. Desenchufar el teclado con el pedal pisado: el sonido
   se apaga. Pisar el pedal al azar en Tocar no cambia el resultado.
8. **Importación**: importar el MusicXML de prueba. Con nivel sugerido ≥ 3 se ve el pedal; al
   cambiar su nivel a 2 en la ficha de la pieza desaparece, y al volver a 3 reaparece.
