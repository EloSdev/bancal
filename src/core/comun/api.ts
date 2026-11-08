// Piezas comunes de la capa api: latencia simulada y error tipado.

export type TipoErrorApi = "red" | "datos" | "no-encontrado" | "almacenamiento";

export class ErrorApi extends Error {
  readonly tipo: TipoErrorApi;
  constructor(tipo: TipoErrorApi, mensaje: string, opciones?: { cause?: unknown }) {
    super(mensaje, opciones);
    this.name = "ErrorApi";
    this.tipo = tipo;
  }
}

/**
 * La latencia que usan los tests (`src/test/setup.ts` la fija con
 * `fijarLatencia`), en ms: con temporizadores falsos, los estados de carga se
 * pueden ver y comprobar. La app no la usa: responde sin espera (T22). Para
 * probar a mano una red lenta, el *throttling* de DevTools (Network).
 */
export const LATENCIA_MS = 400;

let latencia = 0;

/** Solo para los tests: la espera de cada llamada a la api. La app no la cambia (0). */
export function fijarLatencia(ms: number): void {
  latencia = ms;
}

/**
 * El paso común de cada llamada a la api, como el viaje a un servidor: sin
 * espera en la app (la de los tests, si la fijan). Una petición ya cancelada
 * se rechaza igual que con `fetch`.
 */
export async function responder(signal?: AbortSignal): Promise<void> {
  if (latencia > 0) await esperar(latencia, signal);
  else if (signal?.aborted) throw cancelacion();
}

const cancelacion = () => new DOMException("Petición cancelada", "AbortError");

/** Espera `ms`; si la señal se aborta, se rechaza como cancelación (igual que `fetch`). */
export function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(cancelacion());
    const temporizador = setTimeout(() => {
      signal?.removeEventListener("abort", alAbortar);
      resolve();
    }, ms);
    function alAbortar() {
      clearTimeout(temporizador);
      reject(cancelacion());
    }
    signal?.addEventListener("abort", alAbortar, { once: true });
  });
}

/** Una petición cancelada (al desmontar) no es un error que enseñar al usuario. */
export function esCancelacion(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Lo que llegue a la interfaz es siempre un ErrorApi: un fallo inesperado cuenta como «datos». */
export function aErrorApi(error: unknown): ErrorApi {
  if (error instanceof ErrorApi) return error;
  return new ErrorApi("datos", "Algo ha fallado al leer los datos.", { cause: error });
}
