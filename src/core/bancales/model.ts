// Modelo de los bancales del usuario (guía §3 y «Reglas del dominio» de CLAUDE.md).
// Bancal y Plantacion se guardan (localStorage, a través de la capa api);
// EstadoPlanta y Aviso se DERIVAN en cada render y nunca se guardan.
import type { Exposicion, Mes, ZonaClimatica } from "../cultivos/model";

export interface Bancal {
  id: string;
  nombre: string;
  /** Ancho y largo en cm (30–300). */
  ancho: number;
  largo: number;
  /** Horas de sol directo al día (0–24). */
  horasSol: number;
  zona: ZonaClimatica;
}

/** Lo que rellena el formulario de alta y edición: un bancal sin id. */
export type BancalInput = Omit<Bancal, "id">;

/** Posición en la cuadrícula, desde 0; la columna recorre el ancho. */
export interface Celda {
  fila: number;
  columna: number;
}

/** Un cultivo colocado en una celda (una sola plantación por celda). */
export interface Plantacion {
  cultivoId: string;
  celda: Celda;
  mesSiembra: Mes;
}

/** Estado de una plantación en un mes. Se deriva del ciclo del cultivo y de su mesSiembra. */
export type EstadoPlanta =
  | { tipo: "por-sembrar"; siembraEn: Mes }
  | { tipo: "sembrada" }
  | { tipo: "creciendo"; cosechaDesde: Mes }
  | { tipo: "cosecha"; cosechaHasta: Mes }
  /** Pasados los meses de cosecha del ciclo: la celda vuelve a estar libre (rastrojo). */
  | { tipo: "terminada" };

/** Recomendación con explicación; nunca bloquea. */
export type Aviso =
  | {
      tipo: "vecindad";
      /** Un aviso por pareja de celdas vecinas, no uno por cada lado. */
      celdas: [Celda, Celda];
      cultivoIds: [string, string];
      motivo: string;
    }
  | { tipo: "sol"; celda: Celda; cultivoId: string; necesita: Exposicion; tiene: Exposicion }
  | { tipo: "fuera-de-temporada"; celda: Celda; cultivoId: string; mesSiembra: Mes; zona: ZonaClimatica };
