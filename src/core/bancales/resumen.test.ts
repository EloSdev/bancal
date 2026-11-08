import { describe, expect, it } from "vitest";
import { bancalDemo } from "../__fixtures__/bancales";
import { cultivosDePrueba } from "../__fixtures__/cultivos";
import type { Plantacion } from "./model";
import { resumenBancal } from "./resumen";

const en = (cultivoId: string, fila: number, columna: number, mesSiembra = 5): Plantacion => ({
  cultivoId,
  celda: { fila, columna },
  mesSiembra,
});

describe("resumenBancal", () => {
  it("C11.1 · un bancal vacío: sus celdas (4 × 3 = 12), ninguna plantada y sin avisos", () => {
    expect(resumenBancal({ bancal: bancalDemo, plantaciones: [] }, cultivosDePrueba)).toEqual({
      columnas: 4,
      filas: 3,
      celdas: 12,
      plantadas: 0,
      avisos: 0,
    });
  });

  it("C11.1 · cuenta las celdas plantadas y los avisos pendientes (hinojo junto a tomate → 1)", () => {
    const plantaciones = [en("tomate", 0, 0), en("hinojo", 0, 1), en("albahaca", 2, 3)];
    expect(resumenBancal({ bancal: bancalDemo, plantaciones }, cultivosDePrueba)).toMatchObject({
      plantadas: 3,
      avisos: 1,
    });
  });

  it("C11.1 · los avisos de sol y de temporada también cuentan", () => {
    const sombra = { ...bancalDemo, horasSol: 2 };
    // Tomate en sombra (sol) y sembrado en enero (fuera de temporada): 2 avisos.
    expect(resumenBancal({ bancal: sombra, plantaciones: [en("tomate", 0, 0, 1)] }, cultivosDePrueba).avisos).toBe(2);
  });
});
