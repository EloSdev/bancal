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

async function abrir(ruta: string) {
  const router = renderRuta(ruta);
  await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
  return router;
}

/** El valor (dd) que acompaña a un término (dt) de la lista de datos. */
const dato = (termino: string) => screen.getByText(termino, { selector: "dt" }).nextElementSibling?.textContent;

const zona = (nombre: string) => screen.getByRole("region", { name: nombre });

const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  responderCatalogo();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Ficha de cultivo (/cultivos/$cultivoId)", () => {
  it("C10.1 · muestra plantas por celda, sol, riego, dificultad y familia", async () => {
    await abrir("/cultivos/albahaca");
    expect(screen.getByRole("heading", { level: 1, name: "Albahaca" })).toBeInTheDocument();
    expect(dato("Plantas por celda")).toBe("4");
    expect(dato("Sol")).toBe("Pleno sol");
    expect(dato("Riego")).toBe("Medio");
    expect(dato("Dificultad")).toBe("Fácil");
    expect(dato("Familia")).toBe("Lamiáceas");
  });

  it("C10.2 · el calendario de las tres zonas dice en texto cuándo se siembra y cuándo se cosecha", async () => {
    await abrir("/cultivos/tomate");
    expect(zona("Atlántica")).toHaveTextContent(/Siembra\s*en mayo/);
    expect(zona("Atlántica")).toHaveTextContent(/Cosecha\s*de julio a septiembre/);
    expect(zona("Mediterránea")).toHaveTextContent(/Siembra\s*de abril a mayo/);
    expect(zona("Mediterránea")).toHaveTextContent(/Cosecha\s*de junio a septiembre/);
    expect(zona("Interior")).toHaveTextContent(/Siembra\s*de abril a mayo/);
  });

  it("C10.3 · compatibles e incompatibles enlazan a sus fichas, con el porqué", async () => {
    await abrir("/cultivos/tomate");
    const ayudan = screen.getByRole("list", { name: "Se ayudan" });
    expect(within(ayudan).getByRole("link", { name: "Albahaca" })).toHaveAttribute("href", "/cultivos/albahaca");
    const perjudican = screen.getByRole("list", { name: "Se perjudican" });
    expect(within(perjudican).getByRole("link", { name: "Hinojo" })).toHaveAttribute("href", "/cultivos/hinojo");
    expect(perjudican).toHaveTextContent("Se dice que el hinojo frena el crecimiento de las tomateras.");
  });

  it("C19.3 · el dibujo grande va junto al título y el pequeño junto a cada vecino", async () => {
    await abrir("/cultivos/tomate");
    const cabecera = screen.getByRole("heading", { level: 1, name: "Tomate" }).parentElement!;
    expect(cabecera.querySelector('svg[data-cultivo="tomate"]')).toHaveClass("size-12");
    const albahaca = screen.getByRole("link", { name: "Albahaca" });
    expect(albahaca.querySelector('svg[data-cultivo="albahaca"]')).toHaveClass("size-6");
  });

  it("C10.3 · seguir el enlace abre la ficha del vecino sin volver a cargar, con el foco en su título", async () => {
    const router = await abrir("/cultivos/tomate");
    await usuario().click(screen.getByRole("link", { name: "Albahaca" }));
    expect(router.state.location.pathname).toBe("/cultivos/albahaca");
    const titulo = screen.getByRole("heading", { level: 1, name: "Albahaca" });
    expect(titulo).toHaveFocus();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("C10.3 · lo que perjudica se lee antes que lo que ayuda", async () => {
    await abrir("/cultivos/tomate");
    const [primera, segunda] = screen.getAllByRole("list", { name: /Se perjudican|Se ayudan/ });
    expect(primera).toHaveAccessibleName("Se perjudican");
    expect(segunda).toHaveAccessibleName("Se ayudan");
  });

  it("C10.3 · sin vecinos destacados lo dice en una frase, en vez de dejar listas vacías", async () => {
    await abrir("/cultivos/lechuga");
    expect(screen.queryByRole("list", { name: "Se ayudan" })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Se perjudican" })).not.toBeInTheDocument();
    expect(
      screen.getByText("Ningún cultivo del catálogo lo ayuda ni lo perjudica: puedes ponerlo en cualquier sitio del bancal."),
    ).toBeInTheDocument();
  });

  it("C10.3 · con vecinos de un solo tipo, el otro dice que no hay ninguno", async () => {
    await abrir("/cultivos/hinojo");
    expect(screen.getByRole("list", { name: "Se perjudican" })).toBeInTheDocument();
    expect(screen.getByText("Ningún cultivo del catálogo lo ayuda.")).toBeInTheDocument();
  });

  it("C10.4 · un id inexistente muestra «Cultivo no encontrado» con un enlace al catálogo", async () => {
    await abrir("/cultivos/patata");
    expect(screen.getByRole("heading", { level: 1, name: "Cultivo no encontrado" })).toBeInTheDocument();
    expect(screen.getByText("No tenemos «patata» en el catálogo.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al catálogo" })).toHaveAttribute("href", "/cultivos");
    expect(screen.getByRole("link", { name: "Buscar «patata»" })).toHaveAttribute("href", "/cultivos?q=patata");
  });

  it("mientras carga se dice en una región de estado que ya existía; si falla, «Reintentar» no pierde el foco", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );
    renderRuta("/cultivos/tomate");
    const estado = await screen.findByRole("status");
    expect(estado).toHaveTextContent("Cargando la ficha…");
    await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent(/ficha/);
    expect(screen.getByRole("status")).toBe(estado);

    responderCatalogo();
    await usuario().click(within(alerta).getByRole("button", { name: "Reintentar" }));
    expect(document.activeElement).not.toBe(document.body);
    await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
    expect(screen.getByRole("heading", { level: 1, name: "Tomate" })).toHaveFocus();
  });
});
