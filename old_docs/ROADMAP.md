# Hoja de ruta

Objetivo: un producto público para aprender piano desde cero con un teclado MIDI o con el teclado en pantalla.

## v0.2 · Base del proyecto ✅
- Paso del prototipo de un archivo a Vite + React + TypeScript, con la misma funcionalidad.
- Motor de lección separado de la interfaz y cubierto por tests.
- Tests y despliegue automático en GitHub Pages.

## v0.3 · Menú principal ✅
- Pantalla de inicio con Continuar (última pieza y paso) y accesos a Canciones, Piano libre, Progreso y Ajustes.
- Rutas propias para cada pantalla y botón Atrás.
- Progreso guardado: estrellas, última sesión, tiempo de práctica y racha.
- Ajustes: notación Do‑Re‑Mi o C‑D‑E, nombres, dedos y tema claro u oscuro.
- Diseño apaisado para móvil y tablet, con aviso de girar en vertical.

## v0.4 · Calidad de práctica ✅
- Pantalla de lección adaptada a móvil apaisado (partitura y teclado sin desplazamiento). ✅
- Sonido de piano real (muestras) en lugar del sintetizador. ✅
- Bucle de compases: repetir un fragmento difícil.✅
- Aprender con espera a tempo (la partitura avanza pero se detiene si fallas). ✅
- App instalable (PWA) y uso sin conexión. ✅

## v0.5 · Contenido ✅
- Importar MIDI y MusicXML para no escribir las notas a mano.✅
- Partitura con motor profesional (VexFlow) cuando el repertorio lo necesite: ligaduras, acordes, armaduras.✅
- Ampliar el repertorio de dominio público por niveles.✅
- Introducir el pedal sustain en las piezas a partir del nivel 3.  Sale en la partitura pero no puntua para evaluar.✅

## v0.6 · Curso y ejercicios✅
- Ruta de aprendizaje: lecciones de lectura, ritmo, posiciones de mano y acordes.✅
- Estadísticas, historial y rachas.✅

## v0.7 · Curso en tres caminos y técnica
- Curso de los niveles 1 a 4. Cada nivel se abre al superar las lecciones del anterior o su prueba de nivel.
- Dentro de cada nivel hay tres caminos libres que el alumno elige en cada momento: 1. Lecciones y consejos. 2. Técnica (escalas e independencia de manos). 3. Canciones.
- «Siguiente recomendado»: la app propone siempre qué hacer a continuación, mezclando los tres caminos, sin bloquear el resto.
- Lecciones y consejos nuevos para los niveles 3 y 4.
- Ejercicios de escalas generados automáticamente, de una octava y por tonalidades (Do, Sol, Fa, Re…), con la digitación y el paso del pulgar a la vista. La digitación se enseña, pero no se puntúa: la app no puede saber qué dedo pulsa.
- Ejercicios de independencia de manos (melodía en una mano y notas largas o acompañamiento en la otra). Solo con teclado MIDI; sin él se muestran con un aviso que lo explica (excepción al Principio III, a registrar en la constitución).
- Se conserva el progreso del Curso actual (lecciones superadas, unidades saltadas y estrellas).

## v0.8 · Lectura y repertorio largo
- Juego de lectura rápida de notas, con repaso de las notas que más se fallan.
- Las canciones largas se aprenden en tres o cuatro lecciones: primero por partes (con el bucle de compases) y al final completas.
- Historial y estadísticas por camino (lecciones, técnica, lectura y canciones).

## v1.0 · Cuentas
- Registro e inicio de sesión (Supabase) y progreso sincronizado entre dispositivos.
- Dominio propio, analítica respetuosa con la privacidad y página de presentación.
- Estudio de monetización (plan gratuito + repertorio o funciones premium).
