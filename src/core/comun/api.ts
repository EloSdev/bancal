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

/** Latencia simulada de cada llamada, en ms: la interfaz ve «cargando» como con un servidor. */
export const LATENCIA_MS = 400;

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
