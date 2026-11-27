# Quickstart: validar el Curso en tres caminos (012)

## Requisitos

```bash
npm install
npm test        # incluye src/course/{state,recommend,scales,independence,checks}.test.ts y music/score.test.ts
npm run build
npm run dev
```

Para simular un progreso antiguo, en la consola del navegador:

```js
// alumno de la v0.6 que superó la prueba de la unidad 3
localStorage["tecla-course"] = JSON.stringify({ best: { "l-pulso": 3, "prueba-u3-reading": 2 }, seen: { "consejo-postura": true }, skipped: { u1: true, u2: true }, last: null });
location.reload();
```

## Escenarios

1. **Alumno nuevo (US1)**: abre `#curso`. Ve el nivel 1 abierto con tres caminos, los niveles 2–4
   bloqueados con su motivo y la recomendación «El teclado y la posición de Do».
2. **Libertad dentro del nivel**: en el nivel 1, entra en Canciones y toca una pieza sin hacer
   lecciones; después abre la última lección del nivel directamente. Ninguna está bloqueada.
3. **Paso de nivel**: con las 5 lecciones del nivel 1 en 2★ (consola: `best`), el nivel 2 se abre.
4. **Progreso antiguo (FR-024, SC-002)**: con el ejemplo de arriba, los niveles 1 y 2 están
   abiertos, «El pulso» tiene 3★, «Postura» está visto y el nivel 3 sigue bloqueado.
5. **Recomendación (US2)**: supera dos lecciones seguidas; la recomendación pasa a Técnica o
   Canciones con su motivo. Sigue 6 recomendaciones seguidas y comprueba que pasan por al menos
   2 caminos (SC-004).
6. **Escala (US3)**: abre «Escala de Do mayor · mano derecha». Ve la explicación del paso del pulgar,
   los dedos 1‑2‑3‑1‑2‑3‑4‑5 aunque «Números de dedo» esté desactivado, y la tocas en Tocar a 60 ppm
   con 3★: al volver, se propone 80 ppm. Con 2★ a 100 ppm queda «dominada».
7. **Escala mano izquierda**: en clave de fa, dedos 5‑4‑3‑2‑1‑3‑2‑1.
8. **Independencia sin MIDI (US4, FR-018/019)**: en el nivel 2, abre un ejercicio de independencia:
   se puede escuchar, Aprender y Tocar están desactivados y aparece el aviso. La recomendación
   nunca lo propone y el avance de Técnica no lo cuenta.
9. **Independencia con MIDI**: conecta un teclado: el ejercicio se habilita sin salir; tócalo en
   Tocar y recibe estrellas. Desconecta a mitad: se detiene sin puntuar y vuelve el aviso.
10. **Niveles 3 y 4 (US5)**: supera la prueba del nivel 3 (`#curso/prueba/3`); se abren los niveles
    1–3 y aparecen sus lecciones nuevas, consejos, escalas (Re M, La m) y canciones de nivel 3.
11. **Historial**: los intentos de escalas aparecen en `#progreso/historial` como Curso, con ficha.
12. **Inicio**: tras practicar algo del Curso, «Continuar» lleva al «Siguiente recomendado».
13. **Pantallas**: tema claro y oscuro, Do‑Re‑Mi y C‑D‑E, móvil apaisado 740×360 y escritorio, sin
    desplazamiento horizontal; la escala cabe en el teclado en pantalla.
