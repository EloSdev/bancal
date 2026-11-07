import { describe, expect, it } from "vitest";
import { busquedaCatalogoSchema } from "./busqueda.schema";

const leer = (search: Record<string, unknown>) => busquedaCatalogoSchema.parse(search);

describe("busquedaCatalogoSchema", () => {
  it("C9.2 · acepta los cuatro filtros válidos", () => {
    expect(leer({ q: "tom", sol: "semisombra", temporada: 3, zona: "interior" })).toEqual({
      q: "tom",
      sol: "semisombra",
      temporada: 3,
      zona: "interior",
    });
  });

  it("C9.2 · sin parámetros no hay filtros", () => {
    expect(leer({})).toEqual({});
  });

  it("C9.3 · un valor inválido se ignora sin tirar los demás", () => {
    expect(leer({ q: "tom", sol: "xyz", temporada: 13, zona: "marte" })).toEqual({ q: "tom" });
  });

  it.each([0, 13, 2.5, "marzo"])("C9.3 · temporada=%s no es un mes y se ignora", (temporada) => {
    expect(leer({ temporada })).toEqual({});
  });

  it("C9.3 · una búsqueda que no es texto se ignora", () => {
    expect(leer({ q: 123 })).toEqual({});
  });
});
