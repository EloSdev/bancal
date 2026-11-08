import { describe, expect, it } from "vitest";
import { bancalDemo } from "../__fixtures__/bancales";
import { cultivosDePrueba, hinojo } from "../__fixtures__/cultivos";
import type { Mes } from "../cultivos/model";
import { avisosBancal, diferenciaAvisos, resumenAviso, textoAviso } from "./avisos";
import type { Aviso, Bancal, Plantacion } from "./model";

const plantar = (cultivoId: string, fila: number, columna: number, mesSiembra: Mes = 5): Plantacion => ({
  cultivoId,
  celda: { fila, columna },
  mesSiembra,
});

const avisos = (plantaciones: Plantacion[], bancal: Bancal = bancalDemo) =>
  avisosBancal(bancal, plantaciones, cultivosDePrueba);

const deTipo = <T extends Aviso["tipo"]>(lista: Aviso[], tipo: T) =>
  lista.filter((a): a is Extract<Aviso, { tipo: T }> => a.tipo === tipo);

const MOTIVO_HINOJO_TOMATE = hinojo.incompatibles[0]!.motivo;

describe("avisosBancal · vecindad", () => {
  it("C6.2 · un tomate junto a un hinojo da un solo aviso para la pareja, no dos", () => {
    expect(avisos([plantar("tomate", 0, 0), plantar("hinojo", 0, 1)])).toEqual([
      {
        tipo: "vecindad",
        celdas: [
          { fila: 0, columna: 0 },
          { fila: 0, columna: 1 },
        ],
        cultivoIds: ["tomate", "hinojo"],
        motivo: MOTIVO_HINOJO_TOMATE,
      },
    ]);
  });

  it("C6.2 · el texto del aviso nombra los dos cultivos y explica el motivo", () => {
    const [aviso] = avisos([plantar("tomate", 0, 0), plantar("hinojo", 0, 1)]);
    const texto = textoAviso(aviso!, cultivosDePrueba);
    expect(texto).toMatch(/tomate/i);
    expect(texto).toMatch(/hinojo/i);
    expect(texto).toContain(MOTIVO_HINOJO_TOMATE);
  });

  it("C6.2 · un hinojo entre dos tomates da un aviso por cada pareja", () => {
    const lista = avisos([plantar("tomate", 0, 0), plantar("hinojo", 0, 1), plantar("tomate", 0, 2)]);
    expect(deTipo(lista, "vecindad").map((a) => a.celdas)).toEqual([
      [
        { fila: 0, columna: 0 },
        { fila: 0, columna: 1 },
      ],
      [
        { fila: 0, columna: 1 },
        { fila: 0, columna: 2 },
      ],
    ]);
  });

  it("las diagonales también son vecinas", () => {
    expect(deTipo(avisos([plantar("tomate", 0, 0), plantar("hinojo", 1, 1)]), "vecindad")).toHaveLength(1);
  });

  it("dos cultivos desfavorables que no se tocan no dan aviso", () => {
    expect(avisos([plantar("tomate", 0, 0), plantar("hinojo", 0, 2)])).toEqual([]);
  });

  it("vecinos favorables o neutros no dan aviso", () => {
    expect(
      avisos([plantar("tomate", 0, 0), plantar("albahaca", 0, 1), plantar("hinojo", 1, 2), plantar("albahaca", 1, 1)]),
    ).toEqual([]);
  });

  it("una plantación de un cultivo que no está en el catálogo se ignora", () => {
    expect(avisos([plantar("tomate", 0, 0), plantar("desconocido", 0, 1)])).toEqual([]);
  });
});

describe("avisosBancal · sol", () => {
  it("C6.3 · un tomate (pleno sol) en un bancal de 4 h (semisombra) da aviso de falta de sol", () => {
    const sombrio = { ...bancalDemo, horasSol: 4 };
    expect(avisos([plantar("tomate", 1, 1)], sombrio)).toEqual([
      { tipo: "sol", celda: { fila: 1, columna: 1 }, cultivoId: "tomate", necesita: "pleno-sol", tiene: "semisombra" },
    ]);
  });

  it("C6.3 · una lechuga (semisombra) en un bancal de 2 h (sombra) da aviso de falta de sol", () => {
    const umbrio = { ...bancalDemo, horasSol: 2 };
    expect(deTipo(avisos([plantar("lechuga", 0, 0, 1)], umbrio), "sol")).toEqual([
      { tipo: "sol", celda: { fila: 0, columna: 0 }, cultivoId: "lechuga", necesita: "semisombra", tiene: "sombra" },
    ]);
  });

  it("C6.3 · con exactamente 6 h el tomate tiene sol de sobra (límite hacia arriba)", () => {
    expect(avisos([plantar("tomate", 0, 0)], { ...bancalDemo, horasSol: 6 })).toEqual([]);
  });

  it("C6.3 · un cultivo que pide menos sol del que hay no da aviso", () => {
    expect(avisos([plantar("lechuga", 0, 0, 1)])).toEqual([]);
  });

  it("C6.3 · el texto nombra el cultivo, lo que necesita y lo que tiene el bancal", () => {
    const [aviso] = avisos([plantar("tomate", 1, 1)], { ...bancalDemo, horasSol: 4 });
    const texto = textoAviso(aviso!, cultivosDePrueba);
    expect(texto).toMatch(/tomate/i);
    expect(texto).toMatch(/pleno sol/);
    expect(texto).toMatch(/semisombra/);
  });
});

describe("avisosBancal · temporada", () => {
  it("C6.4 · un tomate sembrado en abril en zona atlántica (siembra en mayo) está fuera de temporada", () => {
    expect(avisos([plantar("tomate", 0, 0, 4)])).toEqual([
      { tipo: "fuera-de-temporada", celda: { fila: 0, columna: 0 }, cultivoId: "tomate", mesSiembra: 4, zona: "atlantica" },
    ]);
  });

  it("C6.4 · el mismo tomate en abril en zona mediterránea (siembra de abril a mayo) está en temporada", () => {
    expect(avisos([plantar("tomate", 0, 0, 4)], { ...bancalDemo, zona: "mediterranea" })).toEqual([]);
  });

  it("C6.4 · una ventana que cruza el año (octubre a febrero) acepta enero y rechaza junio", () => {
    expect(avisos([plantar("lechuga", 0, 0, 1)])).toEqual([]);
    expect(deTipo(avisos([plantar("lechuga", 0, 0, 6)]), "fuera-de-temporada")).toHaveLength(1);
  });

  it("C6.4 · el texto nombra el cultivo, el mes de siembra, la ventana y la zona", () => {
    const [aviso] = avisos([plantar("tomate", 0, 0, 4)]);
    const texto = textoAviso(aviso!, cultivosDePrueba);
    expect(texto).toMatch(/tomate/i);
    expect(texto).toMatch(/abril/);
    expect(texto).toMatch(/mayo/);
    expect(texto).toMatch(/atlántica/);
  });
});

describe("avisosBancal · escenario de la demo", () => {
  // 120 × 90 cm → 4 columnas × 3 filas, pleno sol, zona atlántica, todo sembrado en mayo.
  //   T A T T
  //   H A . .
  //   . . . .
  const huerto = [
    plantar("tomate", 0, 0),
    plantar("albahaca", 0, 1),
    plantar("tomate", 0, 2),
    plantar("tomate", 0, 3),
    plantar("albahaca", 1, 1),
  ];

  it("C6.5 · con el hinojo junto al tomate hay un único aviso: el del hinojo", () => {
    const lista = avisos([...huerto, plantar("hinojo", 1, 0)]);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ tipo: "vecindad", cultivoIds: ["tomate", "hinojo"] });
  });

  it("C6.5 · tras mover el hinojo lejos de los tomates hay 0 avisos de vecindad", () => {
    const lista = avisos([...huerto, plantar("hinojo", 2, 3)]);
    expect(deTipo(lista, "vecindad")).toEqual([]);
    expect(lista).toEqual([]);
  });
});

describe("diferenciaAvisos", () => {
  const vecindad: Aviso = {
    tipo: "vecindad",
    celdas: [
      { fila: 0, columna: 0 },
      { fila: 0, columna: 1 },
    ],
    cultivoIds: ["tomate", "hinojo"],
    motivo: "m",
  };
  const sol: Aviso = { tipo: "sol", celda: { fila: 1, columna: 1 }, cultivoId: "tomate", necesita: "pleno-sol", tiene: "sombra" };

  it("C14.3 · dice qué avisos aparecen y cuáles se resuelven con un cambio", () => {
    expect(diferenciaAvisos([vecindad], [sol])).toEqual({ nuevos: [sol], resueltos: [vecindad] });
  });

  it("C14.3 · un aviso que sigue igual (aunque sea otro objeto) no es nuevo ni resuelto", () => {
    expect(diferenciaAvisos([vecindad], [{ ...vecindad, celdas: [...vecindad.celdas] }])).toEqual({ nuevos: [], resueltos: [] });
  });
});
describe("textoAviso · qué hacer", () => {
  const sol: Aviso = { tipo: "sol", celda: { fila: 0, columna: 0 }, cultivoId: "tomate", necesita: "pleno-sol", tiene: "semisombra" };
  const temporada: Aviso = { tipo: "fuera-de-temporada", celda: { fila: 0, columna: 0 }, cultivoId: "tomate", mesSiembra: 4, zona: "atlantica" };

  it("C14.2 · el de sol dice qué hacer (brief: el porqué y qué hacer)", () => {
    expect(textoAviso(sol, cultivosDePrueba)).toMatch(/Busca un sitio con más sol o elige un cultivo que aguante la semisombra\.$/);
  });

  it("C14.2 · el de temporada dice cuándo sembrarlo", () => {
    expect(textoAviso(temporada, cultivosDePrueba)).toMatch(/Espera a mayo para la siembra\.$/);
  });
});

describe("resumenAviso", () => {
  it.each([
    [{ tipo: "vecindad", celdas: [{ fila: 0, columna: 0 }, { fila: 0, columna: 1 }], cultivoIds: ["tomate", "hinojo"], motivo: "m" }, "tomate junto a hinojo"],
    [{ tipo: "sol", celda: { fila: 0, columna: 0 }, cultivoId: "tomate", necesita: "pleno-sol", tiene: "sombra" }, "tomate: le falta sol"],
    [{ tipo: "fuera-de-temporada", celda: { fila: 0, columna: 0 }, cultivoId: "hinojo", mesSiembra: 1, zona: "atlantica" }, "hinojo: fuera de temporada"],
  ] as const)("C14.3 · un resumen corto, sin el motivo, para anunciarlo: %o → «%s»", (aviso, esperado) => {
    expect(resumenAviso(aviso as Aviso, cultivosDePrueba)).toBe(esperado);
  });
});