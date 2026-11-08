import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bancalDemo } from "../../core/__fixtures__/bancales";
import { cultivosDePrueba } from "../../core/__fixtures__/cultivos";
import { CLAVE_ALMACEN } from "../../core/bancales/api";
import type { Bancal, Plantacion } from "../../core/bancales/model";
import { LATENCIA_MS } from "../../core/comun/api";
import { renderRuta } from "../../test/render-ruta";

const en = (cultivoId: string, fila: number, columna: number, mesSiembra = 5): Plantacion => ({
  cultivoId,
  celda: { fila, columna },
  mesSiembra,
});

async function abrir(plantaciones: Plantacion[], bancal: Bancal = bancalDemo) {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify({ bancales: [bancal], plantaciones: { [bancal.id]: plantaciones } }));
  renderRuta(`/bancales/${bancal.id}`);
  await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
}

const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const celda = (fila: number, columna: number) =>
  within(screen.getByRole("grid")).getByRole("button", { name: new RegExp(`^Fila ${fila}, columna ${columna}:`) });
const marca = (fila: number, columna: number) => celda(fila, columna).querySelector("svg[data-forma]")?.getAttribute("data-forma");
const panel = () => screen.getByRole("region", { name: /^Avisos/ });
const anuncio = () => screen.getByRole("status", { name: "Cambios en el bancal" });
const elegir = (nombre: string) =>
  usuario().click(within(screen.getByRole("toolbar", { name: "Cultivos para plantar" })).getByRole("button", { name: nombre }));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
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

describe("Editor · compatibilidades en vivo", () => {
  it("C14.1 · las celdas se marcan con icono (y su forma) y el nombre accesible dice con quién", async () => {
    await abrir([en("tomate", 0, 0), en("hinojo", 0, 1), en("albahaca", 1, 0)]);
    expect(marca(1, 1)).toBe("rombo");
    expect(celda(1, 1)).toHaveAccessibleName("Fila 1, columna 1: tomate, se perjudica con hinojo, se ayuda con albahaca");
    expect(marca(1, 2)).toBe("rombo");
    expect(celda(1, 2)).toHaveAccessibleName("Fila 1, columna 2: hinojo, se perjudica con tomate");
    expect(marca(2, 1)).toBe("circulo");
    expect(celda(2, 1)).toHaveAccessibleName("Fila 2, columna 1: albahaca, se ayuda con tomate");
    // Sin vecinos plantados, sin marca.
    expect(marca(3, 4)).toBeUndefined();
  });

  it("C14.1 · vecinos que ni ayudan ni perjudican: marca neutra (cápsula)", async () => {
    await abrir([en("albahaca", 0, 0), en("hinojo", 0, 1)]);
    expect(marca(1, 1)).toBe("capsula");
    expect(celda(1, 1)).toHaveAccessibleName("Fila 1, columna 1: albahaca, sin efecto con sus vecinos");
  });

  it("C14.2 · el panel explica cada aviso: quién, con quién y por qué; también sol y temporada", async () => {
    const sombra: Bancal = { ...bancalDemo, horasSol: 2 };
    await abrir([en("tomate", 0, 0), en("hinojo", 0, 1, 1)], sombra);
    const lista = within(panel()).getAllByRole("listitem");
    expect(lista.map((li) => li.textContent)).toEqual([
      expect.stringContaining("Tomate junto a hinojo. Se dice que el hinojo frena el crecimiento de las tomateras."),
      expect.stringContaining("Tomate necesita pleno sol y este bancal está en sombra."),
      expect.stringContaining("Hinojo necesita pleno sol"),
      expect.stringContaining("Hinojo se siembra de mayo a junio en la zona atlántica; enero queda fuera de temporada."),
    ]);
    expect(panel()).toHaveAccessibleName("Avisos (4)");
    // Lo que no es de vecindad también se marca en la celda (triángulo) y se dice.
    expect(celda(1, 1)).toHaveAccessibleName(/le falta sol$/);
    expect(celda(1, 2)).toHaveAccessibleName(/le falta sol, siembra fuera de temporada$/);
  });

  it("C14.2 · desde el panel se va a la celda del aviso con el teclado", async () => {
    await abrir([en("tomate", 0, 0), en("hinojo", 0, 1)]);
    await usuario().click(within(panel()).getByRole("button", { name: "Ver tomate (fila 1, columna 1)" }));
    expect(celda(1, 1)).toHaveFocus();
  });

  it("C14.3 · al aparecer o resolverse un aviso, se anuncia en la región de estado", async () => {
    await abrir([en("tomate", 0, 0)]);
    await elegir("Hinojo");
    await usuario().click(celda(1, 2));
    // Un resumen corto: el motivo entero está en el panel.
    expect(anuncio()).toHaveTextContent("Hinojo en la fila 1, columna 2. Nuevo aviso: tomate junto a hinojo.");
    await elegir("Quitar");
    await usuario().click(celda(1, 2));
    expect(anuncio()).toHaveTextContent("Vacía la fila 1, columna 2. Aviso resuelto: tomate junto a hinojo.");
  });

  it("C14.4 · C14.5 · la demo: hinojo junto al tomate se marca y se explica; al moverlo, todo pasa a favorable o neutro", async () => {
    await abrir([en("tomate", 0, 0), en("tomate", 0, 2), en("albahaca", 0, 1)]);
    expect(within(panel()).getByText("Sin avisos: todo se lleva bien.")).toBeInTheDocument();

    // Los avisos no bloquean: el hinojo se coloca junto al tomate.
    await elegir("Hinojo");
    await usuario().click(celda(2, 2));
    expect(celda(2, 2)).toHaveAccessibleName(/^Fila 2, columna 2: hinojo, se perjudica con tomate/);
    expect(marca(2, 2)).toBe("rombo");
    expect(within(panel()).getAllByRole("listitem")).toHaveLength(2);

    // Se mueve a la otra punta: sin avisos y ninguna marca desfavorable.
    await elegir("Quitar");
    await usuario().click(celda(2, 2));
    await elegir("Hinojo");
    await usuario().click(celda(3, 4));
    expect(within(panel()).getByText("Sin avisos: todo se lleva bien.")).toBeInTheDocument();
    const formas = within(screen.getByRole("grid"))
      .getAllByRole("button")
      .map((b) => b.querySelector("svg[data-forma]")?.getAttribute("data-forma"))
      .filter(Boolean);
    expect(formas).not.toContain("rombo");
    expect(formas).toContain("circulo");
  });

  it("la leyenda explica las marcas, también el triángulo de la planta", async () => {
    await abrir([]);
    const leyenda = screen.getByRole("list", { name: "Qué dicen las marcas" });
    expect(leyenda).toHaveTextContent("Le falta sol o va fuera de temporada");
  });

  it("C14.2 · en un aviso de vecindad se puede ir a cada uno de los dos cultivos, nombrado con su sitio", async () => {
    await abrir([en("tomate", 0, 0), en("tomate", 0, 2), en("hinojo", 1, 1)]);
    const [primero, segundo] = within(panel()).getAllByRole("listitem");
    expect(within(primero!).getByRole("button", { name: "Ver tomate (fila 1, columna 1)" })).toBeInTheDocument();
    expect(within(primero!).getByRole("button", { name: "Ver hinojo (fila 2, columna 2)" })).toBeInTheDocument();
    expect(within(segundo!).getByRole("button", { name: "Ver tomate (fila 1, columna 3)" })).toBeInTheDocument();
  });

  it("C14.2 · ir a una celda la señala un momento (con ratón no se ve el foco)", async () => {
    await abrir([en("tomate", 0, 0), en("hinojo", 0, 1)]);
    await usuario().click(within(panel()).getByRole("button", { name: "Ver hinojo (fila 1, columna 2)" }));
    expect(celda(1, 2)).toHaveFocus();
    expect(celda(1, 2)).toHaveAttribute("data-senalada", "true");
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(celda(1, 2)).toHaveAttribute("data-senalada", "false");
  });

  it("C14.2 · cada «Ver…» se describe con su aviso (dos avisos en la misma celda no se confunden)", async () => {
    const sombra: Bancal = { ...bancalDemo, horasSol: 2 };
    await abrir([en("hinojo", 0, 0, 1)], sombra);
    const botones = within(panel()).getAllByRole("button", { name: "Ver hinojo (fila 1, columna 1)" });
    expect(botones).toHaveLength(2);
    expect(botones[0]).toHaveAccessibleDescription(/necesita pleno sol/);
    expect(botones[1]).toHaveAccessibleDescription(/fuera de temporada/);
  });

  it("C14.3 · si aparecen varios avisos a la vez, el anuncio resume: el primero y cuántos más", async () => {
    await abrir([en("tomate", 0, 0), en("tomate", 0, 2)]);
    await elegir("Hinojo");
    await usuario().click(celda(1, 2));
    expect(anuncio()).toHaveTextContent(/Nuevo aviso: tomate junto a hinojo \(y 1 más\)\.$/);
  });

  it("C14.2 · «Ver avisos» (móvil) lleva el foco al panel y lo trae a la vista", async () => {
    await abrir([en("tomate", 0, 0), en("hinojo", 0, 1)]);
    const traer = vi.spyOn(Element.prototype, "scrollIntoView");
    await usuario().click(screen.getByRole("button", { name: "Ver avisos (1)" }));
    expect(screen.getByRole("heading", { name: "Avisos (1)" })).toHaveFocus();
    expect(traer.mock.contexts.at(-1)).toBe(screen.getByRole("heading", { name: "Avisos (1)" }));
  });
});
