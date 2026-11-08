// Hooks de datos de los bancales.
import { useCarga, type Carga } from "../comun/hooks";
import { getBancal, getBancales, getBancalesDetalle, type BancalDetalle } from "./api";
import type { Bancal } from "./model";

export function useBancales(): Carga<Bancal[]> {
  return useCarga((_clave, signal) => getBancales(signal), "bancales");
}

/** Todos los bancales con sus plantaciones (la lista cuenta plantas y avisos). */
export function useBancalesDetalle(): Carga<BancalDetalle[]> {
  return useCarga((_clave, signal) => getBancalesDetalle(signal), "bancales-detalle");
}

/** Cargado, sin error y con data = null: ese bancal no existe. */
export function useBancal(id: string): Carga<BancalDetalle | null> {
  return useCarga(async (bancalId, signal) => (await getBancal(bancalId, signal)) ?? null, id);
}
