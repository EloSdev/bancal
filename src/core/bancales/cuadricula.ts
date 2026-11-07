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

/** ¿Cabe la celda en la cuadrícula? (al encoger un bancal, las de fuera se quitan) */
export function dentroDeCuadricula({ fila, columna }: Celda, { columnas, filas }: Dimensiones): boolean {
  return fila >= 0 && fila < filas && columna >= 0 && columna < columnas;
}

/** Las 8 celdas de alrededor, diagonales incluidas, sin salir de la cuadrícula. */
export function vecinos({ fila, columna }: Celda, dims: Dimensiones): Celda[] {
  const resultado: Celda[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dc = -1; dc <= 1; dc++) {
      const celda = { fila: fila + df, columna: columna + dc };
      const esElla = df === 0 && dc === 0;
      if (!esElla && dentroDeCuadricula(celda, dims)) resultado.push(celda);
    }
  }
  return resultado;
}
