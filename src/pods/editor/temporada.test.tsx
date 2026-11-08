import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bancalDemo } from "../../core/__fixtures__/bancales";
import { cultivosDePrueba } from "../../core/__fixtures__/cultivos";
import { CLAVE_ALMACEN } from "../../core/bancales/api";
import type { Plantacion } from "../../core/bancales/model";
import { LATENCIA_MS } from "../../core/comun/api";
import { renderRuta } from "../../test/render-ruta";

const en = (cultivoId: string, fila: number, columna: number, mesSiembra = 5): Plantacion => ({
  cultivoId,
  celda: { fila, columna },
  mesSiembra,
});

// La demo (guía §2): tomates, albahaca y hinojo en el bancal de 120 × 90, zona atlántica.
const demo = [en("tomate", 0, 0), en("albahaca", 0, 1), en("tomate", 0, 2), en("hinojo", 2, 3)];

async function abrir(ruta: string) {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify({ bancales: [bancalDemo], plantaciones: { demo } }));
  const router = renderRuta(ruta);
  await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
  return router;
}

const deslizador = () => screen.getByRole("slider", { name: "Mes" });
const mover = (mes: number) => act(() => fireEvent.change(deslizador(), { target: { value: String(mes) } }));
const celda = (fila: number, columna: number) =>
  within(screen.getByRole("grid")).getByRole("button", { name: new RegExp(`^Fila ${fila}, columna ${columna}:`) });
const tareas = () => screen.getByRole("region", { name: /^Tareas de / });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 5, 15)); // junio
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(cultivosDePrueba))),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Editor · temporada", () => {
  it("C15.1 · el deslizador lee el mes de la URL, lo dice con su nombre y al moverlo actualiza ?mes=", async () => {
    const router = await abrir("/bancales/demo?mes=3");
    expect(deslizador()).toHaveValue("3");
    expect(deslizador()).toHaveAttribute("aria-valuetext", "marzo");
    await mover(7);
    expect(router.state.location.search).toEqual({ mes: 7 });
    expect(deslizador()).toHaveAttribute("aria-valuetext", "julio");
  });

  it.each(["/bancales/demo", "/bancales/demo?mes=13", "/bancales/demo?mes=abc"])(
    "C15.1 · sin mes o con uno inválido (%s) se usa el mes actual",
    async (ruta) => {
      await abrir(ruta);
      expect(deslizador()).toHaveValue("6");
    },
  );

  it("C15.2 · cada celda dice el estado de su planta (descripción accesible) y lo dibuja", async () => {
    await abrir("/bancales/demo?mes=3");
    expect(celda(1, 1)).toHaveAccessibleDescription("Marzo: por sembrar (se siembra en mayo)");
    expect(celda(1, 1)).toHaveAttribute("data-estado", "por-sembrar");
    await mover(7);
    expect(celda(1, 1)).toHaveAccessibleDescription("Julio: en cosecha (hasta agosto)");
    expect(celda(1, 1)).toHaveAttribute("data-estado", "cosecha");
    // Una celda vacía no tiene estado.
    expect(celda(2, 1)).not.toHaveAttribute("data-estado");
  });

  it("C15.4 · las tareas del mes cambian con el deslizador", async () => {
    await abrir("/bancales/demo?mes=5");
    expect(tareas()).toHaveAccessibleName("Tareas de mayo");
    expect(within(tareas()).getByRole("list", { name: "Sembrar" })).toHaveTextContent(/Tomate.*Albahaca.*Hinojo/);
    await mover(7);
    expect(within(tareas()).getByRole("list", { name: "Cosechar" })).toHaveTextContent(/Tomate.*Albahaca/);
    await mover(1);
    expect(tareas()).toHaveTextContent("Nada que sembrar ni cosechar en enero.");
  });

  it("C15.5 · la demo: de marzo a septiembre el tomate pasa de por sembrar a cosecha y termina", async () => {
    await abrir("/bancales/demo?mes=3");
    const recorrido: [number, string][] = [
      [3, "por-sembrar"],
      [5, "sembrada"],
      [6, "creciendo"],
      [7, "cosecha"],
      [9, "terminada"],
    ];
    for (const [mes, estado] of recorrido) {
      await mover(mes);
      expect(celda(1, 1)).toHaveAttribute("data-estado", estado);
    }
  });
});
