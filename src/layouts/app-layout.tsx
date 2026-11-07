import { Link, Outlet } from "@tanstack/react-router";

export function AppLayout() {
  return (
    <>
      <header className="border-b border-stone-300">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/bancales" className="text-xl font-bold">
            Bancal
          </Link>
          <nav aria-label="Principal">
            <ul className="flex gap-4">
              <li>
                <Link to="/cultivos" className="hover:underline [&.active]:font-semibold [&.active]:underline">
                  Cultivos
                </Link>
              </li>
              <li>
                <Link to="/bancales" className="hover:underline [&.active]:font-semibold [&.active]:underline">
                  Mis bancales
                </Link>
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
