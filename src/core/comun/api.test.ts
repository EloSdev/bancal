import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aErrorApi,
  configurarModoDemo,
  ErrorApi,
  esCancelacion,
  esperar,
  LATENCIA_MS,
  leerModoDemo,
  modoDemo,
  simularServidor,
} from "./api";

describe("esperar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resuelve pasado el tiempo indicado, no antes", async () => {
    let resuelta = false;
    void esperar(400).then(() => (resuelta = true));
    await vi.advanceTimersByTimeAsync(399);
    expect(resuelta).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(resuelta).toBe(true);
  });

  it("se rechaza como cancelación si se aborta durante la espera", async () => {
    const controller = new AbortController();
    const espera = esperar(400, controller.signal);
    controller.abort();
    const error = await espera.catch((e: unknown) => e);
    expect(esCancelacion(error)).toBe(true);
  });

  it("se rechaza en el acto si la señal ya estaba abortada", async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await esperar(400, controller.signal).catch((e: unknown) => e);
    expect(esCancelacion(error)).toBe(true);
  });
});

describe("modo demo (T22)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    configurarModoDemo({ lento: true, fallo: false }); // el modo de los tests (src/test/setup.ts)
  });

  it("C22.1 · se lee de la URL: ?lento y ?fallo, juntos o por separado, con o sin valor", () => {
    expect(leerModoDemo("")).toEqual({ lento: false, fallo: false });
    expect(leerModoDemo("?lento")).toEqual({ lento: true, fallo: false });
    expect(leerModoDemo("?fallo=1")).toEqual({ lento: false, fallo: true });
    expect(leerModoDemo("?mes=5&lento&fallo")).toEqual({ lento: true, fallo: true });
  });

  it("C22.1 · sin modo demo, simularServidor responde sin esperar", async () => {
    configurarModoDemo({ lento: false, fallo: false });
    let resuelta = false;
    void simularServidor("getCultivos").then(() => (resuelta = true));
    await Promise.resolve();
    expect(resuelta).toBe(true);
  });

  it("C22.1 · sin modo demo, una petición ya cancelada se rechaza igual", async () => {
    configurarModoDemo({ lento: false, fallo: false });
    const controller = new AbortController();
    controller.abort();
    const error = await simularServidor("getCultivos", controller.signal).catch((e: unknown) => e);
    expect(esCancelacion(error)).toBe(true);
  });

  it("C22.1 · con ?lento, simularServidor espera LATENCIA_MS", async () => {
    configurarModoDemo({ lento: true, fallo: false });
    let resuelta = false;
    void simularServidor("getCultivos").then(() => (resuelta = true));
    await vi.advanceTimersByTimeAsync(LATENCIA_MS - 1);
    expect(resuelta).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(resuelta).toBe(true);
  });

  it("C22.2 · con ?fallo, la primera llamada de cada operación falla con un error de red que lo dice, y la siguiente va bien", async () => {
    configurarModoDemo({ lento: false, fallo: true });

    const primera = await simularServidor("getCultivos").catch((e: unknown) => e);
    expect(primera).toBeInstanceOf(ErrorApi);
    expect((primera as ErrorApi).tipo).toBe("red");
    expect((primera as ErrorApi).message).toMatch(/fallo simulado/i);

    await expect(simularServidor("getCultivos")).resolves.toBeUndefined();
    // Otra operación tiene su propio primer fallo.
    await expect(simularServidor("saveBancal")).rejects.toBeInstanceOf(ErrorApi);
  });

  it("C22.3 · modoDemo dice lo que está activo", () => {
    configurarModoDemo({ lento: true, fallo: true });
    expect(modoDemo()).toEqual({ lento: true, fallo: true });
  });
});

describe("ErrorApi", () => {
  it("lleva su tipo y un mensaje para el usuario", () => {
    const error = new ErrorApi("red", "No se ha podido conectar.");
    expect(error).toBeInstanceOf(Error);
    expect(error.tipo).toBe("red");
    expect(error.message).toBe("No se ha podido conectar.");
  });

  it("aErrorApi deja pasar un ErrorApi y envuelve cualquier otro error como «datos»", () => {
    const deRed = new ErrorApi("red", "Sin conexión.");
    expect(aErrorApi(deRed)).toBe(deRed);
    const raro = aErrorApi(new TypeError("x is undefined"));
    expect(raro).toBeInstanceOf(ErrorApi);
    expect(raro.tipo).toBe("datos");
    expect(raro.cause).toBeInstanceOf(TypeError);
  });

  it("una cancelación no es un ErrorApi", () => {
    expect(esCancelacion(new DOMException("Abortado", "AbortError"))).toBe(true);
    expect(esCancelacion(new ErrorApi("red", "Sin conexión."))).toBe(false);
  });
});
