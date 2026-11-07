import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <section className="space-y-3">
      <h1>Página no encontrada</h1>
      <p>Esta página no existe o ha cambiado de sitio.</p>
      <Link to="/bancales" className="inline-block py-1">
        Volver a mis bancales
      </Link>
    </section>
  );
}
