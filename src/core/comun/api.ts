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
 * Latencia de cada llamada en el modo demo `?lento` (T22), en ms. Por defecto
 * no hay espera: el backend es un mock y la app no debe fingir lentitud. El
 * modo sirve para enseñar los estados de carga; los tests lo activan.
 */
export const LATENCIA_MS = 400;

/** El modo demo (T22): `?lento` simula un servidor lento; `?fallo`, uno que falla una vez. */
export interface ModoDemo {
  lento: boolean;
  fallo: boolean;
}

let modo: ModoDemo = { lento: false, fallo: false };
// Con ?fallo, las operaciones que ya han fallado una vez (la siguiente va bien).
const yaFallaron = new Set<string>();

/** Lee el modo de la URL con la que se abrió la app («?lento», «?fallo=1», «?mes=5&lento&fallo»). */
export function leerModoDemo(busqueda: string): ModoDemo {
  const parametros = new URLSearchParams(busqueda);
  return { lento: parametros.has("lento"), fallo: parametros.has("fallo") };
}

/** Fija el modo para toda la sesión (main.tsx, al arrancar; los tests, en su setup). */
export function configurarModoDemo(nuevo: ModoDemo): void {
  modo = { ...nuevo };
  yaFallaron.clear();
}

export const modoDemo = (): ModoDemo => ({ ...modo });

/**
 * Lo que haría un servidor antes de responder: nada por defecto; con
 * `?lento`, esperar LATENCIA_MS; con `?fallo`, fallar la primera vez que se
 * llama a cada operación. Una petición cancelada se rechaza como `fetch`.
 */
export async function simularServidor(operacion: string, signal?: AbortSignal): Promise<void> {
  if (modo.lento) await esperar(LATENCIA_MS, signal);
  else if (signal?.aborted) throw cancelacion();
  if (modo.fallo && !yaFallaron.has(operacion)) {
    yaFallaron.add(operacion);
    throw new ErrorApi("red", "Fallo simulado para la demo (?fallo): vuelve a intentarlo.");
  }
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
