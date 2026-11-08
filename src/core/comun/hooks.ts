// Hook común de carga de datos: { data, loading, error, recargar } con
// AbortController y, si se pide, caché que enseña al momento lo ya leído (T21).
import { useEffect, useState } from "react";
import { aErrorApi, type ErrorApi } from "./api";
import { guardarCache, leerCache, precargaEnCurso, versionCache } from "./cache";

/**
 * Unión discriminada: tras `if (loading)` y `if (error)`, TypeScript sabe que
 * `data` es el valor. En los hooks de detalle, «no existe» va en el propio
 * tipo del dato (`T | null`), no se confunde con «cargando» ni con «error».
 */
export type EstadoCarga<T> =
  | { data: null; loading: true; error: null }
  | { data: T; loading: false; error: null }
  | { data: null; loading: false; error: ErrorApi };

export type Carga<T> = EstadoCarga<T> & {
  /**
   * Vuelve a pedir los datos (tras borrar o guardar, o para reintentar tras un
   * error); mientras tanto el estado vuelve a «cargando». Es una función nueva
   * en cada render: no la pongas en las dependencias de un efecto.
   */
  recargar: () => void;
};

interface Resultado<T> {
  clave: string;
  version: number;
  estado: EstadoCarga<T>;
}

const CARGANDO = { data: null, loading: true, error: null } as const;

/**
 * Carga datos con `cargar(clave, signal)` y vuelve a cargar cuando cambia la
 * clave (el id que se pide, o una constante si no hay parámetros) o al llamar
 * a `recargar`. Al desmontar o al recargar, aborta la carga en curso y
 * descarta su respuesta.
 *
 * `loading` no es un estado aparte: se deriva de si el último resultado es de
 * la petición actual (clave y versión). Así no hay que ponerlo a mano al
 * empezar cada carga. Caso límite aceptado: al volver a una clave anterior
 * (a → b → a) antes de que b responda, se ve el resultado previo de a, que es
 * de la clave correcta, mientras llega el nuevo.
 */
export function useCarga<T>(
  cargar: (clave: string, signal: AbortSignal) => Promise<T>,
  clave: string,
  opciones: OpcionesCarga = {},
): Carga<T> {
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const claveCache = opciones.cache === undefined ? null : `${opciones.cache}:${clave}`;

  useEffect(() => {
    const controller = new AbortController();
    const guardar = (estado: EstadoCarga<T>) => {
      if (!controller.signal.aborted) setResultado({ clave, version, estado });
    };
    const versionAlEmpezar = versionCache();
    // Sin nada guardado pero con la precarga del arranque en vuelo: se espera esa.
    const precarga = claveCache && !leerCache(claveCache) ? precargaEnCurso<T>(claveCache) : undefined;
    const peticion = precarga ? hastaQueSeCancele(precarga, controller.signal) : cargar(clave, controller.signal);
    peticion.then(
      (data) => {
        if (claveCache) guardarCache(claveCache, data, versionAlEmpezar);
        guardar({ data, loading: false, error: null });
      },
      (error: unknown) => {
        // Refresco por detrás que falla: se siguen enseñando los datos de la caché.
        if (claveCache && leerCache(claveCache)) return;
        guardar({ data: null, loading: false, error: aErrorApi(error) });
      },
    );
    return () => controller.abort();
    // `cargar` recibe la clave como argumento: no depende de nada más del render.
  }, [clave, version, claveCache]);

  const vigente =
    resultado?.clave === clave && resultado.version === version ? resultado.estado : desdeCache<T>(claveCache);
  return { ...vigente, recargar: () => setVersion((v) => v + 1) };
}

interface OpcionesCarga {
  /**
   * Espacio de la caché (T21): con él, lo ya leído se enseña al momento al
   * volver a montar y se refresca por detrás. Las escrituras invalidan su
   * espacio (`invalidarCache`). Sin él, cada montaje carga de cero.
   */
  cache?: string;
}

/** Lo que haya en la caché (dato listo, sin «cargando»), o cargando si no hay nada. */
function desdeCache<T>(claveCache: string | null): EstadoCarga<T> {
  const guardado = claveCache ? leerCache<T>(claveCache) : undefined;
  return guardado ? { data: guardado.valor, loading: false, error: null } : CARGANDO;
}

/** La misma promesa, pero que se rechaza como cancelación si la señal se aborta (como `fetch`). */
function hastaQueSeCancele<T>(promesa: Promise<T>, signal: AbortSignal): Promise<T> {
  return Promise.race([promesa, esperarCancelacion(signal)]);
}

function esperarCancelacion(signal: AbortSignal): Promise<never> {
  return new Promise((_resolver, rechazar) => {
    const cancelar = () => rechazar(new DOMException("Petición cancelada", "AbortError"));
    if (signal.aborted) cancelar();
    else signal.addEventListener("abort", cancelar, { once: true });
  });
}
