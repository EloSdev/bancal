import { describe, expect, it } from "vitest";
import { bancalGuardadoSchema, bancalSchema, plantacionSchema } from "./bancal.schema";

// El bancal de la demo (guía §2): 120 × 90 cm, pleno sol, zona atlántica.
const bancalDemo = { nombre: "Bancal del balcón", ancho: 120, largo: 90, horasSol: 7, zona: "atlantica" };

const errores = (datos: unknown) => {
  const r = bancalSchema.safeParse(datos);
  return r.success ? [] : r.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
};

describe("bancalSchema", () => {
  it("C3.4 · acepta el bancal de la demo", () => {
    expect(bancalSchema.safeParse(bancalDemo).success).toBe(true);
  });

  it.each([
    ["ancho", 29, "El ancho mínimo es 30 cm (una celda)."],
    ["largo", 29, "El largo mínimo es 30 cm (una celda)."],
    ["ancho", 301, "El ancho máximo es 300 cm."],
    ["largo", 301, "El largo máximo es 300 cm."],
  ])("C3.4 · rechaza %s = %s cm con un mensaje en español", (campo, valor, mensaje) => {
    expect(errores({ ...bancalDemo, [campo]: valor })).toEqual([{ campo, mensaje }]);
  });

  it.each([30, 300])("C3.4 · acepta %s cm, el límite incluido", (cm) => {
    expect(bancalSchema.safeParse({ ...bancalDemo, ancho: cm, largo: cm }).success).toBe(true);
  });

  it.each([
    [-1, "Las horas de sol van de 0 a 24."],
    [24.5, "Las horas de sol van de 0 a 24."],
  ])("C3.4 · rechaza %s h de sol con un mensaje en español", (horasSol, mensaje) => {
    expect(errores({ ...bancalDemo, horasSol })).toEqual([{ campo: "horasSol", mensaje }]);
  });

  it.each([0, 2.9, 24])("C3.4 · acepta %s h de sol", (horasSol) => {
    expect(bancalSchema.safeParse({ ...bancalDemo, horasSol }).success).toBe(true);
  });

  it("C3.4 · un número vacío (NaN del input) da un mensaje en español, no el de Zod", () => {
    expect(errores({ ...bancalDemo, ancho: Number.NaN })).toEqual([
      { campo: "ancho", mensaje: "Indica el ancho en cm." },
    ]);
  });

  it("rechaza un nombre vacío y recorta los espacios", () => {
    expect(errores({ ...bancalDemo, nombre: "   " })).toEqual([
      { campo: "nombre", mensaje: "Ponle un nombre al bancal." },
    ]);
    expect(bancalSchema.parse({ ...bancalDemo, nombre: "  Balcón  " }).nombre).toBe("Balcón");
  });

  it("C3.4 · las medidas van en centímetros enteros", () => {
    expect(errores({ ...bancalDemo, ancho: 120.5 })).toEqual([
      { campo: "ancho", mensaje: "El ancho va en centímetros enteros." },
    ]);
    expect(errores({ ...bancalDemo, largo: 90.5 })).toEqual([
      { campo: "largo", mensaje: "El largo va en centímetros enteros." },
    ]);
  });

  it("el nombre admite 40 caracteres y no más", () => {
    expect(bancalSchema.safeParse({ ...bancalDemo, nombre: "a".repeat(40) }).success).toBe(true);
    expect(errores({ ...bancalDemo, nombre: "a".repeat(41) })).toEqual([
      { campo: "nombre", mensaje: "El nombre no puede pasar de 40 caracteres." },
    ]);
  });

  it("rechaza una zona climática desconocida", () => {
    expect(errores({ ...bancalDemo, zona: "tropical" })).toEqual([
      { campo: "zona", mensaje: "Elige una zona climática." },
    ]);
  });

  it("el bancal guardado exige su id", () => {
    expect(bancalGuardadoSchema.safeParse(bancalDemo).success).toBe(false);
    expect(bancalGuardadoSchema.safeParse({ ...bancalDemo, id: "b1" }).success).toBe(true);
  });
});

describe("plantacionSchema", () => {
  it("acepta un cultivo en una celda con su mes de siembra", () => {
    const tomate = { cultivoId: "tomate", celda: { fila: 0, columna: 1 }, mesSiembra: 4 };
    expect(plantacionSchema.safeParse(tomate).success).toBe(true);
  });

  it.each([
    { cultivoId: "tomate", celda: { fila: -1, columna: 0 }, mesSiembra: 4 },
    { cultivoId: "tomate", celda: { fila: 0, columna: 0 }, mesSiembra: 13 },
    { cultivoId: "", celda: { fila: 0, columna: 0 }, mesSiembra: 4 },
  ])("rechaza una plantación inválida: %o", (plantacion) => {
    expect(plantacionSchema.safeParse(plantacion).success).toBe(false);
  });
});
