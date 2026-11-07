// Hook común de carga de datos: { data, loading, error, recargar } con AbortController.
import { useEffect, useState } from "react";
import { aErrorApi, type ErrorApi } from "./api";

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
export function useCarga<T>(cargar: (clave: string, signal: AbortSignal) => Promise<T>, clave: string): Carga<T> {
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const guardar = (estado: EstadoCarga<T>) => {
      if (!controller.signal.aborted) setResultado({ clave, version, estado });
    };
    cargar(clave, controller.signal).then(
      (data) => guardar({ data, loading: false, error: null }),
      (error: unknown) => guardar({ data: null, loading: false, error: aErrorApi(error) }),
    );
    return () => controller.abort();
    // `cargar` recibe la clave como argumento: no depende de nada más del render.
  }, [clave, version]);

  const vigente = resultado?.clave === clave && resultado.version === version ? resultado.estado : CARGANDO;
  return { ...vigente, recargar: () => setVersion((v) => v + 1) };
}
