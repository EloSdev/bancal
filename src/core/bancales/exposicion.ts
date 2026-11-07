// Exposición de un bancal según sus horas de sol («Reglas del dominio» de CLAUDE.md).
import type { Exposicion } from "../cultivos/model";

/** Pleno sol ≥ 6 h · semisombra 3 a < 6 h · sombra < 3 h (límites hacia arriba). */
export function exposicion(horasSol: number): Exposicion {
  if (horasSol >= 6) return "pleno-sol";
  if (horasSol >= 3) return "semisombra";
  return "sombra";
}
