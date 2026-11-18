// Descarga las fuentes de Tecla (Bricolage Grotesque, Figtree y Noto Music; SIL OFL 1.1) desde
// Google Fonts y las guarda en public/fonts/ junto con fonts.css, para que la app no dependa de
// terceros y se vea bien sin conexión. Solo hace falta volver a ejecutarlo si cambian las fuentes.
//
//   node scripts/fetch-fonts.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700" +
  "&family=Figtree:wght@400;500;600&family=Noto+Music&display=swap";
// un navegador actual recibe woff2 con subconjuntos por unicode-range
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const OUT = fileURLToPath(new URL("../public/fonts/", import.meta.url));
/** Subconjuntos que se guardan: el latino para todas; los símbolos musicales para Noto Music. */
const KEEP = (family, subset) => subset === "latin" || (family === "Noto Music" && subset === "music");

const res = await fetch(CSS_URL, { headers: { "User-Agent": UA } });
if (!res.ok) throw new Error(`fonts.css: HTTP ${res.status}`);
const css = await res.text();

await mkdir(OUT, { recursive: true });
const files = new Map(); // url remota → nombre local
const blocks = [];
let total = 0;
for (const [, subset, body] of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
  const family = body.match(/font-family:\s*'([^']+)'/)?.[1];
  const url = body.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  if (!family || !url || !KEEP(family, subset)) continue;
  if (!files.has(url)) {
    const name = `${family.toLowerCase().replace(/\s+/g, "-")}-${subset}.woff2`;
    const font = await fetch(url);
    if (!font.ok) throw new Error(`${name}: HTTP ${font.status}`);
    const data = Buffer.from(await font.arrayBuffer());
    await writeFile(OUT + name, data);
    total += data.length;
    files.set(url, name);
    console.log(`${name.padEnd(36)} ${(data.length / 1024).toFixed(0).padStart(4)} KB`);
  }
  blocks.push(`/* ${subset} */\n@font-face {${body.replace(url, `./${files.get(url)}`)}}`);
}

await writeFile(
  OUT + "fonts.css",
  `/* Generado por scripts/fetch-fonts.mjs. Fuentes con licencia SIL OFL 1.1 (ver OFL.txt). */\n${blocks.join("\n")}\n`,
);
console.log(`\n${files.size} archivos, ${blocks.length} @font-face, ${(total / 1024).toFixed(0)} KB`);
