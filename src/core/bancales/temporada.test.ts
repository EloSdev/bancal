import { describe, expect, it } from "vitest";
import { ajo, albahaca, cultivosDePrueba, hinojo, lechuga, tomate } from "../__fixtures__/cultivos";
import type { Ciclo, Cultivo, Mes, ZonaClimatica } from "../cultivos/model";
import type { EstadoPlanta, Plantacion } from "./model";
import { estadoPlanta, mesSiembraPorDefecto, tareasDelMes } from "./temporada";

const plantar = (cultivoId: string, mesSiembra: Mes, fila = 0, columna = 0): Plantacion => ({
  cultivoId,
  celda: { fila, columna },
  mesSiembra,
});

const MESES: Mes[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** El estado de la plantación en cada mes del año, de enero a diciembre. */
const año = (plantacion: Plantacion, cultivo: Cultivo, zona: ZonaClimatica = "atlantica") =>
  MESES.map((mes) => estadoPlanta(plantacion, cultivo, zona, mes));

/** El mismo cultivo con un ciclo inventado en todas las zonas. */
const conCiclo = (cultivo: Cultivo, ciclo: Ciclo): Cultivo => ({
  ...cultivo,
  calendario: {
    atlantica: { ...cultivo.calendario.atlantica, ciclo },
    mediterranea: { ...cultivo.calendario.mediterranea, ciclo },
    interior: { ...cultivo.calendario.interior, ciclo },
  },
});

const tipos = (estados: EstadoPlanta[]) => estados.map((e) => e.tipo);

describe("estadoPlanta", () => {
  it("C7.1 · un tomate sembrado en mayo (ciclo 2 + 2) recorre todo el año: por sembrar → sembrada → creciendo → cosecha → terminada", () => {
    expect(tipos(año(plantar("tomate", 5), tomate))).toEqual([
      "por-sembrar", "por-sembrar", "por-sembrar", "por-sembrar", // enero–abril
      "sembrada", // mayo
      "creciendo", // junio
      "cosecha", "cosecha", // julio–agosto
      "terminada", "terminada", "terminada", "terminada", // septiembre–diciembre
    ]);
  });

  it("C7.1 · cada estado lleva su mes de referencia", () => {
    const tomateMayo = plantar("tomate", 5);
    expect(estadoPlanta(tomateMayo, tomate, "atlantica", 3)).toEqual({ tipo: "por-sembrar", siembraEn: 5 });
    expect(estadoPlanta(tomateMayo, tomate, "atlantica", 5)).toEqual({ tipo: "sembrada" });
    expect(estadoPlanta(tomateMayo, tomate, "atlantica", 6)).toEqual({ tipo: "creciendo", cosechaDesde: 7 });
    expect(estadoPlanta(tomateMayo, tomate, "atlantica", 7)).toEqual({ tipo: "cosecha", cosechaHasta: 8 });
    expect(estadoPlanta(tomateMayo, tomate, "atlantica", 9)).toEqual({ tipo: "terminada" });
  });

  it("C7.1 · el ciclo se cuenta desde el mes de siembra de la plantación, no desde la ventana", () => {
    // Mismo tomate sembrado en junio: todo se desplaza un mes.
    expect(tipos(año(plantar("tomate", 6), tomate)).slice(4, 10)).toEqual([
      "por-sembrar", "sembrada", "creciendo", "cosecha", "cosecha", "terminada",
    ]);
  });

  it("C7.1 · con un solo mes hasta la cosecha no hay mes de «creciendo»", () => {
    const rapido = conCiclo(tomate, { mesesHastaCosecha: 1, mesesDeCosecha: 1 });
    expect(tipos(año(plantar("tomate", 5), rapido)).slice(3, 8)).toEqual([
      "por-sembrar", "sembrada", "cosecha", "terminada", "terminada",
    ]);
  });

  it("C7.2 · un ajo sembrado en octubre y cosechado en marzo está creciendo en enero (el año se repite)", () => {
    const ajoOctubre = plantar("ajo", 10);
    expect(estadoPlanta(ajoOctubre, ajo, "atlantica", 1)).toEqual({ tipo: "creciendo", cosechaDesde: 3 });
    expect(estadoPlanta(ajoOctubre, ajo, "atlantica", 3)).toEqual({ tipo: "cosecha", cosechaHasta: 4 });
  });

  it("C7.2 · el año entero del ajo de octubre: el ciclo sigue en enero y los meses libres son «por sembrar»", () => {
    expect(tipos(año(plantar("ajo", 10), ajo))).toEqual([
      "creciendo", "creciendo", // enero–febrero
      "cosecha", "cosecha", // marzo–abril
      "por-sembrar", "por-sembrar", "por-sembrar", "por-sembrar", "por-sembrar", // mayo–septiembre
      "sembrada", // octubre
      "creciendo", "creciendo", // noviembre–diciembre
    ]);
  });

  it("C7.2 · una cosecha que cruza el año informa del mes final con la vuelta dada", () => {
    // Ajo sembrado en diciembre: cosecha de mayo a junio.
    expect(estadoPlanta(plantar("ajo", 12), ajo, "atlantica", 2)).toEqual({ tipo: "creciendo", cosechaDesde: 5 });
    // Tomate sembrado en noviembre: cosecha de enero a febrero.
    expect(estadoPlanta(plantar("tomate", 11), tomate, "atlantica", 12)).toEqual({ tipo: "creciendo", cosechaDesde: 1 });
    expect(estadoPlanta(plantar("tomate", 11), tomate, "atlantica", 1)).toEqual({ tipo: "cosecha", cosechaHasta: 2 });
  });

  it("un ciclo de 12 meses ocupa todo el año: ni por sembrar ni terminada", () => {
    const anual = conCiclo(tomate, { mesesHastaCosecha: 6, mesesDeCosecha: 6 });
    const vistos = new Set(tipos(año(plantar("tomate", 5), anual)));
    expect(vistos).toEqual(new Set(["sembrada", "creciendo", "cosecha"]));
  });

  it("C18.5 · el mismo ajo sembrado en octubre avanza distinto según la zona: usa el ciclo de la zona del bancal", () => {
    const ajoOctubre = plantar("ajo", 10);
    // Atlántica 5 + 2: cosecha marzo–abril. Interior 7 + 1: sigue creciendo en marzo y se cosecha en mayo.
    expect(estadoPlanta(ajoOctubre, ajo, "atlantica", 3)).toEqual({ tipo: "cosecha", cosechaHasta: 4 });
    expect(estadoPlanta(ajoOctubre, ajo, "interior", 3)).toEqual({ tipo: "creciendo", cosechaDesde: 5 });
    expect(estadoPlanta(ajoOctubre, ajo, "interior", 5)).toEqual({ tipo: "cosecha", cosechaHasta: 5 });
    expect(tipos(año(ajoOctubre, ajo, "interior"))).toEqual([
      "creciendo", "creciendo", "creciendo", "creciendo", // enero–abril
      "cosecha", // mayo
      "por-sembrar", "por-sembrar", "por-sembrar", "por-sembrar", // junio–septiembre
      "sembrada", // octubre
      "creciendo", "creciendo", // noviembre–diciembre
    ]);
  });
});

describe("tareasDelMes por zona", () => {
  it("C18.5 · en marzo se cosecha el ajo en un bancal atlántico, pero no en uno de interior", () => {
    const huerto = [plantar("ajo", 10)];
    expect(tareasDelMes(huerto, cultivosDePrueba, "atlantica", 3)).toEqual({ sembrar: [], cosechar: ["ajo"] });
    expect(tareasDelMes(huerto, cultivosDePrueba, "interior", 3)).toEqual({ sembrar: [], cosechar: [] });
    expect(tareasDelMes(huerto, cultivosDePrueba, "interior", 5)).toEqual({ sembrar: [], cosechar: ["ajo"] });
  });
});

describe("mesSiembraPorDefecto", () => {
  it.each([
    { cultivo: tomate, zona: "atlantica", esperado: 5 },
    { cultivo: tomate, zona: "mediterranea", esperado: 4 },
    { cultivo: hinojo, zona: "interior", esperado: 5 },
    { cultivo: lechuga, zona: "atlantica", esperado: 10 },
  ] as const)("C7.3 · $cultivo.id en zona $zona → mes $esperado (el primero de su ventana)", ({ cultivo, zona, esperado }) => {
    expect(mesSiembraPorDefecto(cultivo, zona)).toBe(esperado);
  });
});

describe("tareasDelMes", () => {
  const huerto = [
    plantar("tomate", 5, 0, 0),
    plantar("tomate", 5, 0, 2),
    plantar("albahaca", 5, 0, 1),
    plantar("tomate", 6, 0, 3),
    plantar("ajo", 10, 2, 0),
  ];

  const tareas = (mes: Mes) => tareasDelMes(huerto, cultivosDePrueba, "atlantica", mes);

  it("C7.4 · en mayo toca sembrar tomate y albahaca, cada uno una sola vez", () => {
    expect(tareas(5)).toEqual({ sembrar: ["tomate", "albahaca"], cosechar: [] });
  });

  it("C7.4 · en julio se cosecha el tomate una sola vez aunque haya dos tomateras en cosecha", () => {
    // Albahaca de mayo (2 + 3): cosecha de julio a septiembre.
    expect(tareas(7)).toEqual({ sembrar: [], cosechar: ["tomate", "albahaca"] });
  });

  it("C7.4 · un mes puede tener a la vez siembras y cosechas", () => {
    // Tomate de mayo en cosecha en julio, mientras se siembra albahaca.
    const escalonado = [plantar("tomate", 5, 0, 0), plantar("albahaca", 7, 0, 1)];
    expect(tareasDelMes(escalonado, cultivosDePrueba, "atlantica", 7)).toEqual({ sembrar: ["albahaca"], cosechar: ["tomate"] });
  });

  it("C7.4 · a lo largo del año el huerto cambia de tareas", () => {
    // Junio: se siembra la tercera tomatera; nada se cosecha aún.
    expect(tareas(6)).toEqual({ sembrar: ["tomate"], cosechar: [] });
    // Septiembre: cosechan la albahaca de mayo y el tomate de junio (orden de aparición).
    expect(tareas(9)).toEqual({ sembrar: [], cosechar: ["albahaca", "tomate"] });
    // Marzo: se cosecha el ajo sembrado en octubre (el año se repite).
    expect(tareas(3)).toEqual({ sembrar: [], cosechar: ["ajo"] });
  });

  it("un mes sin nada que hacer devuelve las dos listas vacías", () => {
    expect(tareas(12)).toEqual({ sembrar: [], cosechar: [] });
  });

  it("las plantaciones de un cultivo que no está en el catálogo se ignoran", () => {
    expect(tareasDelMes([plantar("desconocido", 5)], cultivosDePrueba, "atlantica", 5)).toEqual({ sembrar: [], cosechar: [] });
  });

  it("un bancal vacío no tiene tareas", () => {
    expect(tareasDelMes([], [albahaca], "atlantica", 5)).toEqual({ sembrar: [], cosechar: [] });
  });
});
