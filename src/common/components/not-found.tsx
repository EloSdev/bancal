import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <section className="space-y-3">
      <h1>Página no encontrada</h1>
      <p>La dirección no corresponde a ninguna página de Bancal.</p>
      <Link to="/bancales" className="underline">
        Volver a mis bancales
      </Link>
    </section>
  );
}
