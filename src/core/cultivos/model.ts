// Modelo del catálogo de cultivos (guía §3 y «Reglas del dominio» de CLAUDE.md).
// Solo tipos: los esquemas Zod que validan crops.json están en cultivo.schema.ts
// y comprueban en compilación que coinciden con estos tipos.

/** Mes del año, de 1 (enero) a 12 (diciembre). */
export type Mes = number;

export type ZonaClimatica = "atlantica" | "mediterranea" | "interior";

/** Pleno sol ≥ 6 h · semisombra 3 a < 6 h · sombra < 3 h (límites hacia arriba). */
export type Exposicion = "pleno-sol" | "semisombra" | "sombra";

export type Riego = "bajo" | "medio" | "alto";

export type Dificultad = "facil" | "media" | "dificil";

/** Compatibilidad entre dos vecinos; simétrica. */
export type Compatibilidad = "favorable" | "desfavorable" | "neutra";

/**
 * Ventana de meses, ambos incluidos. Puede cruzar el año: { desde: 10, hasta: 3 }
 * es de octubre a marzo.
 */
export interface Ventana {
  desde: Mes;
  hasta: Mes;
}

export interface CalendarioZona {
  siembra: Ventana;
  cosecha: Ventana;
}

/** Relación con otro cultivo del catálogo, con el porqué (lo explica el aviso). */
export interface Relacion {
  cultivoId: string;
  motivo: string;
}

export interface Cultivo {
  /** Identificador legible y estable: "tomate", "albahaca". */
  id: string;
  nombre: string;
  familia: string;
  /** Cuántas plantas caben en una celda de 30 × 30 cm. */
  plantasPorCelda: number;
  sol: Exposicion;
  riego: Riego;
  dificultad: Dificultad;
  /** Un calendario por cada zona climática. */
  calendario: Record<ZonaClimatica, CalendarioZona>;
  compatibles: Relacion[];
  incompatibles: Relacion[];
  /** Fuentes de horticultura que respaldan los datos (se listan en el README). */
  fuentes: string[];
}
