// El consejo de cada mes para la nota de la portada (T24): genérico, sin
// zona. Los cultivos que nombra se siembran o se cosechan ese mes en las tres
// zonas del catálogo (lo comprueba notas-del-mes.test.ts contra crops.json).
// Mejora futura (README): con registro, la nota según la zona del usuario.
import type { Mes } from "../../core/cultivos/model";

export interface NotaDelMes {
  texto: string;
  /** El dibujo de la nota: un cultivo del consejo. */
  icono: string;
  /** Lo que el consejo manda sembrar ese mes (ids del catálogo). */
  siembra: string[];
  /** Lo que el consejo dice que se cosecha ese mes. */
  cosecha: string[];
}

export const NOTAS_DEL_MES: Record<Mes, NotaDelMes> = {
  1: { texto: "Siembra los ajos y prepara la tierra para la primavera", icono: "ajo", siembra: ["ajo"], cosecha: [] },
  2: { texto: "Siembra el cebollino y abona el bancal antes de la primavera", icono: "cebollino", siembra: ["cebollino"], cosecha: [] },
  3: { texto: "Arrancan las siembras: lechuga, rúcula y caléndula", icono: "lechuga", siembra: ["lechuga", "rucula", "calendula"], cosecha: [] },
  4: { texto: "Ya es primavera: siembra pimientos, perejil y cilantro", icono: "pimiento", siembra: ["pimiento", "perejil", "cilantro"], cosecha: [] },
  5: { texto: "Es el mes del tomate: siémbralo con la albahaca al lado", icono: "tomate", siembra: ["tomate", "albahaca"], cosecha: [] },
  6: { texto: "Cosecha lechugas y fresas, y riega a menudo", icono: "fresa", siembra: [], cosecha: ["lechuga", "fresa"] },
  7: { texto: "Llegan los primeros tomates: riega temprano o al atardecer", icono: "tomate", siembra: [], cosecha: ["tomate"] },
  8: { texto: "Cosecha tomates, pimientos y berenjenas en su punto", icono: "pimiento", siembra: [], cosecha: ["tomate", "pimiento", "berenjena"] },
  9: { texto: "Siembra remolacha y aprovecha las últimas judías verdes", icono: "remolacha", siembra: ["remolacha"], cosecha: ["judia-verde"] },
  10: { texto: "Limpia lo que ya terminó y siembra remolacha", icono: "remolacha", siembra: ["remolacha"], cosecha: [] },
  11: { texto: "Toca sembrar habas y guisantes", icono: "haba", siembra: ["haba", "guisante"], cosecha: [] },
  12: { texto: "Siembra los ajos y protege el bancal de las heladas", icono: "ajo", siembra: ["ajo"], cosecha: [] },
};
