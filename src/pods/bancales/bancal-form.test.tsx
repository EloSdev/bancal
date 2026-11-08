import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bancalDemo } from "../../core/__fixtures__/bancales";
import { CLAVE_ALMACEN } from "../../core/bancales/api";
import type { Bancal, Plantacion } from "../../core/bancales/model";
import { LATENCIA_MS } from "../../core/comun/api";
import { renderRuta } from "../../test/render-ruta";

const en = (fila: number, columna: number): Plantacion => ({ cultivoId: "tomate", celda: { fila, columna }, mesSiembra: 5 });

function guardar(bancales: Bancal[], plantaciones: Record<string, Plantacion[]> = {}) {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify({ bancales, plantaciones }));
}

const guardado = (): { bancales: Bancal[]; plantaciones: Record<string, Plantacion[]> } =>
  JSON.parse(localStorage.getItem(CLAVE_ALMACEN) ?? "{}");

const pasarLatencia = () => act(() => vi.advanceTimersByTimeAsync(LATENCIA_MS));

const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

/** El router pinta la ruta de forma asíncrona: se espera al título. */
async function abrirNuevo() {
  const router = renderRuta("/bancales/nuevo");
  await screen.findByRole("heading", { level: 1, name: "Nuevo bancal" });
  return router;
}

const campo = (etiqueta: string) => screen.getByLabelText(etiqueta);

async function escribir(etiqueta: string, texto: string) {
  const user = usuario();
  await user.clear(campo(etiqueta));
  if (texto) await user.type(campo(etiqueta), texto);
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Alta de bancal (/bancales/nuevo)", () => {
  it("C12.1 · tiene nombre, ancho, largo, horas de sol y zona (atlántica por defecto)", async () => {
    await abrirNuevo();
    expect(campo("Nombre")).toHaveValue("");
    expect(campo("Ancho (cm)")).toHaveValue(120);
    expect(campo("Largo (cm)")).toHaveValue(90);
    expect(campo("Horas de sol al día")).toHaveValue(null);
    expect(campo("Zona climática")).toHaveDisplayValue("Atlántica");
  });

  it("C12.1 · C12.4 · al crear, guarda el bancal (nombre recortado) y navega a su editor", async () => {
    const router = await abrirNuevo();
    await escribir("Nombre", "  Balcón  ");
    await escribir("Ancho (cm)", "60");
    await escribir("Horas de sol al día", "4.5");
    await usuario().selectOptions(campo("Zona climática"), "Mediterránea");
    await usuario().click(screen.getByRole("button", { name: "Crear bancal" }));
    await pasarLatencia();

    const [creado] = guardado().bancales;
    expect(creado).toEqual({ id: expect.any(String), nombre: "Balcón", ancho: 60, largo: 90, horasSol: 4.5, zona: "mediterranea" });
    expect(router.state.location.pathname).toBe(`/bancales/${creado!.id}`);
  });

  it("al llegar, el foco va al título de la pantalla", async () => {
    await abrirNuevo();
    expect(screen.getByRole("heading", { level: 1, name: "Nuevo bancal" })).toHaveFocus();
  });

  it("C12.2 · cada campo tiene su etiqueta y una pista enlazada", async () => {
    await abrirNuevo();
    expect(campo("Ancho (cm)")).toHaveAccessibleDescription(/De 30 a 300 cm/);
    expect(campo("Horas de sol al día")).toHaveAccessibleDescription(/De 0 a 24/);
  });

  it("C12.2 · un campo tocado muestra su error enlazado con aria-describedby y aria-invalid", async () => {
    await abrirNuevo();
    expect(screen.queryByText(/El ancho mínimo/)).not.toBeInTheDocument();
    await escribir("Ancho (cm)", "20");
    await usuario().tab();
    expect(campo("Ancho (cm)")).toHaveAttribute("aria-invalid", "true");
    expect(campo("Ancho (cm)")).toHaveAccessibleDescription(/El ancho mínimo es 30 cm \(una celda\)\./);
    // Los que no se han tocado no enseñan error.
    expect(campo("Nombre")).toHaveAttribute("aria-invalid", "false");
  });

  it("C12.2 · al enviar con errores salen todos, no se guarda nada y el foco va al primero", async () => {
    await abrirNuevo();
    await usuario().click(screen.getByRole("button", { name: "Crear bancal" }));
    expect(campo("Nombre")).toHaveAccessibleDescription(/Ponle un nombre al bancal\./);
    expect(campo("Horas de sol al día")).toHaveAccessibleDescription(/Indica las horas de sol al día\./);
    expect(campo("Nombre")).toHaveFocus();
    await pasarLatencia();
    expect(localStorage.getItem(CLAVE_ALMACEN)).toBeNull();
  });

  it("C12.3 · la vista previa dice en vivo cuántas celdas salen y qué exposición", async () => {
    await abrirNuevo();
    const vista = screen.getByRole("status");
    expect(vista).toHaveTextContent("4 × 3 celdas");
    await escribir("Ancho (cm)", "300");
    expect(vista).toHaveTextContent("10 × 3 celdas");
    expect(vista).toHaveTextContent("sol por decidir");
    await escribir("Horas de sol al día", "6");
    expect(vista).toHaveTextContent("pleno sol");
    await escribir("Largo (cm)", "10");
    expect(vista).toHaveTextContent("Corrige las medidas para ver el bancal.");
  });

  it("C12.5 · mientras guarda, el botón está deshabilitado (aria-disabled, sin perder el foco), dice «Guardando…» y no guarda dos veces", async () => {
    await abrirNuevo();
    await escribir("Nombre", "Patio");
    await escribir("Horas de sol al día", "8");
    const user = usuario();
    await user.click(screen.getByRole("button", { name: "Crear bancal" }));
    const boton = screen.getByRole("button", { name: "Guardando…" });
    expect(boton).toHaveAttribute("aria-disabled", "true");
    expect(boton).toHaveFocus();
    await user.click(boton);
    await pasarLatencia();
    expect(guardado().bancales).toHaveLength(1);
  });

  it("si no se puede guardar, lo dice con role=alert y el formulario sigue ahí", async () => {
    await abrirNuevo();
    await escribir("Nombre", "Patio");
    await escribir("Horas de sol al día", "8");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Cuota llena", "QuotaExceededError");
    });
    await usuario().click(screen.getByRole("button", { name: "Crear bancal" }));
    await pasarLatencia();
    expect(screen.getByRole("alert")).toHaveTextContent("No se ha podido guardar");
    expect(campo("Nombre")).toHaveValue("Patio");
    expect(screen.getByRole("button", { name: "Crear bancal" })).toHaveAttribute("aria-disabled", "false");
  });

  it("C12.5 · salir mientras guarda cancela el guardado: no se crea nada ni se navega después", async () => {
    const router = await abrirNuevo();
    await escribir("Nombre", "Patio");
    await escribir("Horas de sol al día", "8");
    const user = usuario();
    await user.click(screen.getByRole("button", { name: "Crear bancal" }));
    await user.click(screen.getByRole("link", { name: "Cancelar" }));
    await pasarLatencia();
    expect(router.state.location.pathname).toBe("/bancales");
    expect(localStorage.getItem(CLAVE_ALMACEN)).toBeNull();
  });

  it("C12.2 · los campos obligatorios lo dicen (aria-required)", async () => {
    await abrirNuevo();
    for (const etiqueta of ["Nombre", "Ancho (cm)", "Largo (cm)", "Horas de sol al día", "Zona climática"]) {
      expect(campo(etiqueta)).toBeRequired();
    }
  });
});

describe("Edición de bancal (/bancales/$bancalId/editar)", () => {
  it("C12.4 · carga los valores, guarda los cambios y navega al editor conservando las plantaciones que caben", async () => {
    guardar([bancalDemo], { [bancalDemo.id]: [en(0, 0), en(2, 3)] });
    const router = renderRuta("/bancales/demo/editar");
    await pasarLatencia();
    expect(screen.getByRole("heading", { level: 1, name: "Editar «Bancal de la demo»" })).toBeInTheDocument();
    expect(campo("Nombre")).toHaveValue("Bancal de la demo");
    expect(campo("Ancho (cm)")).toHaveValue(120);

    await escribir("Nombre", "Bancal grande");
    await escribir("Largo (cm)", "120");
    await usuario().click(screen.getByRole("button", { name: "Guardar cambios" }));
    await pasarLatencia();

    expect(router.state.location.pathname).toBe("/bancales/demo");
    expect(guardado().bancales).toEqual([{ ...bancalDemo, nombre: "Bancal grande", largo: 120 }]);
    expect(guardado().plantaciones.demo).toEqual([en(0, 0), en(2, 3)]);
  });

  it("C12.6 · al encoger, avisa de cuántas plantaciones se quitarán antes de guardar; al guardar se quitan", async () => {
    guardar([bancalDemo], { [bancalDemo.id]: [en(0, 0), en(0, 3), en(2, 3)] });
    renderRuta("/bancales/demo/editar");
    await pasarLatencia();
    expect(screen.queryByText(/se quitar/)).not.toBeInTheDocument();

    await escribir("Ancho (cm)", "90");
    expect(screen.getByText("Al guardar se quitarán 2 plantaciones que quedan fuera del bancal.")).toBeInTheDocument();
    // También lo oye quien usa lector: en la región de estado y al llegar al botón.
    expect(screen.getByRole("status")).toHaveTextContent("se quitarán 2 plantaciones");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toHaveAccessibleDescription(
      "Al guardar se quitarán 2 plantaciones que quedan fuera del bancal.",
    );
    await escribir("Ancho (cm)", "60");
    await escribir("Largo (cm)", "30");
    expect(screen.getByText("Al guardar se quitarán 2 plantaciones que quedan fuera del bancal.")).toBeInTheDocument();
    await escribir("Ancho (cm)", "120");
    await escribir("Largo (cm)", "60");
    expect(screen.getByText("Al guardar se quitará 1 plantación que queda fuera del bancal.")).toBeInTheDocument();

    await usuario().click(screen.getByRole("button", { name: "Guardar cambios" }));
    await pasarLatencia();
    expect(guardado().plantaciones.demo).toEqual([en(0, 0), en(0, 3)]);
  });

  it("un bancal que no existe dice «Bancal no encontrado» con un enlace a la lista", async () => {
    renderRuta("/bancales/no-existe/editar");
    await pasarLatencia();
    expect(screen.getByRole("heading", { level: 1, name: "Bancal no encontrado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a mis bancales" })).toHaveAttribute("href", "/bancales");
  });
});
