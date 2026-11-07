// Error al cargar datos: qué ha pasado, en palabras de persona, y qué hacer.
// role="alert" para que el lector lo anuncie (frontend-a11y §5). Va en tinta,
// no en rojo: el rojo es de la compatibilidad (docs/brief.md).
import type { ErrorApi } from "../../core/comun/api";
import { Boton } from "./boton";

interface ErrorCargaProps {
  titulo: string;
  error: ErrorApi;
  onReintentar: () => void;
}

export function ErrorCarga({ titulo, error, onReintentar }: ErrorCargaProps) {
  return (
    <div role="alert" className="space-y-3 border-l-4 border-tinta py-1 pl-4">
      <p className="font-medium">{titulo}</p>
      <p className="text-tinta-suave">{error.message}</p>
      <Boton variante="secundario" onClick={onReintentar}>
        Reintentar
      </Boton>
    </div>
  );
}
