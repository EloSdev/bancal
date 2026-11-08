// Ficha de cultivo: carga el catálogo entero (los vecinos necesitan su nombre
// para el enlace) y decide entre cargando, error, no encontrado y la ficha.
// El cultivo y sus vecinos se derivan en cada render, no se guardan; pasar
// de una ficha a la de un vecino no vuelve a cargar (misma clave).
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { ErrorCarga } from "../../common/components/error-carga";
import { useCultivos } from "../../core/cultivos/hooks";
import type { Cultivo, Relacion } from "../../core/cultivos/model";
import { FichaCultivo, type Vecino } from "./ficha-cultivo.component";

export function FichaCultivoContainer({ cultivoId }: { cultivoId: string }) {
  const { data: cultivos, loading, error, recargar } = useCultivos();
  const refFicha = useRef<HTMLDivElement>(null);

  // «Reintentar» desaparece al pulsarlo: el foco espera en el envoltorio, que
  // siempre está, y pasa al título cuando llega la ficha (frontend-a11y §6).
  const reintentar = () => {
    recargar();
    refFicha.current?.focus();
  };

  const cultivo = cultivos?.find((c) => c.id === cultivoId);

  return (
    <div ref={refFicha} tabIndex={-1}>
      {/* Existe desde el principio para que el lector anuncie la carga (frontend-a11y §5). */}
      <p role="status" className="text-sm text-tinta-suave">
        {loading ? "Cargando la ficha…" : ""}
      </p>
      {loading && <FichaCargando />}
      {error && <ErrorCarga titulo="No se ha podido cargar la ficha." error={error} onReintentar={reintentar} />}
      {cultivos &&
        (cultivo ? (
          <FichaCultivo
            cultivo={cultivo}
            compatibles={resolverVecinos(cultivo.compatibles, cultivos)}
            incompatibles={resolverVecinos(cultivo.incompatibles, cultivos)}
          />
        ) : (
          <CultivoNoEncontrado cultivoId={cultivoId} />
        ))}
    </div>
  );
}

/** Cada relación con el nombre de su cultivo; una que no esté en el catálogo no se enlaza. */
function resolverVecinos(relaciones: Relacion[], cultivos: Cultivo[]): Vecino[] {
  return relaciones.flatMap(({ cultivoId, motivo }) => {
    const vecino = cultivos.find((c) => c.id === cultivoId);
    return vecino ? [{ id: vecino.id, nombre: vecino.nombre, motivo }] : [];
  });
}

/** La forma de la ficha mientras carga: título, línea de datos y dos columnas. */
function FichaCargando() {
  const bloque = "rounded-control motion-safe:animate-pulse";
  return (
    <div aria-hidden="true" className="mt-3 space-y-8">
      <div className="space-y-2">
        <div className={`h-4 w-20 bg-lapiz/20 ${bloque}`} />
        <div className={`h-9 w-1/3 bg-lapiz/30 ${bloque}`} />
      </div>
      <div className="h-14 border-y border-lapiz" />
      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
        <div className="space-y-4">
          {["a", "b", "c"].map((clave) => (
            <div key={clave} className={`h-20 bg-lapiz/20 ${bloque}`} />
          ))}
        </div>
        <div className={`h-32 bg-lapiz/20 ${bloque}`} />
      </div>
    </div>
  );
}

function CultivoNoEncontrado({ cultivoId }: { cultivoId: string }) {
  return (
    <section className="space-y-3">
      <h1>Cultivo no encontrado</h1>
      <p>No tenemos «{cultivoId}» en el catálogo.</p>
      <p className="flex flex-wrap gap-x-6">
        <Link to="/cultivos" search={{ q: cultivoId }} className="inline-block py-1">
          Buscar «{cultivoId}»
        </Link>
        <Link to="/cultivos" className="inline-block py-1">
          Volver al catálogo
        </Link>
      </p>
    </section>
  );
}
