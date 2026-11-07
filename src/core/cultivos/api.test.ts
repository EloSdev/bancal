import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cultivosDePrueba } from "../__fixtures__/cultivos";
import { ErrorApi, esCancelacion, LATENCIA_MS } from "../comun/api";
import { getCultivo, getCultivos } from "./api";

const responderCon = (cuerpo: BodyInit, init?: ResponseInit) =>
  vi.fn(async (_url: string, _init?: RequestInit) => new Response(cuerpo, init));

/** Lanza la llamada, deja pasar la latencia simulada y devuelve el valor o el error. */
async function tras<T>(llamada: Promise<T>): Promise<T | unknown> {
  const resultado = llamada.catch((e: unknown) => e);
  await vi.advanceTimersByTimeAsync(LATENCIA_MS);
  return resultado;
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("getCultivos", () => {
  it("C8.1 · lee crops.json y devuelve los cultivos validados", async () => {
    const fetch = responderCon(JSON.stringify(cultivosDePrueba));
    vi.stubGlobal("fetch", fetch);
    expect(await tras(getCultivos())).toEqual(cultivosDePrueba);
    expect(fetch).toHaveBeenCalledWith("/crops.json", expect.objectContaining({}));
  });

  it("C8.1 · tiene latencia simulada: no responde antes de tiempo", async () => {
    vi.stubGlobal("fetch", responderCon(JSON.stringify(cultivosDePrueba)));
    let resuelta = false;
    void getCultivos().then(() => (resuelta = true));
    await vi.advanceTimersByTimeAsync(LATENCIA_MS - 1);
    expect(resuelta).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(resuelta).toBe(true);
  });

  it("C8.1 · un campo que no cumple el esquema hace fallar la lectura como «datos»", async () => {
    const roto = [{ ...cultivosDePrueba[0], sol: "mucho" }];
    vi.stubGlobal("fetch", responderCon(JSON.stringify(roto)));
    const error = await tras(getCultivos());
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).tipo).toBe("datos");
  });

  it("C8.1 · una respuesta HTTP no correcta (response.ok falso) es un error de «red»", async () => {
    vi.stubGlobal("fetch", responderCon("No encontrado", { status: 404 }));
    const error = await tras(getCultivos());
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).tipo).toBe("red");
  });

  it("C8.3 · un fallo de red llega como ErrorApi de tipo «red»", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const error = await tras(getCultivos());
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).tipo).toBe("red");
    expect((error as ErrorApi).message).toMatch(/cultivos/);
  });

  it("C8.3 · un JSON inválido llega como ErrorApi de tipo «datos»", async () => {
    vi.stubGlobal("fetch", responderCon("{ esto no es json"));
    const error = await tras(getCultivos());
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).tipo).toBe("datos");
  });

  it("C8.3 · cancelar la petición no se convierte en error para el usuario", async () => {
    const fetch = responderCon(JSON.stringify(cultivosDePrueba));
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    const resultado = getCultivos(controller.signal).catch((e: unknown) => e);
    controller.abort();
    const error = await resultado;
    expect(esCancelacion(error)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("pasa la señal a fetch para poder cancelar la descarga", async () => {
    const fetch = responderCon(JSON.stringify(cultivosDePrueba));
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    await tras(getCultivos(controller.signal));
    expect(fetch.mock.calls[0]![1]?.signal).toBe(controller.signal);
  });
});

describe("getCultivo", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", responderCon(JSON.stringify(cultivosDePrueba)));
  });

  it("C8.1 · devuelve el cultivo con ese id", async () => {
    expect(await tras(getCultivo("hinojo"))).toEqual(cultivosDePrueba.find((c) => c.id === "hinojo"));
  });

  it("C8.1 · un id que no existe devuelve undefined (la ficha pinta «no encontrado»)", async () => {
    expect(await tras(getCultivo("pepino-gigante"))).toBeUndefined();
  });
});
