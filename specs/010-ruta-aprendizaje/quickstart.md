# Quickstart: validar la ruta de aprendizaje

Cómo comprobar que la funcionalidad 010 funciona de principio a fin. Modelo en
[data-model.md](data-model.md) y contratos en [contracts/course.md](contracts/course.md).

## Requisitos

```sh
npm install
npm test          # incluye src/course/*.test.ts y las pruebas nuevas del motor
npm run build     # comprobación de tipos y bundle
npm run dev       # http://localhost:5173
```

Para empezar de cero: Ajustes → Borrar el progreso (vacía también el Curso).

## Pruebas automáticas que deben pasar

| Archivo | Qué demuestra |
|---------|---------------|
| `src/course/checks.test.ts` | Estructura del curso (FR-002, FR-005, FR-006, FR-034, FR-035): ids, hitos existentes, número de lecciones por bloque, consejos, ejercicios válidos y cortos, límites de palabras, consejos sin «pantalla», «ratón» ni «táctil» |
| `src/course/path.test.ts` | `pathState`: progreso vacío, avance lección a lección, umbral de 2★, consejos que no bloquean, hito superado desde Canciones, progreso con huecos (opcionales), unidad saltada por prueba, ruta terminada, `next` |
| `src/course/text.test.ts` | `renderText` con Do‑Re‑Mi y C‑D‑E |
| `src/engine/lesson.test.ts` | Ritmo: cualquier tecla, golpes a tiempo dan 3★ y fuera de ventana 0★, pulsaciones dobles cuentan una vez. Acordes: a la vez acierta, seguidos dentro de `chordSpread` acierta, fuera falla, una nota ajena falla. Sin opciones nuevas, todo igual. |
| `src/state/course.test.ts` | Mejor marca, visto, saltado, `last`, reinicio |

## Recorridos manuales

1. **Desde cero** (historias 1 y 2): Inicio → Curso.
   - Solo está abierta la Unidad 1, con 4 consejos y la primera lección.
   - Lee un consejo, comprueba la ilustración y pulsa «Entendido»: queda «visto».
   - Haz la primera lección. En la explicación, pulsa teclas: suenan, y las resaltadas destacan.
   - En el ejercicio, Tocar con 2★ abre la siguiente. Con 1★ sigue bloqueada y el mapa lo dice al
     tocarla.
2. **Ritmo** (historia 3): lección «El pulso».
   - Se oye y se ve la cuenta previa de 4 pulsos, y el indicador de pulso late durante el
     ejercicio.
   - Toca con cualquier tecla a tiempo (3★), adelantándote mucho (≤ 1★) y pulsando dos teclas a
     la vez (cuenta un golpe).
3. **Acordes** (historia 4): las lecciones de la Unidad 3 (puedes llegar con la prueba de nivel).
   - Con MIDI o en un móvil, tres dedos a la vez aciertan.
   - Con el ratón, tres clics seguidos en menos de 1,5 s aciertan; en más de 1,5 s fallan.
   - Una nota ajena estropea el acorde.
   - La partitura muestra el acorde apilado en clave de fa con los dedos 5‑3‑1.
4. **Progreso previo** (historia 5): con el progreso vacío, ve a Canciones y saca 2★ en Tocar en
   «Martinillo».
   - En el Curso, todo hasta Martinillo está abierto, Martinillo está superado y las lecciones
     anteriores aparecen como opcionales.
   - Canciones sigue sin bloqueos.
5. **Prueba de nivel** (historia 6): con el progreso vacío, abre la prueba de la Unidad 2.
   - Si suspendes un ejercicio, no se desbloquea nada y se indica el bloque que conviene repasar.
   - Si apruebas todos, la Unidad 1 queda «superada por prueba» y la Unidad 2 se abre.
6. **Continuar y totales** (historia 7, FR-036, FR-037):
   - Tras una lección del Curso, «Continuar» en Inicio abre el siguiente pendiente. Tras una
     pieza de Canciones, abre esa pieza.
   - Inicio y Progreso muestran «Curso: N de M estrellas» aparte. El total del repertorio no
     cambia al ganar estrellas en lecciones.
   - El tiempo y la racha suben tras practicar solo en el Curso.
7. **Ajustes, temas y pantallas** (FR-031, FR-032, SC-003, SC-006, SC-007):
   - Cambia a C‑D‑E: los textos de las explicaciones usan C, D, E.
   - Tema oscuro y claro: las ilustraciones se ven bien.
   - Móvil apaisado: el ejercicio cabe sin desplazamiento. En vertical se pide girar en el
     ejercicio, y las fichas se leen.
   - En modo avión, tras una visita, el Curso con ilustraciones funciona.

## Resultado esperado

`npm test` y `npm run build` pasan, y los siete recorridos se cumplen en escritorio (Chrome) y en
móvil apaisado.
