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

  it("rechaza un cultivo sin fuentes", () => {
    expect(cultivoSchema.safeParse({ ...cultivoValido, fuentes: [] }).success).toBe(false);
  });

  it("rechaza una relación sin motivo", () => {
    const sinMotivo = { ...cultivoValido, incompatibles: [{ cultivoId: "hinojo", motivo: "" }] };
    expect(cultivoSchema.safeParse(sinMotivo).success).toBe(false);
  });
});
