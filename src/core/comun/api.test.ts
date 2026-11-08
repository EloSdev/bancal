import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aErrorApi, ErrorApi, esCancelacion, esperar, fijarLatencia, LATENCIA_MS, responder } from "./api";

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

describe("responder (T22: sin latencia simulada en la app)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("C22.1 · sin latencia (la app), responde sin esperar", async () => {
    fijarLatencia(0);
    let resuelta = false;
    void responder().then(() => (resuelta = true));
    await Promise.resolve();
    expect(resuelta).toBe(true);
  });

  it("C22.1 · sin latencia, una petición ya cancelada se rechaza igual que con fetch", async () => {
    fijarLatencia(0);
    const controller = new AbortController();
    controller.abort();
    const error = await responder(controller.signal).catch((e: unknown) => e);
    expect(esCancelacion(error)).toBe(true);
  });

  it("C22.2 · con la latencia de los tests, espera LATENCIA_MS", async () => {
    fijarLatencia(LATENCIA_MS);
    let resuelta = false;
    void responder().then(() => (resuelta = true));
    await vi.advanceTimersByTimeAsync(LATENCIA_MS - 1);
    expect(resuelta).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(resuelta).toBe(true);
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
