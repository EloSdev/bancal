import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "./api";
import { invalidarCache, precargar, vaciarCache } from "./cache";
import { useCarga, type Carga, type EstadoCarga } from "./hooks";

/** Una carga que el test resuelve o rechaza cuando quiere, y que recuerda su clave y su señal. */
function cargaControlada<T>() {
  const pendientes: {
    clave: string;
    signal: AbortSignal;
    resolver: (v: T) => void;
    rechazar: (e: unknown) => void;
  }[] = [];
  const cargar = vi.fn(
    (clave: string, signal: AbortSignal) =>
      new Promise<T>((resolver, rechazar) => {
        pendientes.push({ clave, signal, resolver, rechazar });
      }),
  );
  return { cargar, pendientes };
}

/** El estado sin la función `recargar`, para compararlo con toEqual. */
const estado = <T,>({ recargar: _recargar, ...resto }: Carga<T>): EstadoCarga<T> => resto;

const CARGANDO = { data: null, loading: true, error: null };

let errorDeConsola: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorDeConsola = vi.spyOn(console, "error");
});
afterEach(() => {
  const llamadas = errorDeConsola.mock.calls;
  vi.restoreAllMocks();
  // Ni avisos de act() ni actualizaciones tras desmontar.
  expect(llamadas).toEqual([]);
});

describe("useCarga", () => {
  it("C8.4 · empieza cargando y después devuelve los datos", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result } = renderHook(() => useCarga(cargar, "a"));
    expect(estado(result.current)).toEqual(CARGANDO);
    await act(async () => pendientes[0]!.resolver("datos"));
    expect(estado(result.current)).toEqual({ data: "datos", loading: false, error: null });
  });

  it("C8.4 · la carga recibe la clave que se pide", () => {
    const { cargar, pendientes } = cargaControlada<string>();
    renderHook(() => useCarga(cargar, "hinojo"));
    expect(pendientes[0]!.clave).toBe("hinojo");
  });

  it("C8.4 · un fallo llega como error tipado y deja de cargar", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result } = renderHook(() => useCarga(cargar, "a"));
    const error = new ErrorApi("red", "Sin conexión.");
    await act(async () => pendientes[0]!.rechazar(error));
    expect(estado(result.current)).toEqual({ data: null, loading: false, error });
  });

  it("C8.4 · un fallo inesperado también llega como ErrorApi", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result } = renderHook(() => useCarga(cargar, "a"));
    await act(async () => pendientes[0]!.rechazar(new TypeError("x is undefined")));
    expect(result.current.error).toBeInstanceOf(ErrorApi);
    expect(result.current.error?.tipo).toBe("datos");
  });

  it("C8.4 · al desmontar cancela la carga con AbortController", () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { unmount } = renderHook(() => useCarga(cargar, "a"));
    expect(pendientes[0]!.signal.aborted).toBe(false);
    unmount();
    expect(pendientes[0]!.signal.aborted).toBe(true);
  });

  it("C8.4 · si la carga termina después de desmontar, no actualiza el estado", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result, unmount } = renderHook(() => useCarga(cargar, "a"));
    unmount();
    await act(async () => pendientes[0]!.resolver("tarde"));
    expect(estado(result.current)).toEqual(CARGANDO);
    // afterEach comprueba que React no se ha quejado.
  });

  it("C8.4 · al cambiar la clave recarga, cancela la anterior y no enseña datos viejos", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result, rerender } = renderHook(({ clave }) => useCarga(cargar, clave), {
      initialProps: { clave: "a" },
    });
    await act(async () => pendientes[0]!.resolver("datos de a"));
    expect(result.current.data).toBe("datos de a");

    rerender({ clave: "b" });
    expect(estado(result.current)).toEqual(CARGANDO);
    expect(pendientes[1]!.clave).toBe("b");

    await act(async () => pendientes[1]!.resolver("datos de b"));
    expect(estado(result.current)).toEqual({ data: "datos de b", loading: false, error: null });
  });

  it("C8.4 · una respuesta lenta de la clave anterior no pisa la de la clave actual", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result, rerender } = renderHook(({ clave }) => useCarga(cargar, clave), {
      initialProps: { clave: "a" },
    });
    rerender({ clave: "b" });
    expect(pendientes[0]!.signal.aborted).toBe(true);
    await act(async () => pendientes[1]!.resolver("datos de b"));
    await act(async () => pendientes[0]!.resolver("datos viejos de a"));
    expect(result.current.data).toBe("datos de b");
  });

  it("C8.4 · un fallo lento de la clave anterior tampoco pisa la de la clave actual", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result, rerender } = renderHook(({ clave }) => useCarga(cargar, clave), {
      initialProps: { clave: "a" },
    });
    rerender({ clave: "b" });
    await act(async () => pendientes[1]!.resolver("datos de b"));
    await act(async () => pendientes[0]!.rechazar(new ErrorApi("red", "Sin conexión.")));
    expect(estado(result.current)).toEqual({ data: "datos de b", loading: false, error: null });
  });

  it("C8.4 · una cancelación no se enseña como error", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result, rerender } = renderHook(({ clave }) => useCarga(cargar, clave), {
      initialProps: { clave: "a" },
    });
    rerender({ clave: "b" });
    await act(async () => pendientes[0]!.rechazar(new DOMException("Cancelada", "AbortError")));
    expect(estado(result.current)).toEqual(CARGANDO);
  });

  it("C8.4 · en StrictMode la primera carga se cancela y la segunda da los datos", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result } = renderHook(() => useCarga(cargar, "a"), { reactStrictMode: true });
    expect(pendientes).toHaveLength(2);
    expect(pendientes[0]!.signal.aborted).toBe(true);
    await act(async () => pendientes[0]!.resolver("de la carga cancelada"));
    expect(estado(result.current)).toEqual(CARGANDO);
    await act(async () => pendientes[1]!.resolver("datos"));
    expect(estado(result.current)).toEqual({ data: "datos", loading: false, error: null });
  });

  it("recargar vuelve a pedir los datos de la misma clave", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result } = renderHook(() => useCarga(cargar, "a"));
    await act(async () => pendientes[0]!.resolver("primera"));

    act(() => result.current.recargar());
    expect(estado(result.current)).toEqual(CARGANDO);
    expect(pendientes[1]!.clave).toBe("a");

    await act(async () => pendientes[1]!.resolver("segunda"));
    expect(estado(result.current)).toEqual({ data: "segunda", loading: false, error: null });
  });

  it("recargar tras un error permite reintentar", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const { result } = renderHook(() => useCarga(cargar, "a"));
    await act(async () => pendientes[0]!.rechazar(new ErrorApi("red", "Sin conexión.")));
    act(() => result.current.recargar());
    await act(async () => pendientes[1]!.resolver("ahora sí"));
    expect(estado(result.current)).toEqual({ data: "ahora sí", loading: false, error: null });
  });
});

describe("useCarga con caché (T21)", () => {
  afterEach(() => vaciarCache());

  it("C21.1 · la segunda vez que se monta la misma clave enseña los datos al momento y los refresca por detrás", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const primera = renderHook(() => useCarga(cargar, "a", { cache: "prueba" }));
    await act(async () => pendientes[0]!.resolver("datos"));
    primera.unmount();

    const { result } = renderHook(() => useCarga(cargar, "a", { cache: "prueba" }));
    expect(estado(result.current)).toEqual({ data: "datos", loading: false, error: null });
    // Refresco por detrás: se pide otra vez y lo nuevo sustituye a lo de la caché.
    expect(pendientes).toHaveLength(2);
    await act(async () => pendientes[1]!.resolver("datos nuevos"));
    expect(result.current.data).toBe("datos nuevos");
  });

  it("C21.1 · si el refresco falla, se siguen enseñando los datos de la caché", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const primera = renderHook(() => useCarga(cargar, "a", { cache: "prueba" }));
    await act(async () => pendientes[0]!.resolver("datos"));
    primera.unmount();

    const { result } = renderHook(() => useCarga(cargar, "a", { cache: "prueba" }));
    await act(async () => pendientes[1]!.rechazar(new ErrorApi("red", "Sin conexión.")));
    expect(estado(result.current)).toEqual({ data: "datos", loading: false, error: null });
  });

  it("C21.1 · sin la opción cache, cada montaje vuelve a cargar (como antes)", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const primera = renderHook(() => useCarga(cargar, "a"));
    await act(async () => pendientes[0]!.resolver("datos"));
    primera.unmount();

    const { result } = renderHook(() => useCarga(cargar, "a"));
    expect(estado(result.current)).toEqual(CARGANDO);
  });

  it("C21.2 · tras invalidar, la siguiente vez vuelve a enseñar «cargando»", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    const primera = renderHook(() => useCarga(cargar, "a", { cache: "prueba" }));
    await act(async () => pendientes[0]!.resolver("datos"));
    primera.unmount();

    invalidarCache("prueba");
    const { result } = renderHook(() => useCarga(cargar, "a", { cache: "prueba" }));
    expect(estado(result.current)).toEqual(CARGANDO);
  });

  it("C21.3 · si hay una precarga en curso, la espera en vez de pedir otra vez", async () => {
    const { cargar, pendientes } = cargaControlada<string>();
    let resolverPrecarga!: (v: string) => void;
    void precargar("prueba:a", () => new Promise<string>((r) => (resolverPrecarga = r)));

    const { result } = renderHook(() => useCarga(cargar, "a", { cache: "prueba" }));
    expect(estado(result.current)).toEqual(CARGANDO);
    expect(pendientes).toHaveLength(0);

    await act(async () => resolverPrecarga("precargado"));
    expect(estado(result.current)).toEqual({ data: "precargado", loading: false, error: null });
  });
});

// Comprobación en COMPILACIÓN (tsc, dentro de `npm run build`): tras descartar
// la carga y el error, un contenedor usa `data` sin `!` ni `as`.
function cuantos(carga: Carga<string[]>): number {
  const { data, loading, error } = carga;
  if (loading) return -1;
  if (error) return -2;
  return data.length;
}

describe("EstadoCarga", () => {
  it("tras descartar carga y error, data es el valor (sin ! ni as)", () => {
    const recargar = () => {};
    expect(cuantos({ data: ["a", "b"], loading: false, error: null, recargar })).toBe(2);
    expect(cuantos({ data: null, loading: true, error: null, recargar })).toBe(-1);
  });
});
