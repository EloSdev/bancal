// La marca de compatibilidad de cada celda del editor (T14): cómo se lleva
// su cultivo con los de las 8 celdas de alrededor. Se deriva en cada render.
import { relacionEntre } from "../cultivos/compatibilidad";
import type { Compatibilidad, Cultivo } from "../cultivos/model";
import { vecinos, type Dimensiones } from "./cuadricula";
import type { Celda, Plantacion } from "./model";

export interface EstadoVecindad {
  /** Desfavorable si algún vecino perjudica; si no, favorable si alguno ayuda; si no, neutra. */
  compatibilidad: Compatibilidad;
  /** Ids de los cultivos vecinos que ayudan / perjudican, cada uno una vez. */
  favorables: string[];
  desfavorables: string[];
}

const misma = (a: Celda, b: Celda) => a.fila === b.fila && a.columna === b.columna;

/** null si la celda está vacía o no tiene ningún vecino plantado (no hay nada que marcar). */
export function estadoVecindad(
  celda: Celda,
  plantaciones: Plantacion[],
  cultivos: Cultivo[],
  dims: Dimensiones,
): EstadoVecindad | null {
  const porId = new Map(cultivos.map((c) => [c.id, c]));
  const cultivoEn = (c: Celda) => {
    const plantacion = plantaciones.find((p) => misma(p.celda, c));
    return plantacion && porId.get(plantacion.cultivoId);
  };

  const propio = cultivoEn(celda);
  if (!propio) return null;
  const vecinosPlantados = vecinos(celda, dims).flatMap((c) => {
    const cultivo = cultivoEn(c);
    return cultivo ? [cultivo] : [];
  });
  if (vecinosPlantados.length === 0) return null;

  const favorables = new Set<string>();
  const desfavorables = new Set<string>();
  for (const vecino of vecinosPlantados) {
    const { compatibilidad } = relacionEntre(propio, vecino);
    if (compatibilidad === "favorable") favorables.add(vecino.id);
    if (compatibilidad === "desfavorable") desfavorables.add(vecino.id);
  }
  const compatibilidad: Compatibilidad =
    desfavorables.size > 0 ? "desfavorable" : favorables.size > 0 ? "favorable" : "neutra";
  return { compatibilidad, favorables: [...favorables], desfavorables: [...desfavorables] };
}
