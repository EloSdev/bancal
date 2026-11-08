// Las parejas del catálogo que se ayudan o se perjudican (T23: las notas de
// la portada). Usa la misma regla que el editor (relacionEntre): la relación
// es simétrica y, si figura de las dos formas, manda la desfavorable.
import { relacionEntre } from "./compatibilidad";
import type { Cultivo } from "./model";

export interface Pareja {
  a: Cultivo;
  b: Cultivo;
  motivo?: string;
}

/** Cada pareja una sola vez, en el orden del catálogo (a va antes que b). */
export function parejas(cultivos: readonly Cultivo[], tipo: "favorable" | "desfavorable"): Pareja[] {
  const resultado: Pareja[] = [];
  cultivos.forEach((a, i) => {
    for (const b of cultivos.slice(i + 1)) {
      const { compatibilidad, motivo } = relacionEntre(a, b);
      if (compatibilidad === tipo) resultado.push({ a, b, motivo });
    }
  });
  return resultado;
}

/** Un elemento de la lista según `azar` (de 0 a 1, sin llegar a 1: lo que da Math.random). */
export function elegir<T>(lista: readonly T[], azar: number): T | undefined {
  return lista[Math.floor(azar * lista.length)];
}
