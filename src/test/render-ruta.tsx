// Renderiza la app real (routeTree) en una ruta, con historial en memoria.
import { render } from "@testing-library/react";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";

export function renderRuta(ruta: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [ruta] }) });
  render(<RouterProvider router={router} />);
  return router;
}
