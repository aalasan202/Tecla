# Quickstart: validar Estadísticas, historial y rachas (011)

## Requisitos

```bash
npm install
npm test          # incluye src/stats/*.test.ts y src/state/history.test.ts
npm run build     # comprobación de tipos
npm run dev       # http://localhost:5173
```

Para preparar datos se puede usar la consola del navegador. Por ejemplo, para crear días de
práctica pasados:

```js
const p = JSON.parse(localStorage["tecla-progress"] || "{}");
p.days = { ...p.days, "2026-10-01": 900, "2026-10-02": 600, "2026-10-03": 300, "2026-10-04": 1200, "2026-10-05": 60 };
localStorage["tecla-progress"] = JSON.stringify(p); location.reload();
```

## Escenarios

1. **Historial (US1, FR-001…007)**
   - Toca Cinco dedos en Tocar dos veces hasta el final y una vez en Aprender.
   - Abre otra pieza y sal a mitad de un intento.
   - **Resultado**: en `#progreso/historial` salen 3 intentos, del más nuevo al más antiguo,
     con paso, manos, tempo, % y estrellas. El intento abandonado no aparece.
2. **Pieza a dos manos**
   - Toca una pieza del nivel 3 en Tocar: una vez con la derecha y dos con ambas.
   - **Resultado**: su ficha (`#progreso/pieza/song%3A…`) lista 3 intentos y la gráfica tiene
     2 puntos.
3. **Bucle**
   - Marca los compases 3–4 y deja 2 repeticiones antes de detenerlo.
   - **Resultado**: aparece en el historial como «Compases 3–4 · 2 repeticiones» con la mejor
     nota, y no se añade a la gráfica.
4. **Curso**
   - Termina una lección del Curso y una prueba de unidad completa.
   - **Resultado**: dos intentos marcados «Curso». Cada uno tiene su ficha, y la de la prueba
     da como estrellas el mínimo de los ejercicios.
5. **Rachas (US2)**
   - Con los datos de ejemplo (5 días seguidos en octubre) más práctica hoy y ayer.
   - **Resultado**: Resumen muestra «Racha 2 días» y «Mejor racha 5 días». El calendario marca
     octubre si entra en las 13 semanas; si no, comprobar con fechas recientes.
6. **Aviso de racha en Inicio**
   - Con práctica ayer y ninguna hoy.
   - **Resultado**: la tarjeta de Progreso invita a practicar hoy para mantener la racha.
7. **Récord**
   - Prepara una racha actual igual al récord y practica hoy.
   - **Resultado**: sale una felicitación, una sola vez ese día.
8. **Periodos (US3)**
   - Cambia entre 7 días, 30 días y Todo.
   - **Resultado**: los totales cuadran con los datos. Un periodo sin datos muestra el mensaje
     de invitación en lugar de gráficos vacíos.
9. **Objetivo diario (US4)**
   - En Ajustes, elige 10 min y practica 4 min.
   - **Resultado**: Inicio muestra «4 de 10 min».
   - Practica 6 min más.
   - **Resultado**: aviso de objetivo cumplido (una vez) y el día queda en «mucha» en el
     calendario.
10. **Borrado**
    - Pulsa «Borrar el progreso».
    - **Resultado**: historial, rachas y estadísticas quedan vacíos y el objetivo diario se
      conserva.
    - Borra una pieza importada con intentos.
    - **Resultado**: sus intentos desaparecen.
11. **Límite (SC-005)**
    - Ejecuta en la consola un bucle que llame 1200 veces a `recordAttempt`, o usa el test de
      rendimiento.
    - **Resultado**: quedan 1000 intentos, los resúmenes conservan `count` = 1200 y Progreso
      abre en menos de 1 s.
12. **Pantallas**
    - Prueba el tema claro y el oscuro, en móvil apaisado (p. ej. 740×360) y en escritorio.
    - **Resultado**: no hay desplazamiento horizontal en el calendario, las gráficas ni el
      historial.
