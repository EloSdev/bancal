import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { precargarBancales } from "./core/bancales/hooks";
import { router } from "./core/router/router";
import { precargarCultivos } from "./core/cultivos/hooks";
import "./styles.css";

// T21: el catálogo y los bancales se piden ya al arrancar, en paralelo con el
// primer pintado. Cuando se abre Cultivos o Mis bancales, los datos están
// (o llegando: la pantalla espera esa misma carga, no pide otra).
void precargarCultivos();
void precargarBancales();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
