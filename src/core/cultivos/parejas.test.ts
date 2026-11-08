import { describe, expect, it } from "vitest";
import { albahaca, cultivosDePrueba, hinojo, lechuga, tomate } from "../__fixtures__/cultivos";
import type { Cultivo } from "./model";
import { elegir, parejas } from "./parejas";

const ids = (lista: { a: Cultivo; b: Cultivo }[]) => lista.map(({ a, b }) => `${a.id}+${b.id}`);

describe("parejas", () => {
  it("C23.2 · da cada pareja que se ayuda una sola vez, aunque figure en los dos cultivos", () => {
    const favorables = parejas([tomate, albahaca, hinojo, lechuga], "favorable");
    expect(ids(favorables)).toEqual(["tomate+albahaca"]);
    expect(favorables[0]!.motivo).toBe("Pareja tradicional.");
  });

  it("C23.2 · da las que se perjudican con su motivo", () => {
    const desfavorables = parejas([tomate, albahaca, hinojo, lechuga], "desfavorable");
    expect(ids(desfavorables)).toEqual(["tomate+hinojo"]);
    expect(desfavorables[0]!.motivo).toMatch(/hinojo/);
  });

  it("C23.2 · basta con que la relación figure en uno de los dos (es simétrica)", () => {
    const soloEnUno: Cultivo = { ...albahaca, compatibles: [] };
    expect(ids(parejas([tomate, soloEnUno], "favorable"))).toEqual(["tomate+albahaca"]);
  });

  it("C23.2 · si figura como favorable y como desfavorable, cuenta solo como desfavorable (como en el editor)", () => {
    const contradictorio: Cultivo = { ...hinojo, compatibles: [{ cultivoId: "tomate", motivo: "x" }] };
    expect(parejas([tomate, contradictorio], "favorable")).toEqual([]);
    expect(ids(parejas([tomate, contradictorio], "desfavorable"))).toEqual(["tomate+hinojo"]);
  });

  it("C23.2 · sin parejas de ese tipo, lista vacía", () => {
    expect(parejas([lechuga], "favorable")).toEqual([]);
    expect(parejas(cultivosDePrueba, "favorable").length).toBeGreaterThan(0);
  });
});

describe("elegir", () => {
  it("C23.3 · con un azar de 0 a 1 elige cualquier elemento de la lista, del primero al último", () => {
    const lista = ["a", "b", "c", "d"];
    expect(elegir(lista, 0)).toBe("a");
    expect(elegir(lista, 0.5)).toBe("c");
    expect(elegir(lista, 0.9999)).toBe("d");
  });

  it("C23.3 · con la lista vacía no elige nada", () => {
    expect(elegir([], 0.3)).toBeUndefined();
  });
});
