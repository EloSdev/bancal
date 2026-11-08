import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi, esCancelacion, LATENCIA_MS } from "../comun/api";
import {
  CLAVE_ALMACEN,
  CLAVE_DESCARTADOS,
  deleteBancal,
  getBancal,
  getBancales,
  getBancalesDetalle,
  hayDatosDescartados,
  olvidarDatosDescartados,
  saveBancal,
  savePlantaciones,
} from "./api";
import type { BancalInput, Plantacion } from "./model";

const balcon: BancalInput = { nombre: "Balcón", ancho: 120, largo: 90, horasSol: 8, zona: "atlantica" };
const patio: BancalInput = { nombre: "Patio", ancho: 60, largo: 60, horasSol: 4, zona: "interior" };
const tomateHinojo: Plantacion[] = [
  { cultivoId: "tomate", celda: { fila: 0, columna: 0 }, mesSiembra: 5 },
  { cultivoId: "hinojo", celda: { fila: 0, columna: 1 }, mesSiembra: 5 },
];

/** Lanza la llamada, deja pasar la latencia simulada y devuelve el valor o el error. */
async function tras<T>(llamada: Promise<T>): Promise<T> {
  const resultado = llamada.then(
    (valor) => ({ valor }),
    (error: unknown) => ({ error }),
  );
  await vi.advanceTimersByTimeAsync(LATENCIA_MS);
  const r = await resultado;
  if ("error" in r) throw r.error;
  return r.valor;
}

async function falla(llamada: Promise<unknown>): Promise<unknown> {
  return tras(llamada).then(
    () => expect.unreachable("tenía que fallar"),
    (error: unknown) => error,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("bancales en localStorage", () => {
  it("C8.2 · sin nada guardado no hay bancales", async () => {
    expect(await tras(getBancales())).toEqual([]);
  });

  it("C8.2 · saveBancal sin id crea un bancal con id nuevo y lo guarda en localStorage", async () => {
    const creado = await tras(saveBancal(balcon));
    expect(creado).toEqual({ ...balcon, id: expect.any(String) });
    expect(localStorage.getItem(CLAVE_ALMACEN)).toContain("Balcón");
    expect(await tras(getBancales())).toEqual([creado]);
  });

  it("C8.2 · dos bancales nuevos tienen ids distintos", async () => {
    const a = await tras(saveBancal(balcon));
    const b = await tras(saveBancal(patio));
    expect(a.id).not.toBe(b.id);
    expect(await tras(getBancales())).toEqual([a, b]);
  });

  it("C8.2 · saveBancal con id sustituye ese bancal sin tocar los demás", async () => {
    const a = await tras(saveBancal(balcon));
    const b = await tras(saveBancal(patio));
    const editado = await tras(saveBancal({ ...balcon, nombre: "Balcón sur", horasSol: 9 }, a.id));
    expect(editado).toEqual({ ...balcon, nombre: "Balcón sur", horasSol: 9, id: a.id });
    expect(await tras(getBancales())).toEqual([editado, b]);
  });

  it("C8.2 · saveBancal recorta el nombre y descarta claves que no son del modelo", async () => {
    const sucio = { ...balcon, nombre: "  Balcón  ", extra: "basura" } as BancalInput;
    expect(await tras(saveBancal(sucio))).toEqual({ ...balcon, id: expect.any(String) });
  });

  it("C8.2 · getBancal devuelve el bancal con sus plantaciones (al principio, ninguna)", async () => {
    const creado = await tras(saveBancal(balcon));
    expect(await tras(getBancal(creado.id))).toEqual({ bancal: creado, plantaciones: [] });
  });

  it("C8.2 · getBancal de un id que no existe devuelve undefined", async () => {
    expect(await tras(getBancal("no-existe"))).toBeUndefined();
  });

  it("C8.2 · savePlantaciones guarda las plantaciones de ese bancal y getBancal las devuelve", async () => {
    const a = await tras(saveBancal(balcon));
    const b = await tras(saveBancal(patio));
    await tras(savePlantaciones(a.id, tomateHinojo));
    expect(await tras(getBancal(a.id))).toEqual({ bancal: a, plantaciones: tomateHinojo });
    expect(await tras(getBancal(b.id))).toEqual({ bancal: b, plantaciones: [] });
  });

  it("C11.1 · getBancalesDetalle devuelve cada bancal con sus plantaciones, en orden de alta", async () => {
    const a = await tras(saveBancal(balcon));
    const b = await tras(saveBancal(patio));
    await tras(savePlantaciones(a.id, tomateHinojo));
    expect(await tras(getBancalesDetalle())).toEqual([
      { bancal: a, plantaciones: tomateHinojo },
      { bancal: b, plantaciones: [] },
    ]);
  });

  it("C11.1 · getBancalesDetalle tiene latencia simulada", async () => {
    let listo = false;
    void getBancalesDetalle().then(() => (listo = true));
    await vi.advanceTimersByTimeAsync(LATENCIA_MS - 1);
    expect(listo).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(listo).toBe(true);
  });

  it("C8.2 · deleteBancal borra el bancal y sus plantaciones", async () => {
    const a = await tras(saveBancal(balcon));
    const b = await tras(saveBancal(patio));
    await tras(savePlantaciones(a.id, tomateHinojo));
    await tras(deleteBancal(a.id));
    expect(await tras(getBancales())).toEqual([b]);
    expect(await tras(getBancal(a.id))).toBeUndefined();
    expect(localStorage.getItem(CLAVE_ALMACEN)).not.toContain("hinojo");
  });

  it("C8.2 · todas las llamadas tienen latencia simulada", async () => {
    const llamadas: (() => Promise<unknown>)[] = [
      () => getBancales(),
      () => getBancal("x"),
      () => saveBancal(balcon),
      () => deleteBancal("x"),
      () => savePlantaciones("x", []),
    ];
    for (const llamar of llamadas) {
      let terminada = false;
      void llamar().finally(() => (terminada = true)).catch(() => {});
      await vi.advanceTimersByTimeAsync(LATENCIA_MS - 1);
      expect(terminada).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(terminada).toBe(true);
    }
  });

  it("C8.2 · una escritura cancelada durante la latencia no guarda nada", async () => {
    const controller = new AbortController();
    const resultado = saveBancal(balcon, undefined, controller.signal).catch((e: unknown) => e);
    controller.abort();
    expect(esCancelacion(await resultado)).toBe(true);
    expect(localStorage.getItem(CLAVE_ALMACEN)).toBeNull();
  });
});

describe("plantaciones dentro de la cuadrícula", () => {
  it("C8.6 · encoger un bancal quita las plantaciones que quedan fuera y conserva las que caben", async () => {
    const a = await tras(saveBancal(balcon)); // 120 × 90 → 4 × 3
    const dentro: Plantacion = { cultivoId: "albahaca", celda: { fila: 1, columna: 1 }, mesSiembra: 5 };
    const fuera: Plantacion = { cultivoId: "tomate", celda: { fila: 2, columna: 3 }, mesSiembra: 5 };
    await tras(savePlantaciones(a.id, [dentro, fuera]));
    const encogido = await tras(saveBancal({ ...balcon, ancho: 60, largo: 60 }, a.id)); // 2 × 2
    expect(await tras(getBancal(a.id))).toEqual({ bancal: encogido, plantaciones: [dentro] });
  });

  it("C8.6 · al encoger a un rectángulo, el largo recorta filas y el ancho columnas", async () => {
    const a = await tras(saveBancal(balcon)); // 120 × 90 → 4 columnas × 3 filas
    const ultimaColumna: Plantacion = { cultivoId: "albahaca", celda: { fila: 0, columna: 3 }, mesSiembra: 5 };
    const ultimaFila: Plantacion = { cultivoId: "tomate", celda: { fila: 2, columna: 0 }, mesSiembra: 5 };
    await tras(savePlantaciones(a.id, [ultimaColumna, ultimaFila]));
    await tras(saveBancal({ ...balcon, largo: 60 }, a.id)); // 120 × 60 → 4 columnas × 2 filas
    expect((await tras(getBancal(a.id)))?.plantaciones).toEqual([ultimaColumna]);
  });

  it("C8.6 · agrandar un bancal conserva todas sus plantaciones", async () => {
    const a = await tras(saveBancal(balcon));
    await tras(savePlantaciones(a.id, tomateHinojo));
    await tras(saveBancal({ ...balcon, ancho: 300 }, a.id));
    expect((await tras(getBancal(a.id)))?.plantaciones).toEqual(tomateHinojo);
  });

  it("C8.6 · savePlantaciones rechaza una celda fuera de la cuadrícula del bancal", async () => {
    const a = await tras(saveBancal(balcon)); // 4 × 3
    const error = await falla(
      savePlantaciones(a.id, [{ cultivoId: "tomate", celda: { fila: 3, columna: 0 }, mesSiembra: 5 }]),
    );
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).tipo).toBe("datos");
    expect((await tras(getBancal(a.id)))?.plantaciones).toEqual([]);
  });

  it("C8.6 · savePlantaciones rechaza dos plantaciones en la misma celda", async () => {
    const a = await tras(saveBancal(balcon));
    const repetida = { ...tomateHinojo[1]!, celda: tomateHinojo[0]!.celda };
    const error = await falla(savePlantaciones(a.id, [tomateHinojo[0]!, repetida]));
    expect((error as ErrorApi).tipo).toBe("datos");
  });
});

describe("errores tipados", () => {
  it("C8.3 · editar un bancal que no existe es un ErrorApi «no-encontrado»", async () => {
    const error = await falla(saveBancal(balcon, "no-existe"));
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).tipo).toBe("no-encontrado");
  });

  it("C8.3 · guardar plantaciones de un bancal que no existe es un ErrorApi «no-encontrado»", async () => {
    const error = await falla(savePlantaciones("no-existe", tomateHinojo));
    expect((error as ErrorApi).tipo).toBe("no-encontrado");
  });

  it("C8.3 · un bancal que no cumple el esquema es un ErrorApi «datos» con el motivo", async () => {
    const error = await falla(saveBancal({ ...balcon, ancho: 10 }));
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).tipo).toBe("datos");
    expect((error as ErrorApi).message).toMatch(/30 cm/);
  });

  it("C8.3 · una plantación con un mes imposible es un ErrorApi «datos»", async () => {
    const a = await tras(saveBancal(balcon));
    const error = await falla(savePlantaciones(a.id, [{ ...tomateHinojo[0]!, mesSiembra: 13 }]));
    expect((error as ErrorApi).tipo).toBe("datos");
  });

  it("C8.3 · si localStorage no deja escribir (cuota llena), llega un ErrorApi «almacenamiento»", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Cuota superada", "QuotaExceededError");
    });
    const error = await falla(saveBancal(balcon));
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).tipo).toBe("almacenamiento");
  });

  it("C8.3 · el error al escribir dice que no se puede guardar y qué mirar (no habla de leer)", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Cuota superada", "QuotaExceededError");
    });
    const { message } = (await falla(saveBancal(balcon))) as ErrorApi;
    expect(message).toMatch(/no deja guardar/);
    expect(message).toMatch(/modo privado|espacio/);
    expect(message).not.toMatch(/leer/);
  });

  it("C8.3 · si localStorage no deja leer (navegación privada estricta), llega un ErrorApi «almacenamiento»", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Acceso denegado", "SecurityError");
    });
    const error = await falla(getBancales());
    expect((error as ErrorApi).tipo).toBe("almacenamiento");
  });
});

describe("localStorage corrupto", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("C8.5 · un JSON roto se descarta: la app arranca sin bancales y queda avisado", async () => {
    localStorage.setItem(CLAVE_ALMACEN, "{ esto no es json");
    expect(await tras(getBancales())).toEqual([]);
    expect(hayDatosDescartados()).toBe(true);
    expect(localStorage.getItem(CLAVE_ALMACEN)).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  it("C8.5 · datos con forma inválida también se descartan", async () => {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify({ bancales: [{ id: "1", nombre: "" }], plantaciones: {} }));
    expect(await tras(getBancales())).toEqual([]);
    expect(hayDatosDescartados()).toBe(true);
  });

  it("C8.5 · lo descartado se guarda aparte, para no perderlo", async () => {
    localStorage.setItem(CLAVE_ALMACEN, "{ esto no es json");
    await tras(getBancales());
    expect(localStorage.getItem(CLAVE_DESCARTADOS)).toBe("{ esto no es json");
  });

  it("C8.5 · tras descartar se puede seguir guardando con normalidad", async () => {
    localStorage.setItem(CLAVE_ALMACEN, "{ esto no es json");
    const creado = await tras(saveBancal(balcon));
    expect(await tras(getBancales())).toEqual([creado]);
  });

  it("C8.5 · olvidarDatosDescartados retira el aviso", async () => {
    localStorage.setItem(CLAVE_ALMACEN, "{ esto no es json");
    await tras(getBancales());
    olvidarDatosDescartados();
    expect(hayDatosDescartados()).toBe(false);
  });

  it("C8.5 · si no hay sitio para la copia, se descarta igualmente y la app sigue", async () => {
    localStorage.setItem(CLAVE_ALMACEN, "{ esto no es json");
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, clave, valor) {
      if (clave === CLAVE_DESCARTADOS) throw new DOMException("Cuota superada", "QuotaExceededError");
      setItem.call(this, clave, valor);
    });
    expect(await tras(getBancales())).toEqual([]);
    expect(localStorage.getItem(CLAVE_ALMACEN)).toBeNull();
    expect(await tras(getBancales())).toEqual([]);
  });

  it("C8.5 · sin datos corruptos no hay aviso", async () => {
    await tras(saveBancal(balcon));
    await tras(getBancales());
    expect(hayDatosDescartados()).toBe(false);
    expect(console.warn).not.toHaveBeenCalled();
  });
});
