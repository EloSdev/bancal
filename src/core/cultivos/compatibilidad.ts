// Compatibilidad entre dos cultivos vecinos («Reglas del dominio» de CLAUDE.md).
// Es simétrica: basta con que la relación figure en uno de los dos cultivos.
import type { Compatibilidad, Cultivo, Relacion } from "./model";

export interface RelacionEntre {
  compatibilidad: Compatibilidad;
  /** El porqué, tal como lo guarda el catálogo; no hay motivo si es neutra. */
  motivo?: string;
}

function buscar(lista: (c: Cultivo) => Relacion[], a: Cultivo, b: Cultivo): Relacion | undefined {
  return lista(a).find((r) => r.cultivoId === b.id) ?? lista(b).find((r) => r.cultivoId === a.id);
}

export function relacionEntre(a: Cultivo, b: Cultivo): RelacionEntre {
  const mala = buscar((c) => c.incompatibles, a, b);
  if (mala) return { compatibilidad: "desfavorable", motivo: mala.motivo };
  const buena = buscar((c) => c.compatibles, a, b);
  if (buena) return { compatibilidad: "favorable", motivo: buena.motivo };
  return { compatibilidad: "neutra" };
}

export function compatibilidad(a: Cultivo, b: Cultivo): Compatibilidad {
  return relacionEntre(a, b).compatibilidad;
}
