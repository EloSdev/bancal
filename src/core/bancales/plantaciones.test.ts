import { describe, expect, it } from "vitest";
import type { Plantacion } from "./model";
import { colocar, quitar } from "./plantaciones";

const en = (cultivoId: string, fila: number, columna: number, mesSiembra = 5): Plantacion => ({
  cultivoId,
  celda: { fila, columna },
  mesSiembra,
});

describe("colocar", () => {
  it("C13.2 · en una celda vacía añade la plantación", () => {
    const antes = [en("tomate", 0, 0)];
    expect(colocar(antes, { fila: 1, columna: 2 }, "albahaca", 5)).toEqual([en("tomate", 0, 0), en("albahaca", 1, 2)]);
  });

  it("C13.2 · en una celda ocupada sustituye el cultivo (una plantación por celda)", () => {
    const antes = [en("tomate", 0, 0), en("hinojo", 0, 1)];
    expect(colocar(antes, { fila: 0, columna: 1 }, "albahaca", 5)).toEqual([en("tomate", 0, 0), en("albahaca", 0, 1)]);
  });

  it("colocar el mismo cultivo donde ya está no cambia nada (conserva su mes de siembra)", () => {
    const antes = [en("tomate", 0, 0, 4)];
    // La misma lista (no una copia): así el editor sabe que no hay nada que guardar.
    expect(colocar(antes, { fila: 0, columna: 0 }, "tomate", 5)).toBe(antes);
  });

  it("no muta la lista que recibe", () => {
    const antes = [en("tomate", 0, 0)];
    colocar(antes, { fila: 0, columna: 0 }, "albahaca", 5);
    expect(antes).toEqual([en("tomate", 0, 0)]);
  });
});

describe("quitar", () => {
  it("C13.3 · quita la plantación de esa celda y deja las demás", () => {
    const antes = [en("tomate", 0, 0), en("hinojo", 0, 1)];
    expect(quitar(antes, { fila: 0, columna: 0 })).toEqual([en("hinojo", 0, 1)]);
  });

  it("quitar de una celda vacía no cambia nada", () => {
    const antes = [en("tomate", 0, 0)];
    expect(quitar(antes, { fila: 2, columna: 2 })).toBe(antes);
  });
});
