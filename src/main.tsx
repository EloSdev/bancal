import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { precargarBancales } from "./core/bancales/hooks";
import { configurarModoDemo, leerModoDemo } from "./core/comun/api";
import { router } from "./core/router/router";
import { precargarCultivos } from "./core/cultivos/hooks";
import "./styles.css";

// T22: el modo demo se lee una vez, de la URL con la que se abre la app
// (`?lento`, `?fallo`), y dura toda la sesión aunque la URL cambie al navegar.
const modo = leerModoDemo(window.location.search);
configurarModoDemo(modo);

// T21: el catálogo y los bancales se piden ya al arrancar, en paralelo con el
// primer pintado. Cuando se abre Cultivos o Mis bancales, los datos están
// (o llegando: la pantalla espera esa misma carga, no pide otra). Con `?fallo`
// no: la precarga se gastaría el fallo sin que nadie lo viera.
if (!modo.fallo) {
  void precargarCultivos();
  void precargarBancales();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
