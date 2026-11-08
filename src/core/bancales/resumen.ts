// Lo que la lista «Mis bancales» cuenta de cada bancal. Se deriva, no se guarda.
import type { Cultivo } from "../cultivos/model";
import type { BancalDetalle } from "./api";
import { avisosBancal } from "./avisos";
import { dimensiones } from "./cuadricula";

export interface ResumenBancal {
  columnas: number;
  filas: number;
  celdas: number;
  plantadas: number;
  /** Avisos pendientes (vecindad, sol y temporada). */
  avisos: number;
}

export function resumenBancal({ bancal, plantaciones }: BancalDetalle, cultivos: Cultivo[]): ResumenBancal {
  const { columnas, filas } = dimensiones(bancal.ancho, bancal.largo);
  return {
    columnas,
    filas,
    celdas: columnas * filas,
    plantadas: plantaciones.length,
    avisos: avisosBancal(bancal, plantaciones, cultivos).length,
  };
}
