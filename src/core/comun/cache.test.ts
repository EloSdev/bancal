import { afterEach, describe, expect, it } from "vitest";
import {
  guardarCache,
  invalidarCache,
  leerCache,
  precargaEnCurso,
  precargar,
  vaciarCache,
  versionCache,
} from "./cache";

afterEach(() => vaciarCache());

describe("caché de datos", () => {
  it("C21.1 · guarda un valor y lo devuelve envuelto (también si el valor es null)", () => {
    expect(leerCache("cultivos:todos")).toBeUndefined();
    guardarCache("cultivos:todos", ["tomate"], versionCache());
    expect(leerCache("cultivos:todos")).toEqual({ valor: ["tomate"] });

    guardarCache("bancal:x", null, versionCache());
    expect(leerCache("bancal:x")).toEqual({ valor: null });
  });

  it("C21.2 · invalidar borra las claves que empiezan por el prefijo y deja el resto", () => {
    guardarCache("bancales:todos", [1], versionCache());
    guardarCache("bancal:a", { id: "a" }, versionCache());
    guardarCache("cultivos:todos", ["tomate"], versionCache());

    invalidarCache("bancal");

    expect(leerCache("bancales:todos")).toBeUndefined();
    expect(leerCache("bancal:a")).toBeUndefined();
    expect(leerCache("cultivos:todos")).toEqual({ valor: ["tomate"] });
  });

  it("C21.2 · lo leído antes de invalidar no vuelve a llenar la caché", () => {
    const antes = versionCache();
    invalidarCache("bancal");
    guardarCache("bancal:a", { id: "viejo" }, antes);
    expect(leerCache("bancal:a")).toBeUndefined();
  });

  it("C21.3 · precargar llena la caché y, mientras llega, deja ver la carga en curso", async () => {
    let resolver!: (v: string[]) => void;
    const carga = precargar("cultivos:todos", () => new Promise<string[]>((r) => (resolver = r)));

    const enCurso = precargaEnCurso<string[]>("cultivos:todos");
    expect(enCurso).toBeDefined();
    resolver(["tomate"]);
    await expect(enCurso).resolves.toEqual(["tomate"]);
    await carga;

    expect(leerCache("cultivos:todos")).toEqual({ valor: ["tomate"] });
    expect(precargaEnCurso("cultivos:todos")).toBeUndefined();
  });

  it("C21.3 · precargar no repite una carga que ya está en la caché o en curso", async () => {
    let llamadas = 0;
    const cargar = async () => {
      llamadas++;
      return ["tomate"];
    };
    await Promise.all([precargar("cultivos:todos", cargar), precargar("cultivos:todos", cargar)]);
    await precargar("cultivos:todos", cargar);
    expect(llamadas).toBe(1);
  });

  it("C21.3 · una precarga que falla no deja nada en la caché ni rompe la app", async () => {
    await precargar("cultivos:todos", async () => {
      throw new Error("sin red");
    });
    expect(leerCache("cultivos:todos")).toBeUndefined();
    expect(precargaEnCurso("cultivos:todos")).toBeUndefined();
  });
});
