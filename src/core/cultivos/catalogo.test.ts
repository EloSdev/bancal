import { describe, expect, it } from "vitest";
import catalogoJson from "../../../public/crops.json";
import readme from "../../../README.md?raw";
import { cultivoSchema } from "./cultivo.schema";
import type { Cultivo } from "./model";

// Tests de coherencia del CATÁLOGO real: la única excepción a «los tests de
// lógica no leen public/crops.json» (skill tdd-core §4). Existen para leerlo.
// Se importan con Vite (JSON y ?raw) para no depender de los tipos de Node.
const crudo: unknown = catalogoJson;
const catalogo = Array.isArray(crudo) ? (crudo as unknown[]) : [];
// Los que no pasan el esquema los señala C4.1; el resto de tests mira los válidos.
const cultivos: Cultivo[] = catalogo.flatMap((c) => {
  const r = cultivoSchema.safeParse(c);
  return r.success ? [r.data] : [];
});
const porId = new Map(cultivos.map((c) => [c.id, c]));

const ids = (relaciones: Cultivo["compatibles"]) => relaciones.map((r) => r.cultivoId);

describe("catálogo (public/crops.json)", () => {
  it("C4.1 · tiene entre 20 y 30 cultivos y todos pasan el esquema", () => {
    expect(Array.isArray(crudo)).toBe(true);
    expect(catalogo.length).toBeGreaterThanOrEqual(20);
    expect(catalogo.length).toBeLessThanOrEqual(30);
    const invalidos = catalogo.flatMap((c) => {
      const r = cultivoSchema.safeParse(c);
      const id = (c as { id?: string }).id;
      return r.success ? [] : r.error.issues.map((i) => `${id}: ${i.path.join(".")} ${i.message}`);
    });
    expect(invalidos).toEqual([]);
  });

  it("los ids no se repiten", () => {
    expect(porId.size).toBe(cultivos.length);
  });

  it("C4.2 · toda relación apunta a un cultivo que existe y no a sí mismo", () => {
    const rotas = cultivos.flatMap((c) =>
      [...ids(c.compatibles), ...ids(c.incompatibles)]
        .filter((otro) => !porId.has(otro) || otro === c.id)
        .map((otro) => `${c.id} → ${otro}`),
    );
    expect(rotas).toEqual([]);
  });

  it("C4.2 · ningún cultivo es a la vez compatible e incompatible con otro", () => {
    const contradicciones = cultivos.flatMap((c) =>
      ids(c.compatibles).filter((otro) => ids(c.incompatibles).includes(otro)).map((otro) => `${c.id} ↔ ${otro}`),
    );
    expect(contradicciones).toEqual([]);
  });

  it("C4.2 · un cultivo no repite la misma relación", () => {
    const repetidas = cultivos.flatMap((c) =>
      [ids(c.compatibles), ids(c.incompatibles)].flatMap((lista) =>
        lista.filter((otro, i) => lista.indexOf(otro) !== i).map((otro) => `${c.id} → ${otro}`),
      ),
    );
    expect(repetidas).toEqual([]);
  });

  it.each(["compatibles", "incompatibles"] as const)("C4.3 · las relaciones %s son simétricas", (tipo) => {
    const asimetricas = cultivos.flatMap((c) =>
      ids(c[tipo])
        .filter((otro) => !ids(porId.get(otro)?.[tipo] ?? []).includes(c.id))
        .map((otro) => `${c.id} → ${otro} sin vuelta`),
    );
    expect(asimetricas).toEqual([]);
  });

  it("C4.4 · están los cultivos de la demo con tomate–albahaca favorable y tomate–hinojo desfavorable", () => {
    const tomate = porId.get("tomate");
    expect(porId.has("albahaca")).toBe(true);
    expect(porId.has("hinojo")).toBe(true);
    expect(ids(tomate?.compatibles ?? [])).toContain("albahaca");
    expect(ids(tomate?.incompatibles ?? [])).toContain("hinojo");
  });

  it("C4.5 · cada fuente citada está en la sección de fuentes del README", () => {
    // Solo la tabla de fuentes: un id que apareciera únicamente en «Datos derivados» no cuenta.
    const fuentesReadme = (readme.split(/^## Fuentes de los datos/m)[1] ?? "").split(/^### /m)[0] ?? "";
    const citadas = new Set(cultivos.flatMap((c) => c.fuentes));
    const sinListar = [...citadas].filter((id) => !fuentesReadme.includes(`\`${id}\``));
    expect(citadas.size).toBeGreaterThan(0);
    expect(sinListar).toEqual([]);
  });
});
