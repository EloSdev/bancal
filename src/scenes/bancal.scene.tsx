import { Link } from "@tanstack/react-router";

// Provisional: el editor del bancal es la tarea T13. Existe ya para que los
// enlaces de «Mis bancales» (T11) sean enlaces tipados a una ruta real.
export function BancalScene({ bancalId }: { bancalId: string }) {
  return (
    <section className="space-y-3">
      <h1>Editor del bancal</h1>
      <p>El editor de «{bancalId}» está en preparación.</p>
      <Link to="/bancales" className="inline-block py-1">
        Volver a mis bancales
      </Link>
    </section>
  );
}
