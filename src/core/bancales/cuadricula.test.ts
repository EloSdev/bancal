import { describe, expect, it } from "vitest";
import { dentroDeCuadricula, dimensiones, vecinos } from "./cuadricula";
import type { Celda } from "./model";

describe("dimensiones", () => {
  it("C5.1 · un bancal de 120 × 90 cm tiene 4 columnas × 3 filas", () => {
    expect(dimensiones(120, 90)).toEqual({ columnas: 4, filas: 3 });
  });

  it("C5.1 · un bancal de 100 × 50 cm redondea hacia abajo a 3 × 1", () => {
    expect(dimensiones(100, 50)).toEqual({ columnas: 3, filas: 1 });
  });

  it("los límites del bancal dan 1 × 1 y 10 × 10 celdas", () => {
    expect(dimensiones(30, 30)).toEqual({ columnas: 1, filas: 1 });
    expect(dimensiones(300, 300)).toEqual({ columnas: 10, filas: 10 });
  });
});

describe("dentroDeCuadricula", () => {
  const demo = { columnas: 4, filas: 3 };

  it.each([
    [{ fila: 0, columna: 0 }, true],
    [{ fila: 2, columna: 3 }, true],
    [{ fila: 3, columna: 0 }, false],
    [{ fila: 0, columna: 4 }, false],
    [{ fila: -1, columna: 0 }, false],
  ])("C8.6 · en una cuadrícula 4 × 3, la celda %o está dentro: %s", (celda, esperado) => {
    expect(dentroDeCuadricula(celda, demo)).toBe(esperado);
  });
});

describe("vecinos", () => {
  const demo = { columnas: 4, filas: 3 }; // bancal de la demo, 120 × 90 cm

  /** Orden estable para comparar conjuntos de celdas. */
  const ordenadas = (celdas: Celda[]) =>
    [...celdas].sort((a, b) => a.fila - b.fila || a.columna - b.columna);

  it("C5.2 · una esquina tiene 3 vecinos", () => {
    expect(ordenadas(vecinos({ fila: 0, columna: 0 }, demo))).toEqual([
      { fila: 0, columna: 1 },
      { fila: 1, columna: 0 },
      { fila: 1, columna: 1 },
    ]);
  });

  it("C5.2 · la esquina opuesta también tiene 3 vecinos", () => {
    expect(ordenadas(vecinos({ fila: 2, columna: 3 }, demo))).toEqual([
      { fila: 1, columna: 2 },
      { fila: 1, columna: 3 },
      { fila: 2, columna: 2 },
    ]);
  });

  it("C5.2 · una celda de borde tiene 5 vecinos", () => {
    expect(ordenadas(vecinos({ fila: 0, columna: 1 }, demo))).toEqual([
      { fila: 0, columna: 0 },
      { fila: 0, columna: 2 },
      { fila: 1, columna: 0 },
      { fila: 1, columna: 1 },
      { fila: 1, columna: 2 },
    ]);
  });

  it("C5.2 · una celda del centro tiene 8 vecinos, diagonales incluidas", () => {
    expect(ordenadas(vecinos({ fila: 1, columna: 1 }, demo))).toEqual([
      { fila: 0, columna: 0 },
      { fila: 0, columna: 1 },
      { fila: 0, columna: 2 },
      { fila: 1, columna: 0 },
      { fila: 1, columna: 2 },
      { fila: 2, columna: 0 },
      { fila: 2, columna: 1 },
      { fila: 2, columna: 2 },
    ]);
  });

  it("C5.2 · ninguna celda de la cuadrícula tiene vecinos fuera de ella ni a sí misma", () => {
    for (let fila = 0; fila < demo.filas; fila++) {
      for (let columna = 0; columna < demo.columnas; columna++) {
        for (const v of vecinos({ fila, columna }, demo)) {
          expect(v.fila).toBeGreaterThanOrEqual(0);
          expect(v.fila).toBeLessThan(demo.filas);
          expect(v.columna).toBeGreaterThanOrEqual(0);
          expect(v.columna).toBeLessThan(demo.columnas);
          expect(v).not.toEqual({ fila, columna });
        }
      }
    }
  });

  it("una cuadrícula 1 × 1 no tiene vecinos", () => {
    expect(vecinos({ fila: 0, columna: 0 }, { columnas: 1, filas: 1 })).toEqual([]);
  });

  it("en una sola fila (3 × 1) el extremo tiene 1 vecino y el centro 2", () => {
    const fila = { columnas: 3, filas: 1 };
    expect(vecinos({ fila: 0, columna: 0 }, fila)).toEqual([{ fila: 0, columna: 1 }]);
    expect(ordenadas(vecinos({ fila: 0, columna: 1 }, fila))).toEqual([
      { fila: 0, columna: 0 },
      { fila: 0, columna: 2 },
    ]);
  });
});
