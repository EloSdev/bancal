import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

/**
 * Al cambiar de ruta, el foco va al <h1> de la pantalla nueva para que el
 * lector anuncie dónde está (frontend-a11y §6). No en la primera carga, y no
 * si la pantalla ya ha llevado el foco dentro de <main> (TituloPagina, ficha).
 */
function useFocoAlCambiarDeRuta() {
  const ruta = useRouterState({ select: (s) => s.location.pathname });
  const refMain = useRef<HTMLElement>(null);
  const anterior = useRef(ruta);

  useEffect(() => {
    if (anterior.current === ruta) return;
    anterior.current = ruta;
    // En el siguiente fotograma: la pantalla nueva ya está pintada.
    const fotograma = requestAnimationFrame(() => {
      const main = refMain.current;
      if (!main || main.contains(document.activeElement)) return;
      const titulo = main.querySelector("h1");
      if (!titulo) return;
      if (!titulo.hasAttribute("tabindex")) titulo.setAttribute("tabindex", "-1");
      titulo.focus();
    });
    return () => cancelAnimationFrame(fotograma);
  }, [ruta]);

  return refMain;
}

export function AppLayout() {
  const refMain = useFocoAlCambiarDeRuta();
  return (
    <>
      <header className="border-b border-lapiz">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
          {/* El logo lleva a la portada (/ redirige a /bancales) con coincidencia
              exacta: nunca está activo, así que no repite el aria-current del <nav>. */}
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="py-2 font-titulos text-xl font-semibold tracking-wide text-tinta no-underline"
          >
            Bancal
          </Link>
          <nav aria-label="Principal">
            <ul className="flex gap-2">
              <li>
                <EnlaceNav to="/cultivos">Cultivos</EnlaceNav>
              </li>
              <li>
                <EnlaceNav to="/bancales">Mis bancales</EnlaceNav>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main ref={refMain} className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <Outlet />
      </main>
    </>
  );
}

function EnlaceNav({ to, children }: { to: "/cultivos" | "/bancales"; children: string }) {
  return (
    <Link
      to={to}
      // La ruta activa se subraya con la pluma azul: la primera firma del brief.
      className="inline-block px-2 py-2.5 text-tinta-suave no-underline decoration-acento decoration-2 hover:text-tinta hover:underline active:text-tinta aria-[current=page]:font-semibold aria-[current=page]:text-tinta aria-[current=page]:underline"
    >
      {children}
    </Link>
  );
}
