// Hooks de datos de los bancales. Con caché (T21): lo ya leído se enseña al
// momento y se refresca por detrás; cada escritura de la api la sustituye
// por lo recién guardado.
import { guardarCache, precargar, versionCache } from "../comun/cache";
import { useCarga, type Carga } from "../comun/hooks";
import { ESPACIOS_CACHE, getBancal, getBancales, getBancalesDetalle, type BancalDetalle } from "./api";
import type { Bancal } from "./model";

// Los mismos espacios que llena la api al escribir (lo recién guardado).
const { lista: CACHE_LISTA, detalle: CACHE_DETALLE, uno: CACHE_UNO } = ESPACIOS_CACHE;

export function useBancales(): Carga<Bancal[]> {
  return useCarga((_clave, signal) => getBancales(signal), "todos", { cache: CACHE_LISTA });
}

/**
 * Lee la lista y deja cada bancal en la caché por su id: al abrir uno desde
 * «Mis bancales», el editor ya lo tiene.
 */
async function leerDetalleYSembrar(signal?: AbortSignal): Promise<BancalDetalle[]> {
  const versionAlEmpezar = versionCache();
  const detalles = await getBancalesDetalle(signal);
  for (const detalle of detalles) guardarCache(`${CACHE_UNO}:${detalle.bancal.id}`, detalle, versionAlEmpezar);
  return detalles;
}

/** Todos los bancales con sus plantaciones (la lista cuenta plantas y avisos). */
export function useBancalesDetalle(): Carga<BancalDetalle[]> {
  return useCarga((_clave, signal) => leerDetalleYSembrar(signal), "todos", { cache: CACHE_DETALLE });
}

/** Cargado, sin error y con data = null: ese bancal no existe. */
export function useBancal(id: string): Carga<BancalDetalle | null> {
  return useCarga(async (bancalId, signal) => (await getBancal(bancalId, signal)) ?? null, id, { cache: CACHE_UNO });
}

/** Al arrancar la app: «Mis bancales» ya tiene sus datos cuando se abre. */
export function precargarBancales(): Promise<void> {
  return precargar(`${CACHE_DETALLE}:todos`, () => leerDetalleYSembrar());
}
