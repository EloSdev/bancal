import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";

const renderEn = (ruta: string) => {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [ruta] }) });
  render(<RouterProvider router={router} />);
  return router;
};

describe("AppLayout", () => {
  it("C1.2 · C1.5 · la cabecera enlaza a Cultivos y Mis bancales y marca la ruta activa", async () => {
    renderEn("/bancales");

    const nav = await screen.findByRole("navigation", { name: "Principal" });
    const misBancales = within(nav).getByRole("link", { name: "Mis bancales" });
    const cultivos = within(nav).getByRole("link", { name: "Cultivos" });

    expect(misBancales).toHaveAttribute("aria-current", "page");
    expect(cultivos).not.toHaveAttribute("aria-current");
  });

  it("C1.5 · solo el enlace de la navegación lleva aria-current (el logo no)", async () => {
    renderEn("/bancales");
    await screen.findByRole("navigation", { name: "Principal" });

    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it("C1.4 · / redirige a /bancales", async () => {
    const router = renderEn("/");

    expect(await screen.findByRole("heading", { level: 1, name: "Mis bancales" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/bancales");
  });

  it("C1.4 · una ruta inexistente muestra «Página no encontrada»", async () => {
    renderEn("/no-existe");

    expect(await screen.findByRole("heading", { level: 1, name: "Página no encontrada" })).toBeInTheDocument();
  });
});
