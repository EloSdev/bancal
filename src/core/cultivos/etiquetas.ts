// Cómo se dicen en español los valores del dominio (un dato se dice siempre igual).
import type { Dificultad, Exposicion, Mes, Ventana, ZonaClimatica } from "./model";

export const MESES: readonly string[] = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const nombreMes = (mes: Mes): string => MESES[mes - 1] ?? `mes ${mes}`;

/** «en mayo» o «de marzo a mayo». */
export const ventanaEnTexto = ({ desde, hasta }: Ventana): string =>
  desde === hasta ? `en ${nombreMes(desde)}` : `de ${nombreMes(desde)} a ${nombreMes(hasta)}`;

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

export const etiquetaDificultad: Record<Dificultad, string> = {
  facil: "Fácil",
  media: "Media",
  dificil: "Difícil",
};
