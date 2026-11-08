// Portada: carga el catálogo solo para la tira de cultivos. El resto de la
// página no espera a los datos: se pinta al momento.
import { ErrorCarga } from "../../common/components/error-carga";
import { ordenarPorNombre } from "../../core/cultivos/filtros";
import { useCultivos } from "../../core/cultivos/hooks";
import { Portada, TiraCultivos } from "./portada.component";

export function PortadaContainer() {
  const { data: cultivos, loading, error, recargar } = useCultivos();

  const estado = loading ? (
    <p role="status" className="text-sm text-tinta-suave">
      Cargando los cultivos…
    </p>
  ) : error ? (
    <ErrorCarga titulo="No se han podido cargar los cultivos." error={error} onReintentar={recargar} />
  ) : null;

  return <Portada tira={<TiraCultivos cultivos={cultivos && ordenarPorNombre(cultivos)} estado={estado} />} />;
}
