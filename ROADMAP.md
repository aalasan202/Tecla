# Hoja de ruta

Objetivo: un producto público para aprender piano desde cero con un teclado MIDI o con el teclado en pantalla.

## v0.2 · Base del proyecto ✅
- Paso del prototipo de un archivo a Vite + React + TypeScript, con la misma funcionalidad.
- Motor de lección separado de la interfaz y cubierto por tests.
- Tests y despliegue automático en GitHub Pages.

## v0.3 · Calidad de práctica
- Sonido de piano real (muestras) en lugar del sintetizador.
- Ajustes guardados (tempo, nombres, dedos, metrónomo).
- Bucle de compases: repetir un fragmento difícil.
- Aprender con espera a tempo (la partitura avanza pero se detiene si fallas).
- App instalable (PWA) y uso sin conexión.

## v0.4 · Contenido
- Importar MIDI y MusicXML para no escribir las notas a mano.
- Partitura con motor profesional (VexFlow) cuando el repertorio lo necesite: ligaduras, acordes, armaduras.
- Ampliar el repertorio de dominio público por niveles.

## v0.5 · Curso y progreso
- Ruta de aprendizaje: lecciones de lectura, ritmo, posiciones de mano y acordes.
- Juego de lectura rápida de notas.
- Estadísticas, historial y rachas.

## v1.0 · Cuentas
- Registro e inicio de sesión (Supabase) y progreso sincronizado entre dispositivos.
- Dominio propio, analítica respetuosa con la privacidad y página de presentación.
- Estudio de monetización (plan gratuito + repertorio o funciones premium).
