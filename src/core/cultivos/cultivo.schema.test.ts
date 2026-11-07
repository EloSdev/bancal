import { describe, expect, it } from "vitest";
import { cultivoSchema } from "./cultivo.schema";

// Datos de prueba con la forma de crops.json; no son el catálogo (T4).
const calendario = {
  siembra: { desde: 3, hasta: 5 },
  cosecha: { desde: 7, hasta: 9 },
};
const cultivoValido = {
  id: "tomate",
  nombre: "Tomate",
  familia: "Solanáceas",
  plantasPorCelda: 1,
  sol: "pleno-sol",
  riego: "alto",
  dificultad: "media",
  calendario: { atlantica: calendario, mediterranea: calendario, interior: calendario },
  compatibles: [{ cultivoId: "albahaca", motivo: "Motivo de prueba." }],
  incompatibles: [{ cultivoId: "hinojo", motivo: "Motivo de prueba." }],
  fuentes: ["fuente-de-prueba"],
  ciclo: { mesesHastaCosecha: 3, mesesDeCosecha: 3 },
};

const conCalendario = (atlantica: unknown) => ({
  ...cultivoValido,
  calendario: { ...cultivoValido.calendario, atlantica },
});

describe("cultivoSchema", () => {
  it("C3.3 · acepta un cultivo válido", () => {
    expect(cultivoSchema.safeParse(cultivoValido).success).toBe(true);
  });

  it("C3.3 · rechaza un cultivo sin calendario", () => {
    const { calendario: _sinCalendario, ...sinCalendario } = cultivoValido;
    expect(cultivoSchema.safeParse(sinCalendario).success).toBe(false);
  });

  it("C3.3 · rechaza un calendario al que le falta una zona climática", () => {
    const { interior: _sinInterior, ...dosZonas } = cultivoValido.calendario;
    expect(cultivoSchema.safeParse({ ...cultivoValido, calendario: dosZonas }).success).toBe(false);
  });

  it.each([0, 13, -1, 4.5])("C3.3 · rechaza el mes %s (fuera de 1–12 o no entero)", (mes) => {
    const siembraMala = conCalendario({ ...calendario, siembra: { desde: mes, hasta: 5 } });
    const cosechaMala = conCalendario({ ...calendario, cosecha: { desde: 7, hasta: mes } });
    expect(cultivoSchema.safeParse(siembraMala).success).toBe(false);
    expect(cultivoSchema.safeParse(cosechaMala).success).toBe(false);
  });

  it("acepta una ventana que cruza el año (de octubre a marzo)", () => {
    const invierno = conCalendario({ siembra: { desde: 10, hasta: 11 }, cosecha: { desde: 12, hasta: 3 } });
    expect(cultivoSchema.safeParse(invierno).success).toBe(true);
  });

  it("C4.7 · rechaza un cultivo sin ciclo", () => {
    const { ciclo: _sinCiclo, ...sinCiclo } = cultivoValido;
    expect(cultivoSchema.safeParse(sinCiclo).success).toBe(false);
  });

  it.each([
    [{ mesesHastaCosecha: 0, mesesDeCosecha: 2 }, "cero meses hasta la cosecha"],
    [{ mesesHastaCosecha: 2, mesesDeCosecha: 0 }, "cero meses de cosecha"],
    [{ mesesHastaCosecha: 1.5, mesesDeCosecha: 2 }, "meses no enteros"],
    [{ mesesHastaCosecha: 8, mesesDeCosecha: 5 }, "13 meses en total, más de un año"],
  ])("C4.7 · rechaza el ciclo %o (%s)", (ciclo) => {
    expect(cultivoSchema.safeParse({ ...cultivoValido, ciclo }).success).toBe(false);
  });

  it("C4.7 · acepta un ciclo que ocupa el año entero (12 meses)", () => {
    const ciclo = { mesesHastaCosecha: 4, mesesDeCosecha: 8 };
    expect(cultivoSchema.safeParse({ ...cultivoValido, ciclo }).success).toBe(true);
  });

  it("rechaza un cultivo sin fuentes", () => {
    expect(cultivoSchema.safeParse({ ...cultivoValido, fuentes: [] }).success).toBe(false);
  });

  it("rechaza una relación sin motivo", () => {
    const sinMotivo = { ...cultivoValido, incompatibles: [{ cultivoId: "hinojo", motivo: "" }] };
    expect(cultivoSchema.safeParse(sinMotivo).success).toBe(false);
  });
});
