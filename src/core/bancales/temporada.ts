// Temporada: estado de cada plantación mes a mes y tareas del mes
// («Reglas del dominio» de CLAUDE.md). Todo se deriva; nada se guarda.
import type { Cultivo, Mes, ZonaClimatica } from "../cultivos/model";
import type { EstadoPlanta, Plantacion } from "./model";

/** Suma meses dando la vuelta al año: mes(11 + 3) → 2. */
const sumarMeses = (mes: Mes, meses: number): Mes => ((mes - 1 + meses) % 12) + 1;

/**
 * El bancal muestra un año tipo que se repite: el ciclo se cuenta desde el
 * `mesSiembra` de la plantación y, si pasa de diciembre, sigue en enero. Los
 * meses que el ciclo no ocupa son «por sembrar» antes del mes de siembra y
 * «terminada» después.
 */
export function estadoPlanta(plantacion: Plantacion, cultivo: Cultivo, mes: Mes): EstadoPlanta {
  const { mesSiembra } = plantacion;
  const { mesesHastaCosecha, mesesDeCosecha } = cultivo.ciclo;
  const desdeSiembra = (mes - mesSiembra + 12) % 12;

  if (desdeSiembra === 0) return { tipo: "sembrada" };
  if (desdeSiembra < mesesHastaCosecha) {
    return { tipo: "creciendo", cosechaDesde: sumarMeses(mesSiembra, mesesHastaCosecha) };
  }
  if (desdeSiembra < mesesHastaCosecha + mesesDeCosecha) {
    return { tipo: "cosecha", cosechaHasta: sumarMeses(mesSiembra, mesesHastaCosecha + mesesDeCosecha - 1) };
  }
  return mes < mesSiembra ? { tipo: "por-sembrar", siembraEn: mesSiembra } : { tipo: "terminada" };
}

/** El primer mes válido de la ventana de siembra de la zona. */
export function mesSiembraPorDefecto(cultivo: Cultivo, zona: ZonaClimatica): Mes {
  return cultivo.calendario[zona].siembra.desde;
}

export interface TareasDelMes {
  /** Ids de los cultivos que se siembran este mes, cada uno una vez. */
  sembrar: string[];
  /** Ids de los cultivos en cosecha este mes, cada uno una vez. */
  cosechar: string[];
}

/** Qué sembrar y qué cosechar en un bancal ese mes, sin repetir cultivos. */
export function tareasDelMes(plantaciones: Plantacion[], cultivos: Cultivo[], mes: Mes): TareasDelMes {
  const porId = new Map(cultivos.map((c) => [c.id, c]));
  const sembrar = new Set<string>();
  const cosechar = new Set<string>();
  for (const plantacion of plantaciones) {
    const cultivo = porId.get(plantacion.cultivoId);
    if (!cultivo) continue;
    const { tipo } = estadoPlanta(plantacion, cultivo, mes);
    if (tipo === "sembrada") sembrar.add(cultivo.id);
    if (tipo === "cosecha") cosechar.add(cultivo.id);
  }
  return { sembrar: [...sembrar], cosechar: [...cosechar] };
}
