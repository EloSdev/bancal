// Cómo se dicen en español los valores del dominio (un dato se dice siempre igual).
import type { Dificultad, Exposicion, Mes, Riego, Ventana, ZonaClimatica } from "./model";

export const MESES: readonly string[] = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const nombreMes = (mes: Mes): string => MESES[mes - 1] ?? `mes ${mes}`;

/** «en mayo» o «de marzo a mayo». */
export const ventanaEnTexto = ({ desde, hasta }: Ventana): string =>
  desde === hasta ? `en ${nombreMes(desde)}` : `de ${nombreMes(desde)} a ${nombreMes(hasta)}`;

/**
 * El nombre para una celda pequeña del editor (unas 6 letras a 10 px), como
 * se apunta en un cuaderno: la primera palabra si es corta («Judía»), y si
 * no, sus 5 primeras letras con punto («Remol.»). Nunca cortado a mitad sin
 * avisar; el nombre entero va en el nombre accesible de la celda.
 */
export function nombreCorto(nombre: string): string {
  const primera = nombre.split(" ")[0] ?? nombre;
  return primera.length <= 7 ? primera : `${primera.slice(0, 5)}.`;
}

export const etiquetaExposicion: Record<Exposicion, string> = {
  "pleno-sol": "Pleno sol",
  semisombra: "Semisombra",
  sombra: "Sombra",
};

export const etiquetaZona: Record<ZonaClimatica, string> = {
  atlantica: "Atlántica",
  mediterranea: "Mediterránea",
  interior: "Interior",
};

export const etiquetaRiego: Record<Riego, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

export const etiquetaDificultad: Record<Dificultad, string> = {
  facil: "Fácil",
  media: "Media",
  dificil: "Difícil",
};
