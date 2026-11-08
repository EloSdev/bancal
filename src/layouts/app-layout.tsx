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
    // El pie se queda abajo aunque la pantalla sea corta. En el editor, en el
    // móvil, la banda fija tapa lo último de la página: el pie deja su hueco.
    <div className="group/app flex min-h-dvh flex-col">
      <header className="border-b border-lapiz">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
          {/* El logo lleva a la portada. En la portada sí lleva aria-current,
              y es el único: la portada no está en el <nav>. */}
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
      <main ref={refMain} className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-6">
        <Outlet />
      </main>
      <Pie />
    </div>
  );
}

const REPOSITORIO = "https://github.com/EloSdev/bancal";

function Pie() {
  return (
    <footer className="border-t border-lapiz group-has-[[data-banda-movil]]/app:pb-32 lg:group-has-[[data-banda-movil]]/app:pb-0">
      <div className="mx-auto grid max-w-5xl gap-x-12 gap-y-4 px-4 py-8 text-sm text-tinta-suave sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-[40rem] space-y-2">
          <p className="font-titulos text-lg font-semibold text-tinta">Bancal</p>
          <p>
            Cuaderno para planificar bancales urbanos. Proyecto final del curso Front End Moderno y Herramientas IA, de
            la Fundación Luckia y Lemoncode.
          </p>
          <p>
            Tus bancales se guardan solo en este navegador. Los datos de horticultura llevan sus{" "}
            <a href={`${REPOSITORIO}#readme`}>fuentes citadas en el README</a>.
          </p>
        </div>
        <p className="sm:pt-8">
          <a href={REPOSITORIO}>Ver el código en GitHub</a>
        </p>
      </div>
    </footer>
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
