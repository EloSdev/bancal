#!/usr/bin/env node
// Servidor estático mínimo para verificar el build de Bancal en el navegador.
// Uso:  node servir.mjs <carpeta-dist> [puerto=0] [minutos=15]
// Con puerto 0 elige uno libre (así nunca acabas mirando la web de otro
// proyecto que ya ocupaba el 4173). Se apaga solo pasados los minutos.
// Fallback de SPA: una ruta sin extensión que no existe como fichero
// (/bancales/3?mes=5) devuelve index.html y el router decide. Un recurso con
// extensión que no existe (/assets/x.js, /crops.json) sigue dando 404, para
// que la consola lo delate.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve, sep } from "node:path";

const carpeta = resolve(process.argv[2] ?? ".");
const puerto = Number(process.argv[3] ?? 0);
const minutos = Number(process.argv[4] ?? 15);

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".avif": "image/avif", ".gif": "image/gif", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
};

const servidor = createServer(async (req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let fichero = resolve(join(carpeta, ruta));
  if (fichero !== carpeta && !fichero.startsWith(carpeta + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    let info = await stat(fichero).catch(() => null);
    if (!info && !extname(ruta)) {
      fichero = join(carpeta, "index.html");
      info = await stat(fichero);
    }
    if (info.isDirectory()) fichero = join(fichero, "index.html");
    const datos = await readFile(fichero);
    res.writeHead(200, { "Content-Type": TIPOS[extname(fichero).toLowerCase()] ?? "application/octet-stream" });
    res.end(datos);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end(`404: ${ruta}`);
  }
});

servidor.listen(puerto, "127.0.0.1", () => {
  console.log(`Sirviendo ${carpeta}`);
  console.log(`URL: http://127.0.0.1:${servidor.address().port}/`);
  console.log(`PID: ${process.pid} (para pararlo: Stop-Process -Id ${process.pid})`);
  console.log(`Se apaga solo en ${minutos} min.`);
});
setTimeout(() => process.exit(0), minutos * 60_000);
