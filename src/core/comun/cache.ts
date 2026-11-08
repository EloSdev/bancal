// Caché en memoria de lo que devuelve la capa api (T21). Lo que ya se leyó
// se enseña al momento al volver a una pantalla, mientras se refresca por
// detrás (useCarga). Las escrituras de bancales invalidan su parte: nunca se
// enseña un bancal viejo. Vive mientras la pestaña está abierta.
//
// Claves: «<espacio>:<clave>» («cultivos:todos», «bancal:<id>»), para poder
// invalidar un espacio entero por su prefijo.

const valores = new Map<string, unknown>();
const enCurso = new Map<string, Promise<unknown>>();

// Sube con cada invalidación. Una carga anota la versión al empezar y solo
// guarda si sigue siendo la misma: lo leído antes de una escritura no
// vuelve a llenar la caché con datos viejos.
let version = 0;

export const versionCache = () => version;

/** El valor guardado, envuelto (así un `null` guardado se distingue de «no hay nada»). */
export function leerCache<T>(clave: string): { valor: T } | undefined {
  return valores.has(clave) ? { valor: valores.get(clave) as T } : undefined;
}

/** Guarda lo leído, salvo que se haya invalidado algo desde que empezó la carga. */
export function guardarCache(clave: string, valor: unknown, versionAlEmpezar: number): void {
  if (versionAlEmpezar === version) valores.set(clave, valor);
}

/** Borra las claves que empiezan por `prefijo` (y deja inservible lo que esté en vuelo). */
export function invalidarCache(prefijo: string): void {
  version++;
  for (const clave of [...valores.keys(), ...enCurso.keys()]) {
    if (clave.startsWith(prefijo)) {
      valores.delete(clave);
      enCurso.delete(clave);
    }
  }
}

/** Para los tests: cada uno empieza sin caché. */
export function vaciarCache(): void {
  valores.clear();
  enCurso.clear();
  version++;
}

/**
 * Carga y guarda en la caché sin que nadie lo pida todavía (al arrancar la
 * app). No repite lo que ya está guardado o en vuelo. Si falla, no pasa
 * nada: la pantalla que lo necesite lo volverá a pedir y enseñará el error.
 */
export async function precargar<T>(clave: string, cargar: () => Promise<T>): Promise<void> {
  if (valores.has(clave) || enCurso.has(clave)) return;
  const versionAlEmpezar = version;
  const promesa = cargar();
  enCurso.set(clave, promesa);
  try {
    guardarCache(clave, await promesa, versionAlEmpezar);
  } catch {
    // La pantalla que lo pida lo cargará de nuevo y, si falla, lo dirá.
  } finally {
    if (enCurso.get(clave) === promesa) enCurso.delete(clave);
  }
}

/** La precarga de esa clave si aún está en vuelo: quien la necesita la espera en vez de repetirla. */
export function precargaEnCurso<T>(clave: string): Promise<T> | undefined {
  return enCurso.get(clave) as Promise<T> | undefined;
}
