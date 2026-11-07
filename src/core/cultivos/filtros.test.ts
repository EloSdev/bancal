import { describe, expect, it } from "vitest";
import { cultivosDePrueba } from "../__fixtures__/cultivos";
import { filtrarCultivos, hayFiltros, ordenarPorNombre } from "./filtros";
import type { Cultivo } from "./model";

const ids = (filtros: Parameters<typeof filtrarCultivos>[1]) => filtrarCultivos(cultivosDePrueba, filtros).map((c) => c.id);

describe("filtrarCultivos", () => {
  it("C9.2 · sin filtros devuelve todo el catálogo, en su orden", () => {
    expect(ids({})).toEqual(["tomate", "albahaca", "hinojo", "lechuga", "ajo"]);
  });

  it("C9.2 · la búsqueda encuentra por parte del nombre, sin mirar mayúsculas", () => {
    expect(ids({ q: "TOMA" })).toEqual(["tomate"]);
    expect(ids({ q: "ha" })).toEqual(["albahaca"]);
  });

  it("C9.2 · la búsqueda ignora las tildes y los espacios de los lados", () => {
    expect(ids({ q: "  ajó " })).toEqual(["ajo"]);
  });

  it("C9.2 · una búsqueda vacía no filtra", () => {
    expect(ids({ q: "   " })).toHaveLength(5);
  });

  it("C9.2 · el filtro de sol deja los cultivos que necesitan exactamente esa exposición", () => {
    expect(ids({ sol: "semisombra" })).toEqual(["lechuga"]);
    expect(ids({ sol: "sombra" })).toEqual([]);
  });

  it("C9.2 · la temporada deja lo que se siembra ese mes en la zona elegida", () => {
    expect(ids({ temporada: 5, zona: "atlantica" })).toEqual(["tomate", "albahaca", "hinojo"]);
    expect(ids({ temporada: 4, zona: "atlantica" })).toEqual([]);
    expect(ids({ temporada: 4, zona: "mediterranea" })).toEqual(["tomate"]);
  });

  it("C9.2 · sin zona, la temporada usa la atlántica", () => {
    expect(ids({ temporada: 4 })).toEqual([]);
    expect(ids({ temporada: 5 })).toEqual(["tomate", "albahaca", "hinojo"]);
  });

  it("C9.2 · la temporada entiende ventanas que cruzan el año", () => {
    expect(ids({ temporada: 1 })).toEqual(["lechuga"]);
    expect(ids({ temporada: 11 })).toEqual(["lechuga", "ajo"]);
  });

  it("C9.2 · los filtros se combinan", () => {
    expect(ids({ temporada: 5, q: "a" })).toEqual(["tomate", "albahaca"]);
    expect(ids({ temporada: 11, sol: "pleno-sol" })).toEqual(["ajo"]);
  });

  it("C9.2 · la zona sola no filtra: solo dice qué calendario usar", () => {
    expect(ids({ zona: "interior" })).toHaveLength(5);
  });
});

describe("hayFiltros", () => {
  it("C9.2 · dice si hay algún filtro que reduzca la lista (la zona sola no cuenta)", () => {
    expect(hayFiltros({})).toBe(false);
    expect(hayFiltros({ q: "  ", zona: "interior" })).toBe(false);
    expect(hayFiltros({ q: "tom" })).toBe(true);
    expect(hayFiltros({ sol: "sombra" })).toBe(true);
    expect(hayFiltros({ temporada: 3 })).toBe(true);
  });
});

describe("ordenarPorNombre", () => {
  const llamado = (nombre: string) => ({ ...cultivosDePrueba[0]!, id: nombre, nombre }) as Cultivo;

  it("C9.1 · ordena alfabéticamente en español: la Á va con la A y la Ñ tras la N", () => {
    const desordenados = ["Tomate", "Ñora", "Ajo", "Nabo", "Ápio", "albahaca"].map(llamado);
    expect(ordenarPorNombre(desordenados).map((c) => c.nombre)).toEqual(["Ajo", "albahaca", "Ápio", "Nabo", "Ñora", "Tomate"]);
  });

  it("no cambia la lista que recibe", () => {
    const lista = ["Tomate", "Ajo"].map(llamado);
    ordenarPorNombre(lista);
    expect(lista.map((c) => c.nombre)).toEqual(["Tomate", "Ajo"]);
  });
});