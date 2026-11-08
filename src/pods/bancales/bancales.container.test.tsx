import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bancalDemo } from "../../core/__fixtures__/bancales";
import { cultivosDePrueba } from "../../core/__fixtures__/cultivos";
import { CLAVE_ALMACEN, CLAVE_DESCARTADOS } from "../../core/bancales/api";
import type { Bancal, Plantacion } from "../../core/bancales/model";
import { LATENCIA_MS } from "../../core/comun/api";
import { renderRuta } from "../../test/render-ruta";

const patio: Bancal = { id: "patio", nombre: "Patio", ancho: 60, largo: 60, horasSol: 4, zona: "interior" };
const terraza: Bancal = { id: "terraza", nombre: "Terraza", ancho: 90, largo: 30, horasSol: 7, zona: "atlantica" };

const en = (cultivoId: string, fila: number, columna: number): Plantacion => ({
  cultivoId,
  celda: { fila, columna },
  mesSiembra: 5,
});

function guardar(bancales: Bancal[], plantaciones: Record<string, Plantacion[]> = {}) {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify({ bancales, plantaciones }));
}

const pasarLatencia = () => act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));

async function abrir() {
  const router = renderRuta("/bancales");
  await pasarLatencia();
  return router;
}

const filas = () => within(screen.getByRole("list", { name: "Bancales" })).getAllByRole("listitem");

const tarjeta = (nombre: string) => screen.getByRole("link", { name: nombre }).closest("li")!;

const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

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
  vi.restoreAllMocks();
});

describe("Mis bancales (/bancales)", () => {
  it("C11.1 · cada bancal muestra nombre, medidas, celdas, celdas plantadas y avisos pendientes", async () => {
    guardar([bancalDemo, patio], { [bancalDemo.id]: [en("tomate", 0, 0), en("hinojo", 0, 1), en("albahaca", 2, 3)] });
    await abrir();

    expect(filas()).toHaveLength(2);

    const demo = tarjeta("Bancal de la demo");
    expect(screen.getByRole("link", { name: "Bancal de la demo" })).toHaveAttribute("href", "/bancales/demo");
    expect(demo).toHaveTextContent("120 × 90 cm");
    expect(demo).toHaveTextContent("4 × 3 celdas");
    expect(demo).toHaveTextContent("3 de 12 plantadas");
    expect(demo).toHaveTextContent("1 aviso");

    const otro = tarjeta("Patio");
    expect(otro).toHaveTextContent("60 × 60 cm");
    expect(otro).toHaveTextContent("2 × 2 celdas");
    expect(otro).toHaveTextContent("0 de 4 plantadas");
    expect(otro).toHaveTextContent("Sin avisos");
  });

  it("C11.1 · con bancales, hay un enlace para crear otro", async () => {
    guardar([bancalDemo]);
    await abrir();
    expect(screen.getByRole("link", { name: "Nuevo bancal" })).toHaveAttribute("href", "/bancales/nuevo");
  });

  it("C11.2 · sin bancales, estado vacío con «Crear mi primer bancal»", async () => {
    await abrir();
    expect(screen.getByText("Aún no tienes bancales.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear mi primer bancal" })).toHaveAttribute("href", "/bancales/nuevo");
    expect(screen.queryByRole("list", { name: "Bancales" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Nuevo bancal" })).not.toBeInTheDocument();
  });

  it("C11.3 · borrar pide confirmación; conservar no borra y devuelve el foco al botón", async () => {
    guardar([bancalDemo, patio], { [bancalDemo.id]: [en("tomate", 0, 0)] });
    await abrir();
    const user = usuario();
    const borrar = within(tarjeta("Bancal de la demo")).getByRole("button", { name: "Borrar «Bancal de la demo»" });
    await user.click(borrar);

    const dialogo = screen.getByRole("dialog", { name: "¿Borrar «Bancal de la demo»?" });
    expect(dialogo).toHaveTextContent("Se borrará también su 1 plantación.");
    expect(within(dialogo).getByRole("button", { name: "Conservar bancal" })).toHaveFocus();

    await user.click(within(dialogo).getByRole("button", { name: "Conservar bancal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(borrar).toHaveFocus();
    expect(filas()).toHaveLength(2);
    expect(localStorage.getItem(CLAVE_ALMACEN)).toContain("Bancal de la demo");
  });

  it("C11.3 · confirmar borra el bancal, lo anuncia y lleva el foco al siguiente de la lista", async () => {
    guardar([bancalDemo, patio, terraza]);
    await abrir();
    const user = usuario();
    await user.click(within(tarjeta("Patio")).getByRole("button", { name: "Borrar «Patio»" }));
    const dialogo = screen.getByRole("dialog");
    await user.click(within(dialogo).getByRole("button", { name: "Borrar bancal" }));

    // Mientras dura la latencia, el botón no se puede volver a pulsar.
    expect(within(dialogo).getByRole("button", { name: "Borrando…" })).toHaveAttribute("aria-disabled", "true");
    await pasarLatencia();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Patio" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terraza" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("«Patio» borrado. Quedan 2 bancales.");
    expect(localStorage.getItem(CLAVE_ALMACEN)).not.toContain("Patio");
    // Sin recargar: la lista no vuelve a «cargando».
    expect(filas()).toHaveLength(2);
  });

  it("C11.3 · al borrar el último de la lista, el foco va al anterior", async () => {
    guardar([bancalDemo, patio]);
    await abrir();
    const user = usuario();
    await user.click(within(tarjeta("Patio")).getByRole("button", { name: "Borrar «Patio»" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Borrar bancal" }));
    await pasarLatencia();
    expect(screen.getByRole("link", { name: "Bancal de la demo" })).toHaveFocus();
  });

  it("C11.3 · al borrar el único bancal, el foco va a «Crear mi primer bancal»", async () => {
    guardar([bancalDemo]);
    await abrir();
    const user = usuario();
    await user.click(screen.getByRole("button", { name: "Borrar «Bancal de la demo»" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Borrar bancal" }));
    await pasarLatencia();
    expect(screen.getByRole("link", { name: "Crear mi primer bancal" })).toHaveFocus();
  });

  it("C11.3 · si no se puede borrar, el diálogo sigue abierto y lo explica", async () => {
    guardar([bancalDemo]);
    await abrir();
    const user = usuario();
    await user.click(screen.getByRole("button", { name: "Borrar «Bancal de la demo»" }));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Cuota llena", "QuotaExceededError");
    });
    const dialogo = screen.getByRole("dialog");
    await user.click(within(dialogo).getByRole("button", { name: "Borrar bancal" }));
    await pasarLatencia();
    expect(within(dialogo).getByRole("alert")).toHaveTextContent("No se ha podido borrar");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // El botón no se deshabilita (perdería el foco): se marca aria-disabled mientras borra.
    const confirmar = within(dialogo).getByRole("button", { name: "Borrar bancal" });
    expect(confirmar).toHaveFocus();
    expect(confirmar).not.toHaveAttribute("disabled");
    expect(screen.getByRole("link", { name: "Bancal de la demo" })).toBeInTheDocument();
  });

  it("C11.4 · si los datos guardados estaban dañados, lo avisa; al cerrar el aviso se borra la copia", async () => {
    localStorage.setItem(CLAVE_ALMACEN, "{ esto no es json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await abrir();
    const aviso = screen.getByRole("alert");
    expect(aviso).toHaveTextContent("no se han podido leer");
    expect(screen.getByText("Aún no tienes bancales.")).toBeInTheDocument();

    await usuario().click(within(aviso).getByRole("button", { name: "Entendido" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(localStorage.getItem(CLAVE_DESCARTADOS)).toBeNull();
    // El aviso desaparece: el foco pasa al siguiente paso, no a <body>.
    expect(screen.getByRole("link", { name: "Crear mi primer bancal" })).toHaveFocus();
  });

  it("mientras carga se dice en una región de estado; si falla, hay un error con «Reintentar»", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Acceso denegado", "SecurityError");
    });
    renderRuta("/bancales");
    const estado = await screen.findByRole("status");
    expect(estado).toHaveTextContent("Cargando tus bancales…");
    await pasarLatencia();
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("No se han podido cargar tus bancales.");

    vi.mocked(Storage.prototype.getItem).mockRestore();
    await usuario().click(within(alerta).getByRole("button", { name: "Reintentar" }));
    expect(document.activeElement).not.toBe(document.body);
    await pasarLatencia();
    expect(screen.getByText("Aún no tienes bancales.")).toBeInTheDocument();
  });
});
