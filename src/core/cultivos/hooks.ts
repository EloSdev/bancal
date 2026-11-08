// Hooks de datos del catálogo. Con caché (T21): crops.json no cambia mientras
// la app está abierta, así que lo ya leído se enseña al momento (y se
// refresca por detrás).
import { precargar } from "../comun/cache";
import { useCarga, type Carga } from "../comun/hooks";
import { getCultivo, getCultivos } from "./api";
import type { Cultivo } from "./model";

const CACHE_CATALOGO = "cultivos";
const CACHE_CULTIVO = "cultivo";

export function useCultivos(): Carga<Cultivo[]> {
  return useCarga((_clave, signal) => getCultivos(signal), "todos", { cache: CACHE_CATALOGO });
}

/** Cargado, sin error y con data = null: ese cultivo no existe. */
export function useCultivo(id: string): Carga<Cultivo | null> {
  return useCarga(async (cultivoId, signal) => (await getCultivo(cultivoId, signal)) ?? null, id, {
    cache: CACHE_CULTIVO,
  });
}

/** Al arrancar la app: el catálogo ya está cuando se abre una pantalla que lo usa. */
export function precargarCultivos(): Promise<void> {
  return precargar(`${CACHE_CATALOGO}:todos`, () => getCultivos());
}
