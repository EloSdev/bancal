import { act, cleanup, screen, within } from "@testing-library/react";
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

function guardar(bancales: Bancal[], plantaciones: Record<string, Plantacion[]> = {}) {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify({ bancales, plantaciones }));
}

const guardadas = (): Plantacion[] => JSON.parse(localStorage.getItem(CLAVE_ALMACEN) ?? "{}").plantaciones?.demo ?? [];

const pasarLatencia = () => act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));

async function abrir(ruta = "/bancales/demo") {
  const router = renderRuta(ruta);
  await pasarLatencia();
  return router;
}

const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

const cuadricula = () => screen.getByRole("grid", { name: "Bancal de la demo, 3 filas por 4 columnas" });
const celda = (fila: number, columna: number) =>
  within(cuadricula()).getByRole("button", { name: new RegExp(`^Fila ${fila}, columna ${columna}:`) });
const paleta = () => screen.getByRole("toolbar", { name: "Cultivos para plantar" });
const elegir = (nombre: string) => usuario().click(within(paleta()).getByRole("button", { name: nombre }));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  guardar([bancalDemo], { demo: [en("tomate", 0, 0)] });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(cultivosDePrueba))),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Editor del bancal (/bancales/$bancalId)", () => {
  it("C13.1 · la cuadrícula tiene las filas y columnas de dimensiones() (120 × 90 → 3 × 4)", async () => {
    await abrir();
    expect(screen.getByRole("heading", { level: 1, name: "Bancal de la demo" })).toBeInTheDocument();
    expect(within(cuadricula()).getAllByRole("row")).toHaveLength(3);
    expect(within(cuadricula()).getAllByRole("gridcell")).toHaveLength(12);
  });

  it("C13.4 · cada celda tiene un nombre accesible con su posición y su cultivo", async () => {
    await abrir();
    expect(celda(1, 1)).toHaveAccessibleName("Fila 1, columna 1: tomate");
    expect(celda(3, 4)).toHaveAccessibleName("Fila 3, columna 4: vacía");
  });

  it("C13.2 · con un cultivo elegido en la paleta, hacer clic en una celda lo coloca; en una ocupada lo sustituye", async () => {
    await abrir();
    await elegir("Albahaca");
    expect(within(paleta()).getByRole("button", { name: "Albahaca" })).toHaveAttribute("aria-pressed", "true");
    await usuario().click(celda(1, 2));
    // Desde T14 el nombre dice también cómo se lleva con sus vecinos.
    expect(celda(1, 2)).toHaveAccessibleName("Fila 1, columna 2: albahaca, se ayuda con tomate");
    await usuario().click(celda(1, 1));
    expect(celda(1, 1)).toHaveAccessibleName("Fila 1, columna 1: albahaca, sin efecto con sus vecinos");
  });

  it("C13.2 · con «Quitar» elegido, hacer clic en una celda la deja vacía", async () => {
    await abrir();
    await elegir("Quitar");
    await usuario().click(celda(1, 1));
    expect(celda(1, 1)).toHaveAccessibleName("Fila 1, columna 1: vacía");
  });

  it("C13.2 · sin nada elegido, una celda no cambia y se dice qué hacer", async () => {
    await abrir();
    await usuario().click(celda(2, 2));
    expect(celda(2, 2)).toHaveAccessibleName("Fila 2, columna 2: vacía");
    expect(screen.getByRole("status", { name: "Cambios en el bancal" })).toHaveTextContent(
      "Elige primero un cultivo de la paleta.",
    );
    // También a la vista, junto a la paleta; desaparece al elegir.
    expect(screen.getByText("Elige primero un cultivo.")).toBeVisible();
    await elegir("Tomate");
    expect(screen.queryByText("Elige primero un cultivo.")).not.toBeInTheDocument();
  });

  it("C13.3 · la paleta es un solo punto de Tab y se recorre con las flechas", async () => {
    await abrir();
    const botones = within(paleta()).getAllByRole("button");
    expect(botones.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    const user = usuario();
    botones[0]!.focus();
    await user.keyboard("{ArrowRight}");
    expect(botones[1]).toHaveFocus();
    await user.keyboard("{End}");
    expect(botones.at(-1)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(botones[0]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(botones[0]).toHaveFocus();
    // Elegir con Espacio deja ese botón como el punto de Tab.
    await user.keyboard("{ArrowDown}{ }");
    expect(botones[1]).toHaveAttribute("aria-pressed", "true");
    expect(botones[1]).toHaveAttribute("tabindex", "0");
  });

  it("C13.3 · Tab entra en la cuadrícula por una sola celda y las flechas, Inicio y Fin mueven el foco", async () => {
    await abrir();
    const user = usuario();
    const conTab = within(cuadricula())
      .getAllByRole("button")
      .filter((b) => b.tabIndex === 0);
    expect(conTab).toHaveLength(1);

    celda(1, 1).focus();
    await user.keyboard("{ArrowRight}");
    expect(celda(1, 2)).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(celda(2, 2)).toHaveFocus();
    await user.keyboard("{End}");
    expect(celda(2, 4)).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(celda(2, 4)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(celda(2, 1)).toHaveFocus();
    // La celda activa es la que queda en el orden de Tab.
    expect(celda(2, 1)).toHaveAttribute("tabindex", "0");
    expect(celda(1, 1)).toHaveAttribute("tabindex", "-1");
  });

  it("C13.3 · la celda que recibe el foco se trae a la vista (la banda fija del móvil no la tapa)", async () => {
    await abrir();
    const traer = vi.spyOn(Element.prototype, "scrollIntoView");
    celda(1, 1).focus();
    await usuario().keyboard("{ArrowDown}");
    expect(traer.mock.contexts.at(-1)).toBe(celda(2, 1));
    expect(traer).toHaveBeenLastCalledWith({ block: "nearest", inline: "nearest" });
  });

  it("C13.3 · Intro coloca el cultivo elegido y Supr lo quita", async () => {
    await abrir();
    await elegir("Hinojo");
    const user = usuario();
    celda(3, 3).focus();
    await user.keyboard("{Enter}");
    expect(celda(3, 3)).toHaveAccessibleName("Fila 3, columna 3: hinojo");
    expect(screen.getByRole("status", { name: "Cambios en el bancal" })).toHaveTextContent(
      "Hinojo en la fila 3, columna 3.",
    );
    await user.keyboard("{Delete}");
    expect(celda(3, 3)).toHaveAccessibleName("Fila 3, columna 3: vacía");
    await user.keyboard("{Backspace}");
    expect(celda(3, 3)).toHaveAccessibleName("Fila 3, columna 3: vacía");
  });

  it("C13.5 · las plantaciones se guardan (con el mes de siembra por defecto de la zona) y siguen ahí al volver", async () => {
    await abrir();
    await elegir("Albahaca");
    await usuario().click(celda(2, 3));
    await pasarLatencia();
    expect(guardadas()).toEqual([en("tomate", 0, 0), en("albahaca", 1, 2, 5)]);
    expect(screen.getByText(/· Guardado$/)).toBeInTheDocument();

    cleanup();
    await abrir();
    expect(celda(2, 3)).toHaveAccessibleName("Fila 2, columna 3: albahaca");
  });

  it("C13.5 · si no se puede guardar, lo dice con role=alert y lo plantado sigue en pantalla", async () => {
    await abrir();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Cuota llena", "QuotaExceededError");
    });
    await elegir("Albahaca");
    await usuario().click(celda(2, 3));
    await pasarLatencia();
    expect(screen.getByRole("alert")).toHaveTextContent("No se han podido guardar los cambios");
    expect(celda(2, 3)).toHaveAccessibleName("Fila 2, columna 3: albahaca");

    // «Reintentar» desaparece al pulsarlo: el foco vuelve a la celda activa.
    vi.mocked(Storage.prototype.setItem).mockRestore();
    await usuario().click(within(screen.getByRole("alert")).getByRole("button", { name: "Reintentar" }));
    expect(celda(2, 3)).toHaveFocus();
    await pasarLatencia();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(guardadas()).toEqual([en("tomate", 0, 0), en("albahaca", 1, 2, 5)]);
  });

  it("quitar de una celda vacía no guarda nada y lo dice", async () => {
    await abrir();
    await elegir("Quitar");
    await usuario().click(celda(3, 3));
    expect(screen.queryByText("Guardando…")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Cambios en el bancal" })).toHaveTextContent(
      "La fila 3, columna 3 ya está vacía.",
    );
  });

  it("la paleta es una región con nombre", async () => {
    await abrir();
    expect(screen.getByRole("complementary", { name: "Elige qué plantar" })).toContainElement(paleta());
  });

  it("un bancal que no existe dice «Bancal no encontrado» con un enlace a la lista", async () => {
    await abrir("/bancales/no-existe");
    expect(screen.getByRole("heading", { level: 1, name: "Bancal no encontrado" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Volver a mis bancales" })).toHaveAttribute("href", "/bancales");
  });

  it("enlaza a editar las medidas del bancal", async () => {
    await abrir();
    expect(screen.getByRole("link", { name: "Editar medidas" })).toHaveAttribute("href", "/bancales/demo/editar");
  });
});
