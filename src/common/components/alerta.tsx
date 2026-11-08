// Lo que el lector tiene que oír ya (errores, datos perdidos): role="alert"
// (frontend-a11y §5). Tarjeta pegatina con un filete grueso de tinta a la
// izquierda, no en rojo: el rojo es de la compatibilidad (docs/brief.md).
import type { ReactNode } from "react";
import { claseTarjeta } from "./tarjeta";

export function Alerta({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className={`${claseTarjeta} space-y-3 border-l-8 p-5`}>
      {children}
    </div>
  );
}
