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

## v0.7 · Ampliación de ejercicios
- Dentro de cada nivel del curso, hay tres caminos que el alumno puede seguir simultáneamente: 1. Consejos y lecciones. 2. Ejercicios de escalas/independencia de manos y juegos de lectura. 3. Aprender canciones.
- Juego de lectura rápida de notas.
- Ejercicios de escalas.
- Ejercicios para trabajar la independecia entre manos.
- Las canciones largas se aprenden en tres-cuatro lecciones, primero por partes y al final todo junto.

## v1.0 · Cuentas
- Registro e inicio de sesión (Supabase) y progreso sincronizado entre dispositivos.
- Dominio propio, analítica respetuosa con la privacidad y página de presentación.
- Estudio de monetización (plan gratuito + repertorio o funciones premium).
