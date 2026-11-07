import { describe, expect, it } from "vitest";
import { enVentana } from "./ventana";

describe("enVentana", () => {
  it.each([
    [4, false],
    [5, true],
    [6, true],
    [7, false],
  ])("ventana de mayo a junio: mes %s → %s (ambos extremos incluidos)", (mes, esperado) => {
    expect(enVentana(mes, { desde: 5, hasta: 6 })).toBe(esperado);
  });

  it("una ventana de un solo mes contiene solo ese mes", () => {
    expect(enVentana(5, { desde: 5, hasta: 5 })).toBe(true);
    expect(enVentana(6, { desde: 5, hasta: 5 })).toBe(false);
  });

  it.each([
    [9, false],
    [10, true],
    [12, true],
    [1, true],
    [2, true],
    [3, false],
  ])("ventana que cruza el año (octubre a febrero): mes %s → %s", (mes, esperado) => {
    expect(enVentana(mes, { desde: 10, hasta: 2 })).toBe(esperado);
  });
});
