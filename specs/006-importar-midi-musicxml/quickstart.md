# Quickstart: validar «Importar canciones MIDI y MusicXML»

## 1. Automático

```sh
npm test          # lector MIDI, conversión, nivel, huella, almacenes y MusicXML (happy-dom)
npm run build     # tipos + build
```

Lo que deben cubrir los tests (ver [contracts/import.md](contracts/import.md)):

- **SC-002 (ida y vuelta)**: cada pieza de `SONGS` se exporta con los generadores de prueba a MIDI
  (una pista por mano) y a MusicXML (una parte, uno o dos pentagramas), se importa y da las mismas
  notas, duraciones, manos, compás y tempo.
- **SC-003**: `suggestLevel` da el nivel real en las 12 piezas (research R5).
- **SC-004**: cada `RejectReason` con su archivo de prueba (bytes al azar, MIDI cortado, MIDI sin
  notas, MIDI con canal 10, 3 pistas, nota 120, compás 6/8, cambio de compás, `opus`).
- **FR-010**: acordes, semicorcheas, tresillos, notas que cruzan la barra y ligaduras dan las
  duraciones esperadas, compases completos y los avisos con sus compases.
- **FR-008**: una pista con acordes se reparte por el Do central; «Martinillo» en una sola pista
  sigue siendo de una mano.
- **FR-016**: si `localStorage` falla al guardar, no queda ni pieza ni original.
- **FR-014/FR-019**: borrar quita estrellas y «última sesión»; los totales ignoran importadas.

## 2. Archivos para la prueba manual

`node scripts/export-fixtures.mjs` escribe en `dev-fixtures/` (ignorado en git) las 12 piezas en
`.mid` y `.musicxml`, más los archivos no válidos de los tests. Para casos reales, usar 3 o 4
piezas de piano sencillas de dominio público descargadas de un sitio de partituras libres
(una en `.mxl`, una a una sola pista con acordes, una de más de 300 compases).

## 3. Manual (`npm run dev`)

1. **Canciones** muestra «Importar archivo» y «Importar de servidor» deshabilitado con
   «Próximamente»; tocar este último no hace nada (FR-002).
2. Importar `estrellita2.musicxml`: resumen con «Estrellita a dos manos», dos manos, 4/4, 85 ppm,
   12 compases, nivel sugerido 4; Añadir → aparece en Nivel 4 con «Importada» (FR-004, FR-012).
3. Practicarla en Escuchar, Aprender y Tocar (las dos manos y cada una), con bucle y con el teclado
   en pantalla; conseguir estrellas. Comparar con la incluida: debe sonar y verse igual.
4. Cerrar la pestaña, desconectar la red, abrir la app instalada o la URL: la pieza sigue con sus
   estrellas; Inicio y Progreso muestran los mismos totales que antes de importar (SC-007, FR-019).
5. Desde Inicio, «Continuar» lleva a la pieza importada si fue la última practicada.
6. Importar un archivo de texto renombrado a `.mid`, un MIDI vacío y uno de batería: mensajes
   claros, la lista no cambia (SC-004).
7. Importar de nuevo `estrellita2.musicxml`: aviso de duplicado; «Añadir otra copia» crea
   «Estrellita a dos manos (2)» (FR-015).
8. Importar la pieza real de una sola pista con acordes: avisos «manos repartidas» y «acordes
   simplificados» con sus compases; la partitura muestra una nota por mano.
9. Importar la pieza de más de 300 compases: aviso de rendimiento y «Añadir igualmente». Practicar
   en un móvil de gama media: la respuesta a la nota debe ser inmediata y el cursor fluido
   (SC-006, research R9). Anotar el resultado aquí.
10. Medir el tiempo hasta el resumen con un archivo de unos 300 compases en móvil (< 2 s, SC-005);
    durante la comprobación, Cancelar funciona.
11. Editar el título y el nivel de una importada: cambia de sección y conserva estrellas. Borrarla:
    pide confirmación y desaparece de la lista y de «Continuar» (FR-014). Las incluidas no tienen
    el botón «⋯».
12. Repetir 2, 6 y 8 en móvil apaisado (640 × 320) y en tema oscuro: el diálogo cabe o se desplaza
    por dentro, sin desplazar la página (FR-018).
13. En DevTools, llenar el almacenamiento (o simular cuota) e importar: aviso «sin espacio» y nada
    a medias (FR-016).
