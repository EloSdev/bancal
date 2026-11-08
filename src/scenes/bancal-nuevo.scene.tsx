import { Link } from "@tanstack/react-router";

// Provisional: el formulario de alta es la tarea T12. Existe ya para que los
// enlaces de «Mis bancales» (T11) sean enlaces tipados a una ruta real.
export function BancalNuevoScene() {
  return (
    <section className="space-y-3">
      <h1>Nuevo bancal</h1>
      <p>El formulario para crear un bancal está en preparación.</p>
      <Link to="/bancales" className="inline-block py-1">
        Volver a mis bancales
      </Link>
    </section>
  );
}
