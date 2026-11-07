import { describe, expect, it } from "vitest";
import { exposicion } from "./exposicion";

describe("exposicion", () => {
  it.each([
    [6, "pleno-sol"],
    [3, "semisombra"],
    [2.9, "sombra"],
  ] as const)("C5.3 · %s h de sol → %s (límites hacia arriba)", (horas, esperada) => {
    expect(exposicion(horas)).toBe(esperada);
  });

  it.each([
    [0, "sombra"],
    [5.9, "semisombra"],
    [24, "pleno-sol"],
  ] as const)("%s h de sol → %s", (horas, esperada) => {
    expect(exposicion(horas)).toBe(esperada);
  });
});
