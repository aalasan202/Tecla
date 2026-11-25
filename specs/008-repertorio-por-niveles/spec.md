# Feature Specification: Ampliar el repertorio de dominio público por niveles

**Feature Branch**: `008-repertorio-por-niveles`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Ampliar el repertorio de dominio público por niveles."

## Contexto

Hoy el repertorio incluido son 15 piezas repartidas de forma desigual entre los cuatro niveles:

| Nivel | Qué enseña (pantalla de Canciones) | Piezas hoy |
|-------|-------------------------------------|-----------|
| 1 | Una mano, cinco dedos, sin moverse del sitio | 2 (Cinco dedos, Himno a la alegría) |
| 2 | Saltos y corcheas con la mano derecha | 3 (Estrellita, Martinillo, Au clair de la lune) |
| 3 | Compás de 3/4, sostenidos y las dos manos | 6 |
| 4 | Dos manos con más independencia y arpegios | 4 |

Quien empieza agota el nivel 1 en una sesión y no tiene material para afianzar lo aprendido
antes de saltar al siguiente. La partitura profesional (007) ya permite acordes, armaduras,
ligaduras y 6/8, así que el repertorio puede crecer sin cambios en la práctica. La importación
(006) cubre las piezas que el alumno trae; esta funcionalidad amplía el repertorio **incluido**,
revisado y con digitación, que es el que guía el aprendizaje.

La constitución exige que el repertorio incluido sea de dominio público o con licencia que
permita su uso (Principio V) y que cada pieza supere la validación automática (Principio II).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Más piezas en los primeros niveles (Priority: P1)

Una alumna que acaba de empezar termina «Cinco dedos» y «Himno a la alegría». En Canciones
encuentra en el nivel 1 varias piezas más que se tocan con la misma posición de cinco dedos
(melodías populares que reconoce), y en el nivel 2 otras tantas con saltos y corcheas. Puede
practicar varios días sin salir de su nivel antes de pasar al siguiente.

**Why this priority**: los primeros niveles son los más escasos y los que más usa quien empieza,
el público principal de la app (Principio IV).

**Independent Test**: abrir Canciones, contar las piezas de los niveles 1 y 2, y completar los
tres pasos (Escuchar, Aprender, Tocar) de cada pieza nueva con el teclado en pantalla.

**Acceptance Scenarios**:

1. **Given** la pantalla de Canciones, **When** la alumna mira el nivel 1, **Then** ve al menos
   seis piezas, todas a una mano y dentro de una posición de cinco dedos sin desplazar la mano.
2. **Given** una pieza nueva del nivel 1 o 2, **When** se practica, **Then** partitura, teclado,
   digitación, sonido y puntuación funcionan igual que en las piezas que ya existían.
3. **Given** el filtro «Una mano», **When** se aplica, **Then** las piezas nuevas de una mano
   aparecen en su nivel.

---

### User Story 2 - Más piezas a dos manos en los niveles 3 y 4 (Priority: P2)

Un alumno que ya toca con las dos manos busca piezas nuevas que le reten un poco más: obras
clásicas conocidas y canciones populares arregladas con acompañamiento sencillo en la mano
izquierda (notas largas y acordes en el nivel 3; arpegios, bajos que se mueven y más
independencia en el nivel 4).

**Why this priority**: amplía la progresión cuando el alumno ya domina lo básico; depende de que
los primeros niveles estén bien cubiertos para que la progresión tenga sentido.

**Independent Test**: practicar cada pieza nueva de los niveles 3 y 4 a dos manos, en
«Aprender» y en «Tocar», y comprobar que se puntúa de principio a fin.

**Acceptance Scenarios**:

1. **Given** el nivel 3, **When** el alumno lo abre, **Then** encuentra piezas nuevas en 3/4 o con
   alteraciones y acompañamiento sencillo en la mano izquierda.
2. **Given** el nivel 4, **When** lo abre, **Then** encuentra piezas nuevas en las que la mano
   izquierda se mueve con independencia (arpegios, bajos que cambian a menudo).
3. **Given** cualquier pieza nueva a dos manos, **When** se practica una sola mano, **Then**
   funciona igual que en las piezas a dos manos existentes.

---

### User Story 3 - Progresión clara dentro de cada nivel (Priority: P3)

Dentro de cada nivel, las piezas aparecen ordenadas de la más fácil a la más difícil, y cada
tarjeta indica el origen (compositor o «Popular») y lo que la pieza añade (por ejemplo,
«Corcheas», «3/4», «Acordes»). Así el alumno sabe por cuál seguir.

**Why this priority**: mejora la orientación pero el repertorio ya es útil sin ella.

**Independent Test**: revisar el orden de cada nivel en Canciones y que cada tarjeta muestre
origen y novedad.

**Acceptance Scenarios**:

1. **Given** un nivel, **When** se lee de izquierda a derecha y de arriba abajo, **Then** la
   primera pieza es la más sencilla del nivel y la dificultad no baja de forma notable después.
2. **Given** una tarjeta de una pieza nueva, **When** se mira, **Then** muestra el origen y al
   menos un rasgo de lo que trabaja.

---

### Edge Cases

- Un alumno con progreso guardado (estrellas, «Continuar») en piezas existentes: lo conserva
  tal cual; ninguna pieza existente cambia de identificador, notas ni nivel.
- Piezas importadas por el alumno: siguen apareciendo en su nivel junto a las nuevas incluidas,
  con su marca «Importada»; un título repetido entre importada e incluida no causa conflicto.
- Una melodía conocida con varias versiones populares: se elige una sola, la más extendida, y se
  mantiene en todo el arreglo.
- Piezas que exceden lo que se puede practicar con comodidad en móvil apaisado (muchos compases
  o notas muy seguidas): se acortan a un fragmento representativo con final cerrado.
- Totales de Inicio y Progreso (número de piezas, estrellas sobre el máximo): crecen con el
  repertorio incluido sin que el alumno pierda nada de lo conseguido.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El repertorio incluido MUST crecer en al menos **12 piezas nuevas**, con al menos
  **3 nuevas por nivel** (niveles 1 a 4).
- **FR-002**: Tras la ampliación, cada nivel MUST tener al menos **6 piezas incluidas**.
- **FR-003**: Cada pieza nueva MUST ser de dominio público (obra popular tradicional o de un
  compositor fallecido hace más de 80 años) o un arreglo propio del proyecto sobre una obra así.
  No se usan arreglos, letras ni ediciones con derechos de terceros.
- **FR-004**: Cada pieza nueva MUST registrar su origen (compositor y fecha aproximada, u
  «Popular» con su procedencia) y, si es un arreglo o un fragmento, indicarlo.
- **FR-005**: Las piezas nuevas MUST respetar lo que enseña su nivel:
  - Nivel 1: una mano (derecha), posición fija de cinco dedos, negras, blancas y redondas (se
    admiten corcheas ocasionales: como mucho el 10 % de las notas, la misma regla que usa el
    nivel sugerido al importar), compás de 4/4 o 3/4, sin alteraciones.
  - Nivel 2: una mano (derecha), cambios de posición o saltos, corcheas y puntillos, sin
    armadura o con una alteración como mucho.
  - Nivel 3: 3/4 o alteraciones, o dos manos con una mano izquierda sencilla (notas largas,
    acordes por compás o por medio compás).
  - Nivel 4: dos manos con independencia (la mano izquierda se mueve dentro del compás:
    arpegios, bajo alterno, contrapunto sencillo), armaduras o 6/8.
- **FR-006**: Cada pieza nueva MUST superar la validación automática del repertorio (compases
  completos, manos de igual duración, notas y duraciones válidas).
- **FR-007**: Cada pieza nueva MUST tener digitación sugerida en todas sus notas, coherente con
  el nivel (en el nivel 1, la mano no se desplaza).
- **FR-008**: Las piezas existentes MUST NOT cambiar su identificador, notas, tempo ni nivel; el
  progreso guardado del alumno se conserva.
- **FR-009**: Dentro de cada nivel, las piezas MUST mostrarse ordenadas de menor a mayor
  dificultad, mezclando nuevas y existentes.
- **FR-010**: La tarjeta de cada pieza nueva MUST mostrar origen y lo que trabaja, con el mismo
  formato que las existentes (p. ej. «Nivel 2 · Popular inglesa · Corcheas»).
- **FR-011**: Ninguna pieza nueva MUST superar la duración de práctica cómoda de una lección:
  como máximo 32 compases.
- **FR-012**: Los títulos MUST estar en español cuando haya un título popular en español; si no,
  se usa el título original más conocido.
- **FR-013**: Las descripciones de los niveles en Canciones MUST seguir describiendo con
  exactitud lo que contiene cada nivel tras la ampliación.

### Key Entities

- **Pieza incluida**: obra del repertorio con identificador estable, título, nivel, origen,
  rasgos que trabaja, tempo, compás, armadura y notas de una o dos manos.
- **Nivel**: grupo del 1 al 4 con una descripción de lo que enseña y una lista ordenada de piezas
  de menor a mayor dificultad.
- **Origen**: compositor (y fechas) o procedencia popular, y si la pieza es un arreglo o un
  fragmento; justifica que es de dominio público.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El repertorio incluido pasa de 15 a al menos 27 piezas, y ningún nivel tiene menos
  de 6.
- **SC-002**: El 100 % de las piezas incluidas supera la validación automática y la prueba de
  no regresión de las piezas existentes sigue pasando sin cambios.
- **SC-003**: El 100 % de las piezas nuevas tiene origen documentado que justifica el dominio
  público.
- **SC-004**: Cada pieza nueva se puede completar en «Tocar» con 3 estrellas usando solo el
  teclado en pantalla.
- **SC-005**: Un alumno puede practicar al menos 6 piezas distintas en el nivel 1 antes de
  necesitar pasar al nivel 2.
- **SC-006**: Ninguna pieza nueva pasa de 32 compases, y todas se ven y se practican sin
  desplazamiento en móvil apaisado.

## Assumptions

- Se mantienen los niveles 1 a 4; no se crea un nivel 5 en esta funcionalidad.
- El pedal de resonancia (sustain) es una funcionalidad aparte de la hoja de ruta y queda fuera.
- Los arreglos (mano izquierda añadida, transposición a una tonalidad sencilla, fragmentos) los
  escribe el proyecto y se consideran parte del repertorio con la misma licencia que la app.
- Se usan las capacidades actuales de la partitura y la práctica (acordes, armaduras, ligaduras,
  3/4 y 6/8); no se añade notación nueva.
- «Dominio público» se toma con el criterio más restrictivo habitual: autor fallecido hace más de
  80 años o música popular tradicional sin autor conocido.
- El orden dentro de cada nivel lo decide el proyecto a partir de rasgos objetivos (extensión,
  ritmo, alteraciones, independencia de manos); no se muestra un indicador de dificultad aparte.
