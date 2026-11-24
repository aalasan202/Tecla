# Quickstart: validar la partitura profesional

## 1. Automático (`npm test`, `npm run build`)

Lo que deben cubrir los tests (ver [contracts/score.md](contracts/score.md)):

- **No regresión (SC-001, FR-013)**: antes de tocar nada se guardan, para las 12 piezas, las
  `ScoreNote` (`m`, `d`, `s`, `h`, `f`) y el resultado de Tocar con una secuencia de pulsaciones
  fija. Después del cambio deben salir iguales.
- **Validación del repertorio (FR-017)**: duraciones en ticks, acordes, `tie`, `slur`,
  armaduras y compases completos, también en las piezas nuevas.
- **Ortografía (SC-003)**: armadura de Sol mayor sin sostenidos propios; Fa natural con
  becuadro y Fa♯ posterior con sostenido; bemoles en Fa mayor; nombres «Fa♯»/«F♯»/«Si♭».
- **Grabado**: blanca + negra ligadas a través de la barra; 2,5 pulsos → blanca + corchea
  ligadas; tresillo de corcheas con su grupo; semicorcheas con barras por pulso; 6/8 agrupado de
  tres en tres; cada compás suma exacto.
- **Motor**: acorde de 3 notas en Aprender (espera las tres, en cualquier orden); en Tocar, acierto
  solo con las tres; margen recortado en semicorcheas y no en corcheas; 6/8 con dos clics por
  compás y tempo en pulsos; nota ligada que entra en un bucle no se exige.
- **Digitación**: tríada Do–Mi–Sol → 1-3-5 (derecha) y 5-3-1 (izquierda); piezas actuales igual.
- **Importación**: versión completa de un MusicXML con acordes, armadura y tresillos; 6/8 admitido
  en la simplificada; varias voces en una mano → completa no disponible; ida y vuelta de las piezas
  nuevas del repertorio.
- `npm run build`: el chunk de VexFlow aparece aparte y en el precache del service worker.

## 2. Archivos para la prueba manual

`node scripts/export-fixtures.mjs` (de 006) también escribe las piezas nuevas y piezas de prueba
con acordes, ligaduras, armadura, semicorcheas, tresillos y 6/8 en `dev-fixtures/`.

## 3. Manual (`npm run dev`)

1. Abrir las 12 piezas de siempre en escritorio: mismas notas, nombres y dedos; colores de
   acierto/fallo y cursor como antes. Practicar un fragmento en bucle en dos de ellas (SC-001).
2. «Minueto en Sol»: armadura de un sostenido, ningún Fa con sostenido propio, nombres «Fa♯».
   Cambiar a C‑D‑E: «F♯» (historia 2).
3. «Himno a la alegría con acordes»: acordes apilados con dedos 5-3-1; completar Aprender y
   Tocar con el **ratón** en el teclado en pantalla y con un teclado MIDI (SC-002).
4. «Canción de cuna»: las notas ligadas se tocan una vez; empezar un bucle en el compás donde
   continúa una ligada: no se exige (historia 3).
5. «Greensleeves» (6/8): compás 6/8, corcheas de tres en tres, dos clics por compás, tempo en
   «♩. por minuto»; 3 estrellas tocando a tempo (SC-007).
6. Importar el archivo de prueba con acordes, armadura y tresillos: el resumen ofrece las dos
   versiones; añadir la completa y practicarla. Desde ⋯ cambiar a la simplificada y volver: cada
   una conserva sus estrellas (SC-008).
7. Una pieza importada en 006 (antes del cambio): sigue en simplificada con sus estrellas; pasar a
   la completa; si el original tiene varias voces en una mano, la opción explica por qué no.
8. Repetir 1–5 en móvil apaisado (640 × 320) y en tema oscuro: sin desplazar la página, contraste
   correcto (SC-006).
9. Sin conexión con la app instalada: abrir una lección que nunca se había abierto: la partitura
   se dibuja (FR-007).
10. En un móvil de gama media: tiempo hasta ver la partitura de una pieza de 100 y de 300 compases
    (< 1 s y < 2 s, SC-004) y respuesta a la nota y cursor en ambas (SC-005). Anotar aquí.
