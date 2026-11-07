// Hooks de datos de los bancales.
import { useCarga, type Carga } from "../comun/hooks";
import { getBancal, getBancales, type BancalDetalle } from "./api";
import type { Bancal } from "./model";

export function useBancales(): Carga<Bancal[]> {
  return useCarga((_clave, signal) => getBancales(signal), "bancales");
}

/** Cargado, sin error y con data = null: ese bancal no existe. */
export function useBancal(id: string): Carga<BancalDetalle | null> {
  return useCarga(async (bancalId, signal) => (await getBancal(bancalId, signal)) ?? null, id);
}
