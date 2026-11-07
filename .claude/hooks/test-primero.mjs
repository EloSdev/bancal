#!/usr/bin/env node
// Hook PreToolUse de Bancal (Write): en src/core/ el test va primero.
// La guía (§4) dice que el núcleo del proyecto, las funciones puras de core/,
// se desarrolla con TDD. Este hook lo garantiza: no deja CREAR un módulo nuevo
// en src/core/ si todavía no existe su test al lado (foo.ts → foo.test.ts).
//
// - Solo actúa al crear: editar un fichero que ya existe no se frena.
// - Excepciones, porque no tienen lógica que probar: index.ts (reexporta),
//   model.ts (solo tipos), *.d.ts y lo que hay en __fixtures__/ (datos de
//   prueba compartidos que manda la skill tdd-core; añadido el 2026-11-07).
// - Los propios tests (*.test.ts) siempre se pueden crear: son el paso 1.
// Sale con 2 (bloquea, el motivo le llega al agente) o con 0 (deja pasar).

import { existsSync } from "node:fs";
import { resolve, relative, isAbsolute, basename, dirname, join } from "node:path";

let entrada = "";
for await (const trozo of process.stdin) entrada += trozo;
let datos;
try { datos = JSON.parse(entrada); } catch { process.exit(0); }

const ruta = String(datos.tool_input?.file_path ?? "");
if (!ruta) process.exit(0);

const raiz = resolve(process.env.CLAUDE_PROJECT_DIR || datos.cwd || process.cwd());
const abs = resolve(raiz, ruta);
const rel = relative(raiz, abs);
if (rel.startsWith("..") || isAbsolute(rel)) process.exit(0);

const partes = rel.split(/[\\/]/);
if (partes[0] !== "src" || partes[1] !== "core") process.exit(0);

const nombre = basename(abs);
if (!/\.tsx?$/.test(nombre)) process.exit(0);
if (/\.(test|spec)\.tsx?$/.test(nombre) || /\.d\.ts$/.test(nombre)) process.exit(0);
if (["index.ts", "model.ts"].includes(nombre)) process.exit(0);
if (partes.includes("__fixtures__")) process.exit(0);
if (existsSync(abs)) process.exit(0);

const base = nombre.replace(/\.tsx?$/, "");
const candidatos = ["test.ts", "test.tsx", "spec.ts"].map((ext) => join(dirname(abs), `${base}.${ext}`));
if (candidatos.some((c) => existsSync(c))) process.exit(0);

process.stderr.write(
  `BLOQUEADO por el harness de Bancal (test primero): vas a crear ${rel.split(/[\\/]/).join("/")} ` +
  `y no existe ${base}.test.ts a su lado. En src/core/ se trabaja con TDD (skill tdd-core): ` +
  `escribe primero el test, comprueba que falla por el motivo correcto y luego crea el módulo.\n`,
);
process.exit(2);
