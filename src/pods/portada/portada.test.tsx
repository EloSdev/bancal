import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import catalogoJson from "../../../public/crops.json";
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

const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

// El aviso del bancal de ejemplo copia el motivo REAL del catálogo: si cambia
// el dato, este test lo señala (la portada no espera a la carga para pintarse).
const motivoHinojoTomate = (catalogoJson as { id: string; incompatibles: { cultivoId: string; motivo: string }[] }[])
  .find((c) => c.id === "tomate")
  ?.incompatibles.find((r) => r.cultivoId === "hinojo")?.motivo;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  responderCatalogo();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Portada (/)", () => {
  it("C20.1 · dice qué es Bancal y ofrece crear el primer bancal o explorar los cultivos", async () => {
    await abrir("/");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/bancal/i);
    expect(screen.getByRole("link", { name: "Crear mi primer bancal" })).toHaveAttribute("href", "/bancales/nuevo");
    expect(screen.getByRole("link", { name: "Explorar cultivos" })).toHaveAttribute("href", "/cultivos");
  });

  it("C20.1 · el logo de la cabecera lleva a la portada", async () => {
    await abrir("/cultivos");
    await usuario().click(screen.getByRole("link", { name: "Bancal" }));
    await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));

    expect(screen.getByRole("link", { name: "Crear mi primer bancal" })).toBeInTheDocument();
  });

  it("C20.2 · enseña un bancal de ejemplo a tinta, descrito en texto, con marcas de forma propia y el aviso del hinojo", async () => {
    await abrir("/");
    const ejemplo = screen.getByRole("figure", { name: /bancal de ejemplo de 120 × 90 cm/i });

    // El dibujo es decorativo: lo dice el pie de la figura.
    expect(within(ejemplo).getByText(/tomate/i, { selector: "figcaption" })).toBeInTheDocument();
    expect(ejemplo.querySelector('[data-forma="rombo"]')).not.toBeNull();
    expect(ejemplo.querySelector('[data-forma="circulo"]')).not.toBeNull();
    expect(ejemplo.querySelector('[data-cultivo="hinojo"]')).not.toBeNull();

    expect(motivoHinojoTomate).toBeDefined();
    expect(within(ejemplo).getByText("Hinojo junto a tomate")).toBeInTheDocument();
    expect(within(ejemplo).getByText(motivoHinojoTomate!)).toBeInTheDocument();
  });

  it("C20.3 · «Cómo funciona» en tres pasos", async () => {
    await abrir("/");
    const seccion = screen.getByRole("region", { name: "Cómo funciona" });

    expect(within(seccion).getAllByRole("listitem")).toHaveLength(3);
  });

  it("C20.3 · la tira de cultivos enlaza cada cultivo del catálogo con su ficha", async () => {
    await abrir("/");
    const tira = screen.getByRole("list", { name: "Cultivos del catálogo" });
    const enlaces = within(tira).getAllByRole("link");

    expect(enlaces).toHaveLength(cultivosDePrueba.length);
    expect(within(tira).getByRole("link", { name: "Tomate" })).toHaveAttribute("href", "/cultivos/tomate");
  });

  it("C20.3 · mientras carga la tira se dice, y si falla se puede reintentar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );
    renderRuta("/");
    expect(await screen.findByText("Cargando los cultivos…")).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));

    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent(/cultivos/);
    responderCatalogo();
    await usuario().click(within(alerta).getByRole("button", { name: "Reintentar" }));
    await act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));
    expect(screen.getByRole("list", { name: "Cultivos del catálogo" })).toBeInTheDocument();
  });
});

describe("Pie", () => {
  it.each(["/", "/cultivos", "/bancales"])("C20.4 · %s tiene un pie con el contexto del curso, los datos y el código", async (ruta) => {
    await abrir(ruta);
    const pie = screen.getByRole("contentinfo");

    expect(pie).toHaveTextContent(/Front End Moderno y Herramientas IA/);
    expect(pie).toHaveTextContent(/Fundación Luckia/);
    expect(pie).toHaveTextContent(/Lemoncode/);
    expect(pie).toHaveTextContent(/fuentes/i);
    expect(within(pie).getByRole("link", { name: /código/i })).toHaveAttribute("href", "https://github.com/EloSdev/bancal");
    // No repite la navegación: el único aria-current sigue en la cabecera (C1.5).
    expect(within(pie).queryByRole("link", { name: "Mis bancales" })).not.toBeInTheDocument();
  });
});
