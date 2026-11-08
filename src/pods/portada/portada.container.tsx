// Portada: carga el catálogo para la tira de cultivos y para las notas de la
// foto (T23). El resto de la página no espera a los datos: se pinta al
// momento, y las notas aparecen cuando llega el catálogo.
import { useState } from "react";
import { ErrorCarga } from "../../common/components/error-carga";
import { filtrarCultivos, ordenarPorNombre, ZONA_POR_DEFECTO } from "../../core/cultivos/filtros";
import { useCultivos } from "../../core/cultivos/hooks";
import type { Cultivo, Mes } from "../../core/cultivos/model";
import { elegir, parejas } from "../../core/cultivos/parejas";
import { Portada, TiraCultivos, type NotasFoto } from "./portada.component";

export function PortadaContainer() {
  const { data: cultivos, loading, error, recargar } = useCultivos();
  // El azar se tira una vez por visita (al montar); las parejas se derivan de
  // él y del catálogo en cada render, así que no cambian mientras se mira.
  const [azar] = useState(() => ({ ayudan: Math.random(), perjudican: Math.random() }));
  const mes: Mes = new Date().getMonth() + 1;

  const estado = loading ? (
    <p role="status" className="text-sm text-tinta-suave">
      Cargando los cultivos…
    </p>
  ) : error ? (
    <ErrorCarga titulo="No se han podido cargar los cultivos." error={error} onReintentar={recargar} />
  ) : null;

  return (
    <Portada
      notas={cultivos && notasDeLaFoto(cultivos, mes, azar)}
      tira={<TiraCultivos cultivos={cultivos && ordenarPorNombre(cultivos)} estado={estado} />}
    />
  );
}

/**
 * Lo que dicen las notas pegadas a la foto: qué toca sembrar este mes en la
 * zona por defecto (la regla del filtro «Se siembra en» del catálogo) y una
 * pareja al azar de las que se ayudan y de las que se perjudican.
 */
function notasDeLaFoto(cultivos: Cultivo[], mes: Mes, azar: { ayudan: number; perjudican: number }): NotasFoto {
  return {
    mes,
    zona: ZONA_POR_DEFECTO,
    siembra: ordenarPorNombre(filtrarCultivos(cultivos, { temporada: mes, zona: ZONA_POR_DEFECTO })),
    ayudan: elegir(parejas(cultivos, "favorable"), azar.ayudan),
    perjudican: elegir(parejas(cultivos, "desfavorable"), azar.perjudican),
  };
}
