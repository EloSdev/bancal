import { describe, expect, it } from "vitest";
import { bancalDemo } from "../__fixtures__/bancales";
import { cultivosDePrueba } from "../__fixtures__/cultivos";
import { dimensiones } from "./cuadricula";
import type { Plantacion } from "./model";
import { estadoVecindad } from "./vecindad";

const en = (cultivoId: string, fila: number, columna: number): Plantacion => ({
  cultivoId,
  celda: { fila, columna },
  mesSiembra: 5,
});

const dims = dimensiones(bancalDemo.ancho, bancalDemo.largo); // 4 × 3

describe("estadoVecindad", () => {
  it("C14.1 · sin vecinos plantados no hay marca", () => {
    const plantaciones = [en("tomate", 0, 0), en("albahaca", 2, 3)];
    expect(estadoVecindad({ fila: 0, columna: 0 }, plantaciones, cultivosDePrueba, dims)).toBeNull();
  });

  it("C14.1 · una celda vacía no lleva marca aunque tenga vecinos", () => {
    const plantaciones = [en("tomate", 0, 0)];
    expect(estadoVecindad({ fila: 0, columna: 1 }, plantaciones, cultivosDePrueba, dims)).toBeNull();
  });

  it("C14.1 · con un vecino que perjudica, la celda es desfavorable aunque otro la ayude", () => {
    const plantaciones = [en("tomate", 0, 0), en("hinojo", 0, 1), en("albahaca", 1, 0)];
    expect(estadoVecindad({ fila: 0, columna: 0 }, plantaciones, cultivosDePrueba, dims)).toEqual({
      compatibilidad: "desfavorable",
      favorables: ["albahaca"],
      desfavorables: ["hinojo"],
    });
  });

  it("C14.1 · con vecinos que ayudan y ninguno que perjudique, favorable (los diagonales cuentan)", () => {
    const plantaciones = [en("tomate", 0, 0), en("albahaca", 1, 1)];
    expect(estadoVecindad({ fila: 1, columna: 1 }, plantaciones, cultivosDePrueba, dims)).toEqual({
      compatibilidad: "favorable",
      favorables: ["tomate"],
      desfavorables: [],
    });
  });

  it("C14.1 · con vecinos que ni ayudan ni perjudican, neutra", () => {
    const plantaciones = [en("albahaca", 0, 0), en("hinojo", 0, 1)];
    expect(estadoVecindad({ fila: 0, columna: 0 }, plantaciones, cultivosDePrueba, dims)).toEqual({
      compatibilidad: "neutra",
      favorables: [],
      desfavorables: [],
    });
  });

  it("cada cultivo vecino se nombra una vez aunque esté en varias celdas", () => {
    const plantaciones = [en("tomate", 1, 1), en("hinojo", 0, 0), en("hinojo", 2, 2)];
    expect(estadoVecindad({ fila: 1, columna: 1 }, plantaciones, cultivosDePrueba, dims)?.desfavorables).toEqual(["hinojo"]);
  });
});
