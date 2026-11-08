// Colocar y quitar cultivos en las celdas de un bancal (editor, T13). Una
// plantación por celda («Reglas del dominio»); nunca muta la lista recibida.
import type { Mes } from "../cultivos/model";
import type { Celda, Plantacion } from "./model";

const misma = (a: Celda, b: Celda) => a.fila === b.fila && a.columna === b.columna;

/**
 * Pone el cultivo en la celda: si estaba vacía, añade la plantación; si había
 * otro cultivo, lo sustituye en su sitio; si ya era ese cultivo, no cambia
 * nada (conserva su mes de siembra).
 */
export function colocar(plantaciones: Plantacion[], celda: Celda, cultivoId: string, mesSiembra: Mes): Plantacion[] {
  const actual = plantaciones.find((p) => misma(p.celda, celda));
  if (actual?.cultivoId === cultivoId) return plantaciones;
  const nueva: Plantacion = { cultivoId, celda: { ...celda }, mesSiembra };
  return actual ? plantaciones.map((p) => (p === actual ? nueva : p)) : [...plantaciones, nueva];
}

/**
 * Deja la celda vacía. Si ya lo estaba, devuelve la MISMA lista (como
 * `colocar` sin cambios): así quien llama sabe que no hay nada que guardar.
 */
export function quitar(plantaciones: Plantacion[], celda: Celda): Plantacion[] {
  if (!plantaciones.some((p) => misma(p.celda, celda))) return plantaciones;
  return plantaciones.filter((p) => !misma(p.celda, celda));
}
