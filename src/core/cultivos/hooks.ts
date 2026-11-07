// Hooks de datos del catálogo.
import { useCarga, type Carga } from "../comun/hooks";
import { getCultivo, getCultivos } from "./api";
import type { Cultivo } from "./model";

export function useCultivos(): Carga<Cultivo[]> {
  return useCarga((_clave, signal) => getCultivos(signal), "cultivos");
}

/** Cargado, sin error y con data = null: ese cultivo no existe. */
export function useCultivo(id: string): Carga<Cultivo | null> {
  return useCarga(async (cultivoId, signal) => (await getCultivo(cultivoId, signal)) ?? null, id);
}
