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
const pkgRuta = join(raiz, "package.json");
if (!existsSync(pkgRuta)) process.exit(0);

const estado = spawnSync("git", ["status", "--porcelain", "--", ...VIGILADOS], { cwd: raiz, encoding: "utf8" });
if (estado.status !== 0 || !estado.stdout.trim()) process.exit(0);

const ultimas = (r) => `${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim().split(/\r?\n/).slice(-30).join("\n");
const fallar = (que, detalle) => {
  process.stderr.write(`Hay cambios sin commit en el código y «${que}» falla. Arréglalo antes de dar el trabajo por terminado:\n${detalle}\n`);
  process.exit(2);
};

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
