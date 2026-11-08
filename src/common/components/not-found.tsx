import { Link } from "@tanstack/react-router";
import { claseBoton } from "./boton";

export function NotFound() {
  return (
    <section className="space-y-6 py-10">
      <p
        aria-hidden="true"
        className="w-fit -rotate-3 rounded-full border-2 border-tinta bg-girasol px-4 py-1 font-titulos text-2xl font-black shadow-pegatina"
      >
        404
      </p>
      <h1>Página no encontrada</h1>
      <p className="text-lg text-tinta-suave">Esta página no existe o ha cambiado de sitio.</p>
      <Link to="/bancales" className={claseBoton("primario")}>
        Volver a mis bancales
      </Link>
    </section>
  );
}
