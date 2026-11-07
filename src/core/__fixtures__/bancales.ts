// El bancal de la demo (guía §2): 120 × 90 cm → 4 × 3 celdas, pleno sol, zona atlántica.
import type { Bancal } from "../bancales/model";

export const bancalDemo: Bancal = {
  id: "demo",
  nombre: "Bancal de la demo",
  ancho: 120,
  largo: 90,
  horasSol: 8,
  zona: "atlantica",
};
