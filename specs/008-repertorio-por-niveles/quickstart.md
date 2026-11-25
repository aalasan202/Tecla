# Quickstart: validar la ampliación del repertorio

## 1. Automático

```sh
npm test        # validación, reglas por nivel, 3 estrellas y no regresión
npm run build   # tipos
```

Esperado: todo en verde, incluida `src/music/regression.test.ts` sin regenerar la línea base.

## 2. Manual (`npm run dev`)

1. **Canciones**: el nivel 1 muestra 6 piezas, el 2 siete, el 3 nueve y el 4 siete, cada una con
   origen y rasgo en la tarjeta; dentro de cada nivel, de la más fácil a la más difícil.
2. Filtro «Una mano»: aparecen las nuevas de los niveles 1 y 2.
3. Para cada pieza nueva: **Escuchar** (la melodía se reconoce), **Aprender** y **Tocar** con el
   teclado en pantalla; en las de dos manos, probar también una sola mano.
4. Móvil apaisado: partitura y teclado sin desplazamiento en `noche de paz` (24 compases) y
   `rema` (6/8).
5. Inicio y Progreso: los totales reflejan 29 piezas; las estrellas guardadas se conservan.
