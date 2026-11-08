import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cultivosDePrueba } from "../../core/__fixtures__/cultivos";
import { LATENCIA_MS } from "../../core/comun/api";
import { renderRuta } from "../../test/render-ruta";

const responderCatalogo = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(cultivosDePrueba))),
  );

/** Renderiza la ruta y deja pasar la latencia simulada de la api. */
async function abrir(ruta: string) {
  const router = renderRuta(ruta);
  await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
  return router;
}

const nombresListados = () =>
  within(screen.getByRole("list", { name: "Cultivos" }))
    .getAllByRole("listitem")
    .map((li) => within(li).getByRole("link").textContent);

const busqueda = () => screen.getByRole("searchbox", { name: "Buscar por nombre" });

const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  responderCatalogo();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Catálogo (/cultivos)", () => {
  it("C9.1 · lista los cultivos en orden alfabético con nombre, sol y dificultad, y cada uno enlaza a su ficha", async () => {
    await abrir("/cultivos");
    expect(nombresListados()).toEqual(["Ajo", "Albahaca", "Hinojo", "Lechuga", "Tomate"]);

    const lechuga = screen.getByRole("link", { name: "Lechuga" });
    expect(lechuga).toHaveAttribute("href", "/cultivos/lechuga");
    const fila = lechuga.closest("li")!;
    expect(fila).toHaveTextContent("Semisombra");
    expect(fila).toHaveTextContent("Fácil");
  });

  it("C19.3 · cada cultivo lleva su dibujo junto al nombre (decorativo: el enlace se sigue llamando como el cultivo)", async () => {
    await abrir("/cultivos");
    const tomate = screen.getByRole("link", { name: "Tomate" });
    expect(tomate.querySelector('svg[data-cultivo="tomate"][aria-hidden="true"]')).toHaveClass("size-6");
  });

  it("C9.1 · cada cultivo dice cuándo se siembra en la zona elegida, y la lista dice qué zona es", async () => {
    await abrir("/cultivos?zona=mediterranea");
    const tomate = screen.getByRole("link", { name: "Tomate" }).closest("li")!;
    expect(tomate).toHaveTextContent("Se siembra de abril a mayo");
    expect(screen.getByText("Meses de siembra en la zona mediterránea")).toBeInTheDocument();
  });

  it("C9.2 · buscar por nombre filtra la lista y actualiza la URL sin perder letras", async () => {
    const router = await abrir("/cultivos");
    await usuario().type(busqueda(), "toma");
    expect(busqueda()).toHaveValue("toma");
    expect(nombresListados()).toEqual(["Tomate"]);
    expect(router.state.location.search).toEqual({ q: "toma" });
  });

  it("C9.2 · los filtros de sol, mes y zona actualizan la URL", async () => {
    const router = await abrir("/cultivos");
    const user = usuario();
    await user.selectOptions(screen.getByRole("combobox", { name: "Se siembra en" }), "abril");
    await user.selectOptions(screen.getByRole("combobox", { name: "Zona" }), "Mediterránea");
    expect(nombresListados()).toEqual(["Tomate"]);
    expect(router.state.location.search).toEqual({ temporada: 4, zona: "mediterranea" });

    await user.selectOptions(screen.getByRole("combobox", { name: "Sol que necesita" }), "Semisombra");
    expect(router.state.location.search).toEqual({ temporada: 4, zona: "mediterranea", sol: "semisombra" });
  });

  // Ojo: en jsdom userEvent espera entre acciones y el router ya ha confirmado
  // la búsqueda; no reproduce la carrera del navegador real (por eso la escena
  // navega con `prev`). Queda como test de regresión del resultado.
  it("C9.2 · escribir y cambiar enseguida un desplegable conserva las dos cosas en la URL", async () => {
    const router = await abrir("/cultivos");
    const user = usuario();
    await user.type(busqueda(), "a");
    await user.selectOptions(screen.getByRole("combobox", { name: "Se siembra en" }), "mayo");
    expect(router.state.location.search).toEqual({ q: "a", temporada: 5 });
    expect(busqueda()).toHaveValue("a");
  });

  it("C9.2 · si la búsqueda cambia desde fuera (enlace «Cultivos» de la cabecera), el campo se vacía", async () => {
    const router = await abrir("/cultivos?q=toma");
    expect(busqueda()).toHaveValue("toma");
    const nav = screen.getByRole("navigation", { name: "Principal" });
    await usuario().click(within(nav).getByRole("link", { name: "Cultivos" }));
    expect(router.state.location.search).toEqual({});
    expect(busqueda()).toHaveValue("");
    expect(nombresListados()).toHaveLength(5);
  });

  it("C9.2 · al abrir (o recargar) una URL con filtros, se ve el mismo resultado", async () => {
    await abrir("/cultivos?temporada=4&zona=mediterranea");
    expect(nombresListados()).toEqual(["Tomate"]);
    expect(screen.getByRole("combobox", { name: "Se siembra en" })).toHaveDisplayValue("abril");
    expect(screen.getByRole("combobox", { name: "Zona" })).toHaveDisplayValue("Mediterránea");
  });

  it("C9.2 · «Quitar filtros» deja la zona, vacía la búsqueda y lleva el foco al campo de búsqueda", async () => {
    const router = await abrir("/cultivos?q=toma&sol=pleno-sol&zona=interior");
    await usuario().click(screen.getByRole("button", { name: "Quitar filtros" }));
    expect(router.state.location.search).toEqual({ zona: "interior" });
    expect(busqueda()).toHaveValue("");
    expect(busqueda()).toHaveFocus();
    expect(nombresListados()).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "Quitar filtros" })).not.toBeInTheDocument();
  });

  it("C9.3 · parámetros inválidos se ignoran sin romper la página", async () => {
    await abrir("/cultivos?sol=xyz&temporada=13&zona=marte");
    expect(screen.getByRole("heading", { level: 1, name: "Cultivos" })).toBeInTheDocument();
    expect(nombresListados()).toHaveLength(5);
    expect(screen.getByRole("combobox", { name: "Sol que necesita" })).toHaveDisplayValue("Cualquiera");
    expect(screen.getByRole("combobox", { name: "Se siembra en" })).toHaveDisplayValue("Cualquiera");
  });

  it("C9.4 · mientras carga se dice, y no se enseña una lista vacía", async () => {
    renderRuta("/cultivos");
    expect(await screen.findByRole("status")).toHaveTextContent("Cargando el catálogo…");
    expect(screen.queryByRole("list", { name: "Cultivos" })).not.toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
    expect(screen.getByRole("list", { name: "Cultivos" })).toBeInTheDocument();
  });

  it("C9.4 · si falla la carga, sale un error con role=alert; al reintentar, el foco no se pierde", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );
    await abrir("/cultivos");
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent(/catálogo/);
    expect(alerta).not.toHaveTextContent(/HTTP/);

    responderCatalogo();
    await usuario().click(within(alerta).getByRole("button", { name: "Reintentar" }));
    expect(busqueda()).toHaveFocus();
    await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(nombresListados()).toHaveLength(5);
  });

  it("C9.4 · sin resultados dice qué no se ha encontrado, con un único «Quitar filtros»", async () => {
    await abrir("/cultivos?q=zzz");
    expect(screen.getByText("Ningún cultivo se llama «zzz».")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Cultivos" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Quitar filtros" })).toHaveLength(1);
  });

  it("C9.4 · sin resultados por mes y sol, el mensaje nombra el sol, el mes y la zona", async () => {
    await abrir("/cultivos?sol=sombra&temporada=3&zona=interior");
    expect(screen.getByText("Ningún cultivo que necesite sombra se siembra en marzo en la zona interior.")).toBeInTheDocument();
  });

  it("C9.5 · el número de resultados se anuncia en una región de estado que existe desde el principio", async () => {
    renderRuta("/cultivos");
    const estado = await screen.findByRole("status");
    expect(estado).toHaveAttribute("aria-live", "polite");
    await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
    expect(estado).toHaveTextContent("5 cultivos");

    await usuario().type(busqueda(), "toma");
    expect(screen.getByRole("status")).toBe(estado);
    expect(estado).toHaveTextContent("1 de 5 cultivos");
  });
});
