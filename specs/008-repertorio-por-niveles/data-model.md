# Data Model: Ampliar el repertorio de dominio público por niveles

## SongDef (ampliado, compatible)

Sin cambios en los campos existentes. Nuevo campo opcional:

| Campo | Tipo | Regla |
|-------|------|-------|
| `origin` | `string?` | Compositor con fechas o procedencia popular; añade «arreglo» o «fragmento» si aplica. Obligatorio (no vacío) en el repertorio incluido; las importadas no lo llevan. |

`level` mantiene el formato `"Nivel N · Origen corto · Rasgo"`; la tarjeta muestra lo que va tras
el nivel (FR-010).

## Repertorio (`SONGS`)

- Unión de las piezas existentes (sin tocar ids, notas, tempo ni nivel: FR-008) y las nuevas
  (`src/music/repertoire.ts`).
- Ordenado por `ORDER`: lista de ids agrupada por nivel, de menor a mayor dificultad (FR-009).
- **Invariantes** (tests):
  - cada id aparece una vez en `ORDER` y en `SONGS`; `SONGS[0]` es `cinco` (pieza de Inicio);
  - el número de nivel no baja a lo largo de `SONGS`;
  - cada nivel 1–4 tiene ≥ 6 piezas; total ≥ 27; ≥ 3 nuevas por nivel (FR-001, FR-002);
  - toda pieza supera `validateSong` (FR-006) y tiene `origin` (FR-004).

## Reglas por nivel de las piezas nuevas

Ver [contracts/repertorio.md](contracts/repertorio.md).
