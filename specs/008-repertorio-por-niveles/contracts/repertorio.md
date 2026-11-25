# Contrato: reglas del repertorio incluido

Lo que cumple cada pieza nueva según su nivel; lo comprueba `src/music/repertoire.test.ts`.

| Regla | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|-------|---------|---------|---------|---------|
| Manos | una (`n`) | una (`n`) | una o dos | dos (`r` y `l`) |
| Alturas | solo teclas blancas, dentro de cinco notas seguidas; ≤ 10 % corcheas (nivel sugerido de 006) | libre | libre | libre |
| Digitación | cada altura, siempre el mismo dedo | sugerida en todas | sugerida en todas | sugerida en todas |
| Compases | ≤ 32 | ≤ 32 | ≤ 32 | ≤ 32 |
| Tocar sin fallos | 3 estrellas | 3 estrellas | 3 estrellas | 3 estrellas |
| `origin` | no vacío | no vacío | no vacío | no vacío |

Para todas las piezas (nuevas y existentes): `validateSong` sin errores y prueba de no regresión
de las 12 piezas originales sin cambios.

Descripción de niveles en Canciones (FR-013):

1. Una mano, cinco dedos, sin moverse del sitio.
2. Saltos, cambios de posición y corcheas con la mano derecha.
3. Compás de 3/4, alteraciones, acordes y las dos manos.
4. Dos manos independientes: arpegios, cánones y 6/8.
