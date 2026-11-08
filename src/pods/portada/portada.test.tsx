import { act, cleanup, screen, within } from "@testing-library/react";
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
  vi.restoreAllMocks();
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

describe("Notas de la foto (T23)", () => {
  /** La nota que contiene un texto: el <p> entero (lleva icono, mes y texto). */
  const nota = (texto: RegExp) => screen.getByText(texto).closest("p")!;

  it("C24.1 · la nota del mes dice el mes actual y su consejo genérico, sin zona, con su dibujo", async () => {
    vi.setSystemTime(new Date(2026, 10, 8));
    await abrir("/");

    const delMes = nota(/^Toca sembrar habas y guisantes$/);
    expect(delMes).toHaveTextContent(/^noviembre/i);
    expect(delMes).not.toHaveTextContent(/zona/i);
    expect(delMes.querySelector('[data-cultivo="haba"]')).not.toBeNull();
  });

  it("C24.1 · cada mes tiene su consejo", async () => {
    vi.setSystemTime(new Date(2026, 4, 15));
    await abrir("/");

    expect(nota(/^Es el mes del tomate/)).toHaveTextContent(/^mayo/i);
  });

  it("C23.3 · las notas de vecinos son parejas reales del catálogo", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    await abrir("/");

    expect(nota(/se ayudan$/)).toHaveTextContent("Tomate y albahaca se ayudan");
    expect(nota(/se perjudican$/)).toHaveTextContent("Tomate e hinojo se perjudican");
  });

  it("C23.3 · cada vez que se abre la portada, la pareja se elige al azar", async () => {
    // Una segunda pareja que se ayuda, para que haya entre qué elegir.
    const conOtraPareja = cultivosDePrueba.map((c) =>
      c.id === "lechuga" ? { ...c, compatibles: [{ cultivoId: "ajo", motivo: "Prueba." }] } : c,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(conOtraPareja))),
    );

    const azar = vi.spyOn(Math, "random").mockReturnValue(0);
    await abrir("/");
    expect(nota(/se ayudan$/)).toHaveTextContent("Tomate y albahaca se ayudan");

    cleanup();
    azar.mockReturnValue(0.99);
    await abrir("/");
    expect(nota(/se ayudan$/)).toHaveTextContent("Lechuga y ajo se ayudan");
  });

  it("C23.4 · mientras el catálogo no ha llegado, las notas de vecinos no se pintan; la del mes, sí (no lo necesita)", async () => {
    vi.setSystemTime(new Date(2026, 10, 8));
    renderRuta("/");
    await screen.findByRole("heading", { level: 1 });

    expect(screen.queryByText(/se ayudan$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/se perjudican$/)).not.toBeInTheDocument();
    expect(screen.getByText(/^Toca sembrar habas y guisantes$/)).toBeInTheDocument();
  });
});

describe("Fotos (C20.6)", () => {
  it("C20.6 · la portada lleva fotos reales, cada una con alt descriptivo y srcset", async () => {
    await abrir("/");
    const fotos = screen.getAllByRole("img").filter((el) => el.tagName === "IMG");

    expect(fotos.length).toBeGreaterThanOrEqual(4);
    for (const foto of fotos) {
      expect(foto.getAttribute("alt")?.length).toBeGreaterThan(10);
      expect(foto).toHaveAttribute("srcset", expect.stringMatching(/1600w/));
      expect(foto).toHaveAttribute("src", expect.stringMatching(/^\/img\/portada\/.+\.webp$/));
    }
  });

  it("C20.6 · el pie cita a los autores de las fotos y la licencia de Unsplash", async () => {
    await abrir("/");
    const pie = screen.getByRole("contentinfo");

    expect(within(pie).getByRole("link", { name: /licencia de unsplash/i })).toHaveAttribute(
      "href",
      "https://unsplash.com/license",
    );
    expect(pie).toHaveTextContent(/Markus Spiske/);
    expect(pie).toHaveTextContent(/Jonathan Kemper/);
    expect(pie).toHaveTextContent(/Zoe Richardson/);
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
