#!/usr/bin/env node
// Hook PreToolUse de Bancal: frena lo que no se puede deshacer.
// Registrado en .claude/settings.json. Sale con 2 (bloquea; el motivo le llega
// al agente), con 0 + JSON "ask" (pide confirmación al usuario) o con 0 a secas
// (deja pasar).
//
// Qué frena y por qué:
// - Comandos git que pierden trabajo (push --force, reset --hard, clean -f) y
//   borrados recursivos de la raíz, del home o de .git: la sesión puede ir en
//   modo auto y nadie confirma cada paso.
// - Ficheros de secretos o claves: Bancal no tiene backend ni credenciales.
// - src/routeTree.gen.ts: lo genera @tanstack/router-plugin al construir;
//   editarlo a mano se pierde en el siguiente build (se cambian las rutas en
//   src/routes/).
// - Escrituras fuera del repo, salvo temporales y la configuración de Claude.
// Para cambiar algo, edita las listas de abajo.

import { resolve, relative, isAbsolute, join } from "node:path";
import { tmpdir, homedir } from "node:os";

const GENERADOS = ["src/routeTree.gen.ts"];

const COMANDOS = [
  [/\bgit\s+push\b(?=.*\s(--force|-f)(\s|$))(?!.*--force-with-lease)/i, "git push --force (usa --force-with-lease)"],
  [/\bgit\s+reset\s+--hard\b/i, "git reset --hard descarta cambios sin commit"],
  [/\bgit\s+clean\s+-[a-z]*f/i, "git clean -f borra ficheros sin seguimiento"],
  [/\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b[^|;&]*\s(\/|~|\*|\.|\.\.)(\s|$)/i, "borrado recursivo de una carpeta raíz, del home o de todo"],
  [/\bRemove-Item\b(?=.*-Recurse)[^|;]*\s(\/|~|\*|\.|\.\.|[A-Z]:\\?)(\s|$)/i, "borrado recursivo de una carpeta raíz, del home o de todo"],
  [/(\brm\s+-[a-z]*r|\bRemove-Item\b(?=.*-Recurse)|\brmdir\s+\/s|\brd\s+\/s)[^|;&]*(^|[\s"'./\\])\.git([\s"'/\\]|$)/i, "borrado de .git (todo el historial)"],
];

const FICHEROS_SECRETOS = /(^|[\\/])\.env(\.(?!example$|sample$|template$)[^\\/]+)?$|\.(pem|key|p12|pfx)$|(^|[\\/])id_(rsa|ed25519)$/i;

let entrada = "";
for await (const trozo of process.stdin) entrada += trozo;
let datos;
try { datos = JSON.parse(entrada); } catch { process.exit(0); }

const { tool_name: herramienta = "", tool_input: params = {} } = datos;
const raiz = resolve(process.env.CLAUDE_PROJECT_DIR || datos.cwd || process.cwd());

const bloquear = (motivo) => {
  process.stderr.write(`BLOQUEADO por el harness de Bancal: ${motivo}. Si de verdad hace falta, pídeselo al usuario o ajusta .claude/hooks/guardia-irreversible.mjs.\n`);
  process.exit(2);
};
const preguntar = (motivo) => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: {
    hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: motivo,
  } }));
  process.exit(0);
};
const dentro = (base, p) => { const r = relative(base, p); return r === "" || (!r.startsWith("..") && !isAbsolute(r)); };

if (/^(Bash|PowerShell)$/.test(herramienta)) {
  const cmd = String(params.command ?? "");
  for (const [re, motivo] of COMANDOS) if (re.test(cmd)) bloquear(motivo);
}

if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(herramienta)) {
  const ruta = String(params.file_path ?? params.notebook_path ?? "");
  if (!ruta) process.exit(0);
  if (FICHEROS_SECRETOS.test(ruta)) bloquear(`fichero de secretos o clave (${ruta})`);

  const abs = resolve(raiz, ruta);
  if (dentro(raiz, abs)) {
    const rel = relative(raiz, abs).split(/[\\/]/).join("/");
    if (GENERADOS.includes(rel))
      bloquear(`${rel} es generado por @tanstack/router-plugin al construir; cambia las rutas en src/routes/ y ejecuta el build`);
    process.exit(0);
  }

  // Fuera del repo: se permite lo temporal y la configuración de Claude
  // (memoria automática); el resto, con confirmación.
  const cfg = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
  const libres = [tmpdir(), process.env.TEMP, process.env.TMP, join(cfg, "projects")].filter(Boolean).map((p) => resolve(p));
  if (libres.some((b) => dentro(b, abs))) process.exit(0);
  preguntar(`Escritura fuera del repo: ${abs}. ¿Es intencionado?`);
}

process.exit(0);
