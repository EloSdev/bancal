#!/usr/bin/env node
// Prepara la pasada de navegador "por lotes" de verify-task. Escribe en
// .playwright-mcp/ (ignorada por git; el MCP no puede leer el scratchpad):
//   - sonda-global.js: sonda-pagina.js colgada de window.__sonda
//   - lote.js: recorre rutas × anchos, inyecta la sonda con addScriptTag,
//     saca una captura de cada combinación, escucha la consola y repite con
//     movimiento reducido.
// Se ejecuta con UNA llamada:
//   browser_run_code_unsafe({ filename: ".playwright-mcp/lote.js" })
// y devuelve solo los problemas, agrupados (el mismo problema en varias
// pantallas sale una vez, con la lista de dónde).
//
// Uso:
//   node preparar-lote.mjs <url-base> <ruta> [<ruta>...] [--anchos 360,1440] [--espera ms]
//
// Por qué (2026-11-07, revisión del harness tras T1): pegar la sonda entera
// en cada browser_evaluate costó ~90k tokens para verificar 2 pantallas
// vacías. El MCP repite en su respuesta el código que ejecuta, así que la
// sonda no va en lote.js: la lee Playwright del disco (addScriptTag + path).
// En lote.js no hay import ni require (el MCP lo ejecuta en un vm sin ellos).
//
// Lo que NO hace (sigue a mano, pasos 3, 5, 7 y 8 de la puerta 4): limpiar o
// sembrar localStorage, interactuar, teclado y foco, aria-live y MIRAR las
// capturas.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto) => {
  const i = args.indexOf(nombre);
  if (i === -1) return porDefecto;
  const valor = args[i + 1];
  args.splice(i, 2);
  return valor;
};
const anchos = opcion("--anchos", "360,1440").split(",").map(Number).filter(Boolean);
const espera = Number(opcion("--espera", "0")) || 0;
const [base, ...rutas] = args;
if (!base || !/^https?:\/\//.test(base) || rutas.length === 0) {
  process.stderr.write("Uso: node preparar-lote.mjs <url-base> <ruta> [<ruta>...] [--anchos 360,1440] [--espera ms]\n");
  process.exit(2);
}

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const carpeta = join(raiz, ".playwright-mcp");
mkdirSync(carpeta, { recursive: true });

const sonda = readFileSync(join(aqui, "sonda-pagina.js"), "utf8").trim();
const rutaSonda = join(carpeta, "sonda-global.js");
writeFileSync(rutaSonda, `window.__sonda = ${sonda};\n`);

const codigo = `async (page) => {
  const base = ${JSON.stringify(base.replace(/\/$/, ""))}, rutas = ${JSON.stringify(rutas)}, anchos = ${JSON.stringify(anchos)};
  const altos = { 360: 800, 768: 1024, 1440: 900 }, espera = ${espera};
  const carpeta = ${JSON.stringify(carpeta)}, sondaPath = ${JSON.stringify(rutaSonda)};

  const consola = [];
  const alConsole = (m) => { if (["error", "warning"].includes(m.type())) consola.push(m.type() + ": " + m.text().slice(0, 200)); };
  const alError = (e) => consola.push("pageerror: " + String(e).slice(0, 200));
  const alResponder = (r) => { if (r.status() >= 400) consola.push(r.status() + " " + r.url()); };
  page.on("console", alConsole); page.on("pageerror", alError); page.on("response", alResponder);

  const medir = async (ruta) => {
    await page.goto(base + ruta, { waitUntil: "networkidle" });
    // Latencia simulada de la capa api: espera a que se vaya «Cargando…».
    await page.getByText("Cargando…").first().waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
    if (espera) await page.waitForTimeout(espera);
    await page.addScriptTag({ path: sondaPath });
    return page.evaluate(() => window.__sonda());
  };
  const slug = (ruta) => ruta.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "raiz";
  const problemas = (s) => {
    const p = [];
    if (s.desbordamiento.hayScrollHorizontal || s.desbordamiento.tapadoConOverflowHidden) p.push(["desbordamiento", s.desbordamiento]);
    for (const f of s.contraste.fallos) p.push(["contraste", f]);
    for (const f of s.contraste.revisarAMano) p.push(["contrasteRevisarAMano", f]);
    if (s.encabezados.h1 !== 1) p.push(["h1", s.encabezados.h1 + " h1"]);
    for (const f of s.encabezados.saltos) p.push(["saltoDeEncabezado", f]);
    for (const k of ["sinAlt", "rotas", "deformadas"]) for (const f of s.imagenes[k]) p.push(["imagen " + k, f]);
    for (const f of s.interactivos.sinNombre) p.push(["sinNombre", f]);
    for (const f of s.interactivos.pequenos) p.push(["pequeno", f.texto + " (" + f.el.split(".")[0] + ", lado menor " + Math.min(...f.tam.split("×").map(Number)) + " px)"]);
    return p;
  };

  const pantallas = [], agrupados = new Map();
  let reducedMotionAlEmpezar = null;
  try {
    for (const ancho of anchos) {
      await page.setViewportSize({ width: ancho, height: altos[ancho] ?? 900 });
      for (const ruta of rutas) {
        const s = await medir(ruta);
        if (reducedMotionAlEmpezar === null) reducedMotionAlEmpezar = s.reducedMotion;
        const donde = ruta + "@" + ancho;
        await page.screenshot({ path: carpeta + "/lote-" + slug(ruta) + "-" + ancho + ".png", fullPage: true });
        const final = new URL(page.url());
        pantallas.push(donde + (final.pathname + final.search !== ruta ? " → " + final.pathname + final.search : "") + " · " + s.titulo.slice(0, 40) + " · textos " + s.contraste.textosRevisados + " · interactivos " + s.interactivos.total);
        for (const [tipo, detalle] of problemas(s)) {
          const clave = tipo + JSON.stringify(detalle);
          if (!agrupados.has(clave)) agrupados.set(clave, { tipo, detalle, en: [] });
          agrupados.get(clave).en.push(donde);
        }
      }
    }

    // Movimiento reducido: ninguna animación en marcha.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const animacionesConReduce = [];
    for (const ruta of rutas) {
      const s = await medir(ruta);
      if (s.animacionesEnMarcha.length) animacionesConReduce.push({ ruta, animaciones: s.animacionesEnMarcha });
    }
    await page.emulateMedia({ reducedMotion: null });
    await page.setViewportSize({ width: 1440, height: 900 });

    return { pantallas, reducedMotionAlEmpezar, consola, animacionesConReduce, problemas: [...agrupados.values()], capturas: carpeta + "/lote-<ruta>-<ancho>.png" };
  } finally {
    page.off("console", alConsole); page.off("pageerror", alError); page.off("response", alResponder);
  }
}
`;

writeFileSync(join(carpeta, "lote.js"), codigo);
process.stdout.write(
  `Escrito .playwright-mcp/lote.js: ${rutas.length} rutas × ${anchos.length} anchos + movimiento reducido.\n` +
    `Ejecútalo con browser_run_code_unsafe({ filename: ".playwright-mcp/lote.js" }) y mira las capturas.\n`,
);
