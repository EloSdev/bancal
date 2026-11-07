import { describe, expect, it } from "vitest";
import { albahaca, hinojo, lechuga, tomate } from "../__fixtures__/cultivos";
import type { Cultivo } from "./model";
import { compatibilidad } from "./compatibilidad";

describe("compatibilidad", () => {
  it.each([
    { a: tomate, b: albahaca, esperada: "favorable" },
    { a: tomate, b: hinojo, esperada: "desfavorable" },
    { a: albahaca, b: hinojo, esperada: "neutra" },
    { a: lechuga, b: tomate, esperada: "neutra" },
  ] as const)("C6.1 · $a.id y $b.id → $esperada", ({ a, b, esperada }) => {
    expect(compatibilidad(a, b)).toBe(esperada);
  });

  it.each([
    { a: tomate, b: albahaca },
    { a: tomate, b: hinojo },
    { a: albahaca, b: hinojo },
  ])("C6.1 · es simétrica: $b.id y $a.id da lo mismo que al revés", ({ a, b }) => {
    expect(compatibilidad(b, a)).toBe(compatibilidad(a, b));
  });

  it("C6.1 · basta con que la relación esté en uno de los dos cultivos", () => {
    const hinojoSinRelaciones: Cultivo = { ...hinojo, incompatibles: [] };
    const albahacaSinRelaciones: Cultivo = { ...albahaca, compatibles: [] };
    expect(compatibilidad(hinojoSinRelaciones, tomate)).toBe("desfavorable");
    expect(compatibilidad(tomate, hinojoSinRelaciones)).toBe("desfavorable");
    expect(compatibilidad(albahacaSinRelaciones, tomate)).toBe("favorable");
    expect(compatibilidad(tomate, albahacaSinRelaciones)).toBe("favorable");
  });
});
