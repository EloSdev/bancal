import { Link, Outlet } from "@tanstack/react-router";

export function AppLayout() {
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
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
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
