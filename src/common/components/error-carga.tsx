// Error al cargar datos: qué ha pasado, en palabras de persona, y qué hacer.
import type { ErrorApi } from "../../core/comun/api";
import { Alerta } from "./alerta";
import { Boton } from "./boton";

interface ErrorCargaProps {
  titulo: string;
  error: ErrorApi;
  onReintentar: () => void;
}

export function ErrorCarga({ titulo, error, onReintentar }: ErrorCargaProps) {
  return (
    <Alerta>
      <p className="font-medium">{titulo}</p>
      <p className="text-tinta-suave">{error.message}</p>
      <Boton variante="secundario" onClick={onReintentar}>
        Reintentar
      </Boton>
    </Alerta>
  );
}
