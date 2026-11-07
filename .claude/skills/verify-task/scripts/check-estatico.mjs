#!/usr/bin/env node
// Comprobación estática de Bancal (React 19 + TS + Tailwind v4 + TanStack).
// Uso:  node check-estatico.mjs [carpeta-del-proyecto=.]
// Sale con 1 si hay algún [FALLA], con 2 si no encuentra src/. Los [AVISO] se
// miran y se decide si son reales; no tumban la verificación por sí solos.
//
// Es un análisis por expresiones regulares: rápido y sin dependencias, pero
// no entiende el código. Un falso positivo se justifica en el informe; no se
// "arregla" el código para callar al script.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, extname, dirname, resolve, sep } from "node:path";

const raiz = resolve(process.argv[2] ?? ".");
const src = join(raiz, "src");
const resultados = [];
const anotar = (nivel, puerta, donde, msg) => resultados.push({ nivel, puerta, donde, msg });

if (!existsSync(src)) {
  console.log(`No hay src/ en ${raiz}. ¿Es la carpeta del proyecto?`);
  process.exit(2);
}

function listar(dir, exts) {
  let out = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) out = out.concat(listar(ruta, exts));
    else if (exts.includes(extname(nombre))) out.push(ruta);
  }
  return out;
}

const rel = (r) => relative(raiz, r).split(sep).join("/");
const linea = (texto, idx) => texto.slice(0, idx).split("\n").length;
const corto = (s, n = 70) => s.replace(/\s+/g, " ").trim().slice(0, n);
// Sustituye los comentarios por espacios para no mover los índices.
const sinComentarios = (s, re) => s.replace(re, (m) => m.replace(/[^\n]/g, " "));
const sinComentariosTs = (s) => sinComentarios(s, /\/\*[\s\S]*?\*\/|(?<![:"'`])\/\/[^\n]*/g);

const codigo = listar(src, [".ts", ".tsx"]).filter((f) => !f.endsWith("routeTree.gen.ts") && !f.endsWith(".d.ts"));
const csss = listar(src, [".css"]);
const esTest = (f) => /\.(test|spec)\.tsx?$/.test(f);

// ---------- Paquete y Tailwind v4 ----------
const pkg = existsSync(join(raiz, "package.json")) ? JSON.parse(readFileSync(join(raiz, "package.json"), "utf8")) : {};
const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };

for (const ext of ["js", "cjs", "mjs", "ts"])
  if (existsSync(join(raiz, `tailwind.config.${ext}`)))
    anotar("FALLA", "tailwind-v4", `tailwind.config.${ext}`, "configuración de Tailwind v3: en v4 va en @theme dentro del CSS");
if (deps.tailwindcss && /^\D*3\./.test(deps.tailwindcss))
  anotar("FALLA", "tailwind-v4", "package.json", `tailwindcss ${deps.tailwindcss} es v3`);
for (const prohibida of ["react-router", "react-router-dom"])
  if (deps[prohibida]) anotar("FALLA", "stack", "package.json", `${prohibida} instalado: las rutas son de TanStack Router`);

// ---------- index.html ----------
const indexHtml = join(raiz, "index.html");
if (existsSync(indexHtml)) {
  const html = readFileSync(indexHtml, "utf8");
  if (!/<html\b[^>]*\blang\s*=\s*["']es["']/i.test(html)) anotar("FALLA", "estructura", "index.html", '<html> sin lang="es" (guía §4)');
  if (!/<meta\b[^>]*name\s*=\s*["']viewport["']/i.test(html)) anotar("FALLA", "estructura", "index.html", 'falta <meta name="viewport">');
  const titulo = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  if (!titulo) anotar("FALLA", "estructura", "index.html", "<title> vacío o ausente");
  else if (/^(vite app|document|vite \+ \w+.*|tueste.*)$/i.test(titulo)) anotar("AVISO", "estructura", "index.html", `<title> genérico o heredado: "${titulo}"`);
} else anotar("FALLA", "estructura", "index.html", "no existe");

// ---------- CSS ----------
let hayImportTailwind = false;
for (const ruta of csss) {
  const f = rel(ruta);
  const css = sinComentarios(readFileSync(ruta, "utf8"), /\/\*[\s\S]*?\*\//g);
  if (/@import\s+["']tailwindcss["']/.test(css)) hayImportTailwind = true;
  for (const m of css.matchAll(/@tailwind\s+(base|components|utilities)/g))
    anotar("FALLA", "tailwind-v4", `${f}:${linea(css, m.index)}`, `"${m[0]}" es sintaxis v3: usa @import "tailwindcss";`);
  for (const m of css.matchAll(/!important/g))
    anotar("AVISO", "atajos", `${f}:${linea(css, m.index)}`, "!important: ¿se tapa un problema de cascada en vez de arreglarlo?");
  for (const m of css.matchAll(/(?:^|[}\s,])(html|body)\s*[^{]*\{[^}]*overflow(?:-x)?\s*:\s*(hidden|clip)/g))
    anotar("AVISO", "atajos", `${f}:${linea(css, m.index)}`, `overflow ${m[2]} en ${m[1]}: puede esconder un desbordamiento horizontal`);
  for (const m of css.matchAll(/outline\s*:\s*(none|0)\b/g))
    anotar("AVISO", "foco", `${f}:${linea(css, m.index)}`, "outline quitado: comprueba que hay un foco visible que lo sustituye");
  // Colores a pelo fuera de @theme
  const bloquesTheme = [];
  for (const m of css.matchAll(/@theme\b[^{]*\{/g)) {
    let prof = 1, i = m.index + m[0].length;
    while (i < css.length && prof > 0) { if (css[i] === "{") prof++; else if (css[i] === "}") prof--; i++; }
    bloquesTheme.push([m.index, i]);
  }
  for (const m of css.matchAll(/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch)\(/gi))
    if (!bloquesTheme.some(([a, b]) => m.index >= a && m.index < b))
      anotar("AVISO", "tokens", `${f}:${linea(css, m.index)}`, `color a pelo fuera de @theme (${m[0]}) → usa var(--color-…)`);
}
if (deps.tailwindcss && !hayImportTailwind) anotar("FALLA", "tailwind-v4", "src/*.css", 'ningún CSS tiene @import "tailwindcss";');

// ---------- Ayudas para JSX ----------
// Devuelve la etiqueta de apertura completa desde "<", respetando llaves y
// comillas (los atributos pueden llevar "=>" o ">" dentro de {}).
function etiqueta(texto, inicio) {
  let prof = 0, comilla = null;
  for (let i = inicio + 1; i < texto.length; i++) {
    const c = texto[i];
    if (comilla) { if (c === comilla) comilla = null; continue; }
    if (c === '"' || c === "'" || c === "`") comilla = c;
    else if (c === "{") prof++;
    else if (c === "}") prof--;
    else if (c === ">" && prof === 0) return texto.slice(inicio, i + 1);
  }
  return texto.slice(inicio, inicio + 300);
}
const clasesDe = (attrs) => {
  const m = attrs.match(/\bclassName\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\})/);
  return (m ? (m[1] ?? m[2] ?? m[3]) : "").replace(/\$\{[^}]*\}/g, " ").split(/\s+/).filter(Boolean);
};

const V3 = /^(bg-opacity-|text-opacity-|border-opacity-|flex-shrink|flex-grow|overflow-ellipsis|decoration-slice|decoration-clone)/;
const VARIANTES_ESTADO = /(^|:)(hover|focus|focus-visible|focus-within|active|group-[a-z-]+|peer-[a-z-]+|open|aria-[^:]+|data-[^:]+)$/;
const NO_INTERACTIVOS = new Set(["div", "span", "li", "td", "tr", "section", "article", "p", "img", "svg", "g", "rect"]);

// ---------- Código TS / TSX ----------
for (const ruta of codigo) {
  const f = rel(ruta);
  const partes = f.split("/"); // src/<capa>/<pod>/...
  const capa = partes[1];
  const original = readFileSync(ruta, "utf8");
  const texto = sinComentariosTs(original);
  const en = (idx) => `${f}:${linea(texto, idx)}`;

  // Tests: nada que los debilite
  if (esTest(ruta)) {
    for (const m of texto.matchAll(/\b(it|test|describe)\.(only|skip)\b|\b(xit|xdescribe|fit|fdescribe)\s*\(/g))
      anotar("FALLA", "tests", en(m.index), `"${m[0]}": un test desactivado o aislado debilita la batería`);
    for (const m of texto.matchAll(/\b(it|test)\.todo\b/g))
      anotar("AVISO", "tests", en(m.index), "test.todo pendiente");
    continue;
  }

  // Imports: capas y pods
  for (const m of texto.matchAll(/\bfrom\s+["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    const spec = m[1] ?? m[2];
    if (/^react-router(-dom)?$/.test(spec)) anotar("FALLA", "stack", en(m.index), `import de ${spec}: usa TanStack Router`);
    // Excepciones: hooks.ts y core/router/ (createRouter + Register, como en lab-react y la skill react-bancal).
    if (capa === "core" && !/(^|\/)hooks?\.tsx?$/.test(f) && !/(^|\/)core\/router\//.test(f) && /^(react|react-dom|@tanstack\/react-)/.test(spec))
      anotar("FALLA", "capas", en(m.index), `core/ importa ${spec}: la lógica de dominio son funciones puras (los hooks, en hooks.ts)`);

    let destino = null;
    if (spec.startsWith(".")) destino = rel(resolve(dirname(ruta), spec));
    else if (spec.startsWith("@/")) destino = "src/" + spec.slice(2);
    else if (spec.startsWith("src/")) destino = spec;
    if (!destino) continue;
    const d = destino.split("/");
    if (d[1] !== "pods" || !d[2]) continue;
    if (capa === "pods" && partes[2] !== d[2])
      anotar("FALLA", "capas", en(m.index), `el pod ${partes[2]} importa del pod ${d[2]}: los pods nunca se importan entre sí`);
    if (capa !== "pods" && d.length > 3 && !/^index(\.tsx?)?$/.test(d[3]))
      anotar("FALLA", "capas", en(m.index), `importa ${spec}: un pod se importa solo por su index.ts`);
  }
  if (capa === "routes" && /\bfrom\s+["'][^"']*core\/[^"']*\/api["']/.test(texto))
    anotar("AVISO", "capas", f, "una ruta importa la capa api: las rutas solo navegan; los datos van en pods");

  // Convenciones React / TS
  for (const m of texto.matchAll(/\bkey\s*=\s*\{\s*(i|idx|index|indice|índice)\s*\}/g))
    anotar("FALLA", "react", en(m.index), `${m[0]}: la key es el id del elemento, nunca el índice`);
  for (const m of texto.matchAll(/\buse(Memo|Callback)\s*\(/g))
    anotar("AVISO", "react", en(m.index), `${m[0]}: solo con una razón medida (convención del proyecto)`);
  for (const m of texto.matchAll(/dangerouslySetInnerHTML/g))
    anotar("FALLA", "seguridad", en(m.index), "dangerouslySetInnerHTML");
  for (const m of texto.matchAll(/:\s*any\b|\bas\s+any\b|<any>/g))
    anotar("AVISO", "tipos", en(m.index), `"${m[0].trim()}": tipa o usa unknown`);
  for (const m of original.matchAll(/@ts-(ignore|nocheck)\b/g)) // van en comentarios: se buscan en el original
    anotar("FALLA", "tipos", en(m.index), `@ts-${m[1]}: arregla el tipo (o @ts-expect-error con motivo)`);
  for (const m of texto.matchAll(/\bconsole\.(log|debug)\s*\(/g))
    anotar("AVISO", "limpieza", en(m.index), `${m[0]} olvidado`);

  if (!ruta.endsWith(".tsx")) continue;

  // Elementos JSX en minúscula (no componentes ni genéricos de TS)
  for (const m of texto.matchAll(/<([a-z][a-z0-9]*)\b/g)) {
    const previo = texto.slice(0, m.index).trimEnd().slice(-1);
    if (/[\w$)\]]/.test(previo)) continue; // useState<number>, Array<string>…
    const tag = m[1];
    const attrs = etiqueta(texto, m.index);
    const donde = en(m.index);

    if (tag === "img" && !/\balt\s*=/.test(attrs)) anotar("FALLA", "a11y", donde, `<img> sin alt: ${corto(attrs)}`);
    if (NO_INTERACTIVOS.has(tag) && /\bon(Click|KeyDown|PointerDown)\s*=/.test(attrs) && !/\brole\s*=/.test(attrs))
      anotar("FALLA", "a11y", donde, `<${tag}> con evento de clic y sin role: no llega con teclado → usa <button> (guía §4)`);
    if (/\btabIndex\s*=\s*\{?\s*["']?[1-9]/.test(attrs)) anotar("AVISO", "a11y", donde, "tabIndex positivo: rompe el orden natural del foco");
    if (/\bstyle\s*=\s*\{\{[^}]*#[0-9a-f]{3,8}\b/i.test(attrs) || /\b(fill|stroke|stop-color)\s*=\s*["']#[0-9a-f]{3,8}["']/i.test(attrs))
      anotar("AVISO", "tokens", donde, "color hex en el JSX → usa el token (currentColor o var(--color-…))");

    const clases = clasesDe(attrs);
    if (!clases.length) continue;
    const base = (c) => c.slice(c.lastIndexOf(":") + 1).replace(/^!|!$/g, "");
    const variantes = (c) => (c.includes(":") ? c.slice(0, c.lastIndexOf(":")) : "");
    if (clases.length > 12)
      anotar("AVISO", "clases-limpias", donde, `<${tag}> con ${clases.length} utilidades (>12): ¿extraer a un componente?`);
    const tieneTransicion = clases.some((c) => /^(transition|animate-)/.test(base(c)));
    const tieneMotionReduce = clases.some((c) => c.startsWith("motion-reduce:"));
    const tieneFoco = clases.some((c) => /(^|:)(focus-visible|focus|focus-within|group-focus-visible|group-focus-within|peer-focus-visible|peer-focus)(:|$)/.test(variantes(c) + ":"));
    for (const c of clases) {
      const b = base(c), v = variantes(c);
      if (/\[(#|rgba?\(|hsla?\(|oklch\()/i.test(c)) anotar("FALLA", "tokens", donde, `color a pelo en "${c}" → va a @theme como token`);
      if (V3.test(b)) anotar("AVISO", "tailwind-v4", donde, `"${c}" es una clase de v3`);
      if (/^!|!$/.test(c.slice(c.lastIndexOf(":") + 1))) anotar("AVISO", "atajos", donde, `"${c}" usa !important`);
      const seMueve = /^animate-(?!none)/.test(b) || (/^-?(translate|scale|rotate)-/.test(b) && (VARIANTES_ESTADO.test(v) || tieneTransicion));
      if (seMueve && !v.split(":").includes("motion-safe") && !tieneMotionReduce)
        anotar("FALLA", "movimiento", donde, `"${c}" se mueve sin motion-safe: (prefers-reduced-motion, guía §4)`);
      if (/^outline-(none|hidden)$/.test(b) && !v && !tieneFoco)
        anotar("FALLA", "foco", donde, `<${tag}> con ${b} y sin focus-visible: → foco invisible`);
    }
  }
}

// ---------- Informe ----------
const orden = { FALLA: 0, AVISO: 1, INFO: 2 };
resultados.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
console.log(`Comprobación estática — ${raiz}`);
console.log(`  Código: ${codigo.length} ficheros .ts/.tsx (${codigo.filter(esTest).length} de test) · CSS: ${csss.map(rel).join(", ") || "(ninguno)"}`);
console.log(`  Tailwind: ${deps.tailwindcss ?? "no instalado"}\n`);
for (const r of resultados) console.log(`[${r.nivel}] ${r.puerta} · ${r.donde} · ${r.msg}`);
const nF = resultados.filter((r) => r.nivel === "FALLA").length;
const nA = resultados.filter((r) => r.nivel === "AVISO").length;
console.log(`\nResumen: ${nF} fallos, ${nA} avisos → ${nF ? "FALLA" : "PASA"}`);
process.exit(nF ? 1 : 0);
