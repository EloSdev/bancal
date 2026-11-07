import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cultivosDePrueba, hinojo } from "../__fixtures__/cultivos";
import { LATENCIA_MS } from "../comun/api";
import type { Carga } from "../comun/hooks";
import { useCultivo, useCultivos } from "./hooks";

const pasarLatencia = () => act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));

/** El estado sin la función `recargar`, para compararlo con toEqual. */
const estado = <T,>({ recargar: _recargar, ...resto }: Carga<T>) => resto;

let errorDeConsola: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers();
  errorDeConsola = vi.spyOn(console, "error");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(cultivosDePrueba))),
  );
});
afterEach(() => {
  const llamadas = errorDeConsola.mock.calls;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  expect(llamadas).toEqual([]); // sin avisos de act()
});

describe("useCultivos", () => {
  it("C8.4 · carga el catálogo: { data, loading, error }", async () => {
    const { result } = renderHook(() => useCultivos());
    expect(estado(result.current)).toEqual({ data: null, loading: true, error: null });
    await pasarLatencia();
    expect(estado(result.current)).toEqual({ data: cultivosDePrueba, loading: false, error: null });
  });

  it("C8.4 · si la descarga falla, devuelve el error tipado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );
    const { result } = renderHook(() => useCultivos());
    await pasarLatencia();
    expect(result.current.loading).toBe(false);
    expect(result.current.error?.tipo).toBe("red");
  });

  it("C8.4 · desmontar antes de que acabe la latencia cancela la petición: no llega a descargar", async () => {
    const { unmount } = renderHook(() => useCultivos());
    unmount();
    await pasarLatencia();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("useCultivo", () => {
  it("C8.4 · carga un cultivo por su id", async () => {
    const { result } = renderHook(() => useCultivo("hinojo"));
    await pasarLatencia();
    expect(estado(result.current)).toEqual({ data: hinojo, loading: false, error: null });
  });

  it("C8.4 · un id inexistente termina sin datos y sin error (la ficha pinta «no encontrado»)", async () => {
    const { result } = renderHook(() => useCultivo("pepino-gigante"));
    await pasarLatencia();
    expect(estado(result.current)).toEqual({ data: null, loading: false, error: null });
  });

  it("C8.4 · al cambiar de id vuelve a cargar", async () => {
    const { result, rerender } = renderHook(({ id }) => useCultivo(id), { initialProps: { id: "hinojo" } });
    await pasarLatencia();
    rerender({ id: "tomate" });
    expect(result.current.loading).toBe(true);
    await pasarLatencia();
    expect(result.current.data?.id).toBe("tomate");
  });
});
