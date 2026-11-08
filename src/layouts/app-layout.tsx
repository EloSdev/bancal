import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { IconoEstado } from "../common/components/icono-estado";
import { modoDemo } from "../core/comun/api";
import { FOTOS } from "../common/fotos";

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
  // La portada va a sangre (sus bandas de color ocupan todo el ancho): cada
  // sección pone su propio contenedor. El resto de pantallas, en la columna.
  const esPortada = useRouterState({ select: (s) => s.location.pathname === "/" });
  return (
    // El pie se queda abajo aunque la pantalla sea corta. En el editor, en el
    // móvil, la banda fija tapa lo último de la página: el pie deja su hueco.
    <div className="group/app flex min-h-dvh flex-col">
      <header className="border-b-2 border-tinta">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
          {/* El logo lleva a la portada. En la portada sí lleva aria-current,
              y es el único: la portada no está en el <nav>. */}
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="flex items-center gap-2 py-2 font-titulos text-2xl font-black tracking-tight text-tinta no-underline"
          >
            <span
              aria-hidden="true"
              className="grid size-9 -rotate-6 place-items-center rounded-full border-2 border-tinta bg-girasol shadow-[2px_2px_0_var(--color-tinta)] [&>svg]:size-6"
            >
              <IconoEstado estado="brote" />
            </span>
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
      <AvisoModoDemo />
      <main
        ref={refMain}
        className={esPortada ? "flex-1" : "mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 pt-10 pb-20"}
      >
        <Outlet />
      </main>
      <Pie />
    </div>
  );
}

/**
 * El modo demo (T22) cambia cómo responde la app: que se sepa siempre que
 * está activo. «Quitar» recarga la página sin el parámetro (el modo se lee
 * al arrancar), por eso es un <a> y no un <Link>.
 */
function AvisoModoDemo() {
  const ruta = useRouterState({ select: (s) => s.location.pathname });
  const { lento, fallo } = modoDemo();
  if (!lento && !fallo) return null;
  const simula = [lento && "servidor lento", fallo && "cada petición falla una vez"].filter(Boolean).join(" · ");
  return (
    <div className="border-b-2 border-tinta bg-girasol">
      <p className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <span>
          <strong>Modo demo:</strong> {simula}
        </span>
        <a href={ruta} className="font-semibold text-tinta">
          Quitar el modo demo
        </a>
      </p>
    </div>
  );
}

const REPOSITORIO = "https://github.com/EloSdev/bancal";

// Las fotos de la portada, una vez cada autor (Markus Spiske firma tres).
const autoresFotos = [...new Map(Object.values(FOTOS).map((foto) => [foto.autor, foto])).values()];

/** El pie, en tinta para toda la app: el proyecto, los datos y las fotos. */
function Pie() {
  return (
    <footer className="border-t-2 border-tinta bg-tinta text-sm text-superficie/80 group-has-[[data-banda-movil]]/app:pb-44 lg:group-has-[[data-banda-movil]]/app:pb-0">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="font-titulos text-3xl font-black text-superficie">Bancal</p>
          <p>
            Cuaderno para planificar bancales urbanos. Proyecto final del curso Front End Moderno y Herramientas IA, de
            la Fundación Luckia y Lemoncode.
          </p>
        </div>
        <div className="space-y-3">
          <p className="font-bold tracking-widest text-girasol uppercase">El proyecto</p>
          <p>Tus bancales se guardan solo en este navegador.</p>
          <ul className="space-y-1">
            <li>
              <EnlacePie href={`${REPOSITORIO}#readme`}>Los datos y sus fuentes citadas</EnlacePie>
            </li>
            <li>
              <EnlacePie href={REPOSITORIO}>Ver el código en GitHub</EnlacePie>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className="font-bold tracking-widest text-girasol uppercase">Fotos</p>
          <p>
            De Unsplash, con la <EnlacePie href="https://unsplash.com/license">licencia de Unsplash</EnlacePie>:
          </p>
          <ul className="space-y-1">
            {autoresFotos.map((foto) => (
              <li key={foto.autor}>
                <EnlacePie href={foto.enlace}>{foto.autor}</EnlacePie>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4">
        <p className="border-t border-superficie/20 py-6 text-xs">
          Hecho con React 19, TanStack Router, Tailwind CSS 4 y mucha tierra en las uñas.
        </p>
      </div>
    </footer>
  );
}

/** Enlace sobre la tinta: en papel con subrayado girasol, foco en girasol. */
function EnlacePie({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-6 items-center text-superficie decoration-girasol hover:text-girasol focus-visible:outline-girasol active:text-girasol"
    >
      {children}
    </a>
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
