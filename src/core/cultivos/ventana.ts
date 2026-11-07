// Ventanas de meses del calendario de siembra y cosecha.
import type { Mes, Ventana } from "./model";

/** ¿Cae el mes dentro de la ventana? Ambos extremos incluidos; puede cruzar el año. */
export function enVentana(mes: Mes, { desde, hasta }: Ventana): boolean {
  return desde <= hasta ? mes >= desde && mes <= hasta : mes >= desde || mes <= hasta;
}
