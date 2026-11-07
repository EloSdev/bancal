// Cuadrícula de un bancal en celdas de 30 × 30 cm («Reglas del dominio» de CLAUDE.md).
import type { Celda } from "./model";

export const LADO_CELDA_CM = 30;

export interface Dimensiones {
  columnas: number;
  filas: number;
}

/** Columnas = ⌊ancho / 30⌋, filas = ⌊largo / 30⌋; los cm sobrantes no se usan. */
export function dimensiones(ancho: number, largo: number): Dimensiones {
  return {
    columnas: Math.floor(ancho / LADO_CELDA_CM),
    filas: Math.floor(largo / LADO_CELDA_CM),
  };
}

/** Las 8 celdas de alrededor, diagonales incluidas, sin salir de la cuadrícula. */
export function vecinos({ fila, columna }: Celda, { columnas, filas }: Dimensiones): Celda[] {
  const resultado: Celda[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dc = -1; dc <= 1; dc++) {
      const f = fila + df;
      const c = columna + dc;
      const esElla = df === 0 && dc === 0;
      if (!esElla && f >= 0 && f < filas && c >= 0 && c < columnas) {
        resultado.push({ fila: f, columna: c });
      }
    }
  }
  return resultado;
}
