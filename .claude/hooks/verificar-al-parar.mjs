#!/usr/bin/env node
// Hook Stop de Bancal: antes de que el agente dé el trabajo por terminado, si
// hay cambios sin commit en el código, ejecuta los tests y el build. Si algo
// falla, sale con 2 y el agente no puede parar: le llegan las últimas líneas.
//
// Por qué: la puerta común de docs/tareas.md es «build y tests sin errores».
// Esto es la parte rápida y determinista; lo que pide navegador o criterio
// (criterios de la tarea, teclado, regresiones) sigue en la skill verify-task.
//
// Detalles:
// - Solo mira lo que afecta al build (src/, public/, index.html, package.json,
//   vite.config.*, tsconfig*). Si no hay cambios ahí, o aún no hay
//   package.json, no gasta tiempo.
// - Respeta stop_hook_active: si ya está continuando por un bloqueo, deja
//   parar (evita bucles).
// - El build va a una carpeta temporal: verificar no toca el dist/ del
//   proyecto. Por eso se ejecutan `vite build --outDir` y `tsc --noEmit` por
//   separado: con `npm run build -- --outDir` el argumento acabaría en tsc.
//
// Añadido el 2026-11-07, en la revisión del harness tras T1:
// - Siempre, haya o no cambios de código: ninguna tarea ✅ de docs/tareas.md
//   puede tener la línea «Verificación: —». Hace cumplir el ciclo «✅ solo
//   tras el verificador» (antes era solo un consejo de CLAUDE.md).
// - Con cambios de código, antes que los tests: check-estatico de verify-task
//   (capas, pods, key por índice, .only/.skip, react-router…). Bloquea solo
//   con [FALLA]; los [AVISO] no.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const VIGILADOS = ["src", "public", "index.html", "package.json", "package-lock.json", "vite.config.ts", "vite.config.js", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json"];

let entrada = "";
for await (const trozo of process.stdin) entrada += trozo;
let datos = {};
try { datos = JSON.parse(entrada); } catch {}

if (datos.stop_hook_active === true) process.exit(0);

const raiz = resolve(process.env.CLAUDE_PROJECT_DIR || datos.cwd || process.cwd());

// ---- Tareas ✅ sin verificación (siempre) ----
const rutaTareas = join(raiz, "docs", "tareas.md");
if (existsSync(rutaTareas)) {
  const texto = readFileSync(rutaTareas, "utf8").replace(/\r\n/g, "\n");
  const re = /^## (T\d+) · (.+?) — ✅[^\n]*\n([\s\S]*?)(?=^## |^---|(?![\s\S]))/gm;
  const sinVerificar = [];
  for (const m of texto.matchAll(re)) {
    const linea = m[3].match(/^\*\*Verificación:\*\*\s*(.*)$/m);
    if (!linea || /^(—|-|)$/.test(linea[1].trim())) sinVerificar.push(`${m[1]} · ${m[2]}`);
  }
  if (sinVerificar.length) {
    process.stderr.write(
      `En docs/tareas.md hay tareas ✅ con la línea «Verificación» vacía: ${sinVerificar.join(", ")}.\n` +
        "Una tarea solo es ✅ tras pasar el verificador (skill verify-task). Lánzalo y rellena la línea con su resultado, o vuelve a dejar la tarea en 🔄.\n",
    );
    process.exit(2);
  }
}

const pkgRuta = join(raiz, "package.json");
if (!existsSync(pkgRuta)) process.exit(0);

const estado = spawnSync("git", ["status", "--porcelain", "--", ...VIGILADOS], { cwd: raiz, encoding: "utf8" });
if (estado.status !== 0 || !estado.stdout.trim()) process.exit(0);

const ultimas = (r) => `${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim().split(/\r?\n/).slice(-30).join("\n");
// Rojo intencionado (añadido el 2026-11-07, revisión del harness tras T4): en
// TDD, o mientras otro agente escribe lo que pondrá el test en verde, el test
// falla a propósito. No hay vía de escape automática: el agente lo dice y,
// como stop_hook_active deja pasar la segunda parada, puede parar.
const fallar = (que, detalle) => {
  process.stderr.write(
    `Hay cambios sin commit en el código y «${que}» falla. Arréglalo antes de dar el trabajo por terminado:\n${detalle}\n\n` +
      "Si el rojo es INTENCIONADO (un test de TDD escrito antes del código, o datos que otro agente aún está escribiendo): " +
      "no toques el test para callar al hook; di al usuario qué test falla y por qué es esperado, y vuelve a parar.\n",
  );
  process.exit(2);
};

// ---- Comprobación estática (rápida, sin dependencias) ----
const rutaCheck = join(raiz, ".claude", "skills", "verify-task", "scripts", "check-estatico.mjs");
if (existsSync(rutaCheck)) {
  const check = spawnSync(process.execPath, [rutaCheck, raiz], { cwd: raiz, encoding: "utf8" });
  if (check.status === 1) {
    const fallos = (check.stdout ?? "").split(/\r?\n/).filter((l) => l.startsWith("[FALLA]")).join("\n");
    fallar("check-estatico", fallos + "\n(Si es un falso positivo del script, arregla el script con el usuario; no cambies el código para callarlo.)");
  }
}

if (!existsSync(join(raiz, "node_modules"))) fallar("npm install", "No hay node_modules: ejecuta npm install.");

let scripts = {};
try { scripts = JSON.parse(readFileSync(pkgRuta, "utf8")).scripts ?? {}; } catch {}
const correr = (cmd) => spawnSync(cmd, { cwd: raiz, shell: true, encoding: "utf8" });

if (scripts.test) {
  const tests = correr("npm test");
  if (tests.status !== 0) fallar("npm test", ultimas(tests));
}

// process.exit no ejecuta los finally: primero se limpia y luego se falla.
const salida = mkdtempSync(join(tmpdir(), "bancal-stop-"));
let fallo = null;
const vite = correr(`npx vite build --outDir "${join(salida, "dist")}" --emptyOutDir --logLevel warn`);
if (vite.status !== 0) fallo = ["vite build", vite];
else {
  const tsc = correr("npx tsc --noEmit");
  if (tsc.status !== 0) fallo = ["tsc --noEmit", tsc];
}
rmSync(salida, { recursive: true, force: true });
if (fallo) fallar(fallo[0], ultimas(fallo[1]));
process.exit(0);
