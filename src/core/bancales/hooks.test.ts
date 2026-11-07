import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bancalDemo } from "../__fixtures__/bancales";
import { LATENCIA_MS } from "../comun/api";
import type { Carga } from "../comun/hooks";
import { CLAVE_ALMACEN, deleteBancal } from "./api";
import { useBancal, useBancales } from "./hooks";
import type { Plantacion } from "./model";

const pasarLatencia = () => act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));

/** El estado sin la función `recargar`, para compararlo con toEqual. */
const estado = <T,>({ recargar: _recargar, ...resto }: Carga<T>) => resto;

const tomate: Plantacion = { cultivoId: "tomate", celda: { fila: 0, columna: 0 }, mesSiembra: 5 };

let errorDeConsola: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers();
  errorDeConsola = vi.spyOn(console, "error");
  localStorage.clear();
  localStorage.setItem(
    CLAVE_ALMACEN,
    JSON.stringify({ bancales: [bancalDemo], plantaciones: { [bancalDemo.id]: [tomate] } }),
  );
});
afterEach(() => {
  const llamadas = errorDeConsola.mock.calls;
  vi.useRealTimers();
  vi.restoreAllMocks();
  expect(llamadas).toEqual([]); // sin avisos de act()
});

describe("useBancales", () => {
  it("C8.4 · carga los bancales guardados: { data, loading, error }", async () => {
    const { result } = renderHook(() => useBancales());
    expect(estado(result.current)).toEqual({ data: null, loading: true, error: null });
    await pasarLatencia();
    expect(estado(result.current)).toEqual({ data: [bancalDemo], loading: false, error: null });
  });

  it("C8.4 · si localStorage no deja leer, devuelve el error tipado", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Acceso denegado", "SecurityError");
    });
    const { result } = renderHook(() => useBancales());
    await pasarLatencia();
    expect(result.current.error?.tipo).toBe("almacenamiento");
  });

  it("C8.4 · tras borrar un bancal, recargar trae la lista nueva", async () => {
    const { result } = renderHook(() => useBancales());
    await pasarLatencia();
    const borrado = deleteBancal(bancalDemo.id);
    await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
    await borrado;
    act(() => result.current.recargar());
    await pasarLatencia();
    expect(estado(result.current)).toEqual({ data: [], loading: false, error: null });
  });
});

describe("useBancal", () => {
  it("C8.4 · carga un bancal con sus plantaciones", async () => {
    const { result } = renderHook(() => useBancal(bancalDemo.id));
    await pasarLatencia();
    expect(estado(result.current)).toEqual({
      data: { bancal: bancalDemo, plantaciones: [tomate] },
      loading: false,
      error: null,
    });
  });

  it("C8.4 · un id inexistente termina sin datos y sin error", async () => {
    const { result } = renderHook(() => useBancal("no-existe"));
    await pasarLatencia();
    expect(estado(result.current)).toEqual({ data: null, loading: false, error: null });
  });
});
