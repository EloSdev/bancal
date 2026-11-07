import { Link } from "@tanstack/react-router";

// Provisional: la ficha completa del cultivo es la tarea T10. Existe ya para
// que los enlaces del catálogo (T9) sean enlaces tipados a una ruta real.
export function CultivoScene({ cultivoId }: { cultivoId: string }) {
  return (
    <section className="space-y-3">
      <h1>Ficha de cultivo</h1>
      <p>La ficha de «{cultivoId}» está en preparación.</p>
      <Link to="/cultivos" className="inline-block py-1">
        Volver al catálogo
      </Link>
    </section>
  );
}
