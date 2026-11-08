// Lo que el lector tiene que oír ya (errores, datos perdidos): role="alert"
// (frontend-a11y §5). Va en tinta con un filete a la izquierda, no en rojo:
// el rojo es de la compatibilidad (docs/brief.md).
import type { ReactNode } from "react";

export function Alerta({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="space-y-3 border-l-4 border-tinta py-1 pl-4">
      {children}
    </div>
  );
}
