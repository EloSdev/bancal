// Cuadrícula de un bancal en celdas de 30 × 30 cm («Reglas del dominio» de CLAUDE.md).
import type { Celda, Plantacion } from "./model";

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

/** Las plantaciones que se quedarían fuera si el bancal pasara a medir ancho × largo (C12.6). */
export function plantacionesFuera(plantaciones: Plantacion[], ancho: number, largo: number): Plantacion[] {
  const dims = dimensiones(ancho, largo);
  return plantaciones.filter(({ celda }) => !dentroDeCuadricula(celda, dims));
}

export type Movimiento = "arriba" | "abajo" | "izquierda" | "derecha" | "inicio" | "fin";

/** La celda a la que lleva una tecla de flecha, Inicio o Fin, sin salir de la cuadrícula (editor, T13). */
export function moverCelda({ fila, columna }: Celda, movimiento: Movimiento, { columnas, filas }: Dimensiones): Celda {
  const limitar = (valor: number, maximo: number) => Math.min(Math.max(valor, 0), maximo - 1);
  switch (movimiento) {
    case "arriba":
      return { fila: limitar(fila - 1, filas), columna };
    case "abajo":
      return { fila: limitar(fila + 1, filas), columna };
    case "izquierda":
      return { fila, columna: limitar(columna - 1, columnas) };
    case "derecha":
      return { fila, columna: limitar(columna + 1, columnas) };
    case "inicio":
      return { fila, columna: 0 };
    case "fin":
      return { fila, columna: columnas - 1 };
    default: {
      const nunca: never = movimiento;
      return nunca;
    }
  }
}
