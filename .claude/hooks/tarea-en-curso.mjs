#!/usr/bin/env node
// Hook SessionStart de Bancal: al arrancar, reanudar, tras /clear y tras una
// compactación, inyecta la tarea en curso de docs/tareas.md.
//
// Por qué (2026-11-07, en lugar de un WIP.md como el de ../gold):
// - El estado de las tareas ya vive en docs/tareas.md (⬜ 🔄 ✅ ❌, criterios y
//   línea Verificación). Un segundo fichero de estado se desincronizaría.
// - Lo que faltaba era la garantía: tras una compactación, el agente solo
//   "sabía" que tenía que releer tareas.md porque lo dice CLAUDE.md. Esto lo
//   pone en el contexto siempre, de forma determinista.
// - Solo el bloque de UNA tarea (unas 15 líneas), no el plan entero.
//
// Qué tarea: la primera 🔄; si no hay, la primera ❌; si no, la primera ⬜.
// Nunca bloquea: sale siempre con 0.

import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

let entrada = "";
for await (const trozo of process.stdin) entrada += trozo;
let datos = {};
try { datos = JSON.parse(entrada); } catch {}

const raiz = resolve(process.env.CLAUDE_PROJECT_DIR || datos.cwd || process.cwd());
const rutaTareas = join(raiz, "docs", "tareas.md");
if (!existsSync(rutaTareas)) process.exit(0);

const texto = readFileSync(rutaTareas, "utf8").replace(/\r\n/g, "\n");

// Bloques "## T<n> · título — <estado>" hasta el siguiente "## " o "---".
const tareas = [];
const re = /^## (T\d+) · (.+?) — (⬜|🔄|✅|❌)[^\n]*\n([\s\S]*?)(?=^## |^---|(?![\s\S]))/gm;
for (const m of texto.matchAll(re)) tareas.push({ id: m[1], titulo: m[2], estado: m[3], cuerpo: m[4].trim() });
if (tareas.length === 0) process.exit(0);

const actual =
  tareas.find((t) => t.estado === "🔄") ??
  tareas.find((t) => t.estado === "❌") ??
  tareas.find((t) => t.estado === "⬜");

const hechas = tareas.filter((t) => t.estado === "✅").length;
const lineas = [`Plan (docs/tareas.md): ${hechas}/${tareas.length} tareas ✅.`];

if (!actual) {
  lineas.push("Todas las tareas del MVP están ✅. Lo siguiente sale de la lista «Iteraciones» (skill plan-tasks).");
} else {
  const como = { "🔄": "EN CURSO", "❌": "FALLÓ LA VERIFICACIÓN: arréglala antes de seguir", "⬜": "SIGUIENTE (aún no empezada)" }[actual.estado];
  lineas.push(`Tarea ${como}: ${actual.id} · ${actual.titulo} — ${actual.estado}`, "", actual.cuerpo);
}

// Ficheros sin commit: lo que se estaba tocando cuando se cortó la sesión.
const estado = spawnSync("git", ["status", "--porcelain"], { cwd: raiz, encoding: "utf8" });
if (estado.status === 0) {
  const cambios = estado.stdout.split("\n").filter((l) => l.trim());
  if (cambios.length) {
    lineas.push("", `Cambios sin commit (${cambios.length}):`, ...cambios.slice(0, 15).map((l) => "  " + l));
    if (cambios.length > 15) lineas.push(`  … y ${cambios.length - 15} más`);
  }
}

lineas.push("", "Ciclo: 🔄 → construir con su skill → verificador (verify-task) → ✅ y línea Verificación → commit. Antes de seguir, relee los criterios en docs/tareas.md.");

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: lineas.join("\n") },
}));
process.exit(0);
