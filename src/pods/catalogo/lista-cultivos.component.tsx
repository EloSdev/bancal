// La lista del catálogo, como el índice de un cuaderno: el nombre a pluma con
// lo que distingue un cultivo (sol, dificultad) en la misma línea y, debajo,
// la regla de meses con su siembra en la zona elegida. Toda la fila responde
// al clic, pero el enlace accesible es solo el nombre.
import { Link } from "@tanstack/react-router";
import { IconoCultivo } from "../../common/components/icono-cultivo";
import { ReglaMeses } from "../../common/components/regla-meses";
import { claseTarjetaPulsable } from "../../common/components/tarjeta";
import { etiquetaDificultad, etiquetaExposicion, ventanaEnTexto } from "../../core/cultivos/etiquetas";
import type { Cultivo, Mes, ZonaClimatica } from "../../core/cultivos/model";

interface ListaCultivosProps {
  cultivos: Cultivo[];
  zona: ZonaClimatica;
  /** Mes elegido en el filtro «Se siembra en»: se marca en todas las reglas. */
  mes?: Mes;
}

export function ListaCultivos({ cultivos, zona, mes }: ListaCultivosProps) {
  return (
    // role="list": con list-style none, VoiceOver en Safari deja de anunciarla como lista.
    <ul role="list" aria-label="Cultivos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cultivos.map((cultivo) => (
        <FilaCultivo key={cultivo.id} cultivo={cultivo} zona={zona} mes={mes} />
      ))}
    </ul>
  );
}

function FilaCultivo({ cultivo, zona, mes }: { cultivo: Cultivo; zona: ZonaClimatica; mes?: Mes }) {
  const siembra = cultivo.calendario[zona].siembra;
  return (
    <li className={`${claseTarjetaPulsable} space-y-3 p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Link
          to="/cultivos/$cultivoId"
          params={{ cultivoId: cultivo.id }}
          className="inline-flex items-center gap-3 font-titulos text-xl font-bold text-tinta no-underline decoration-acento after:absolute after:inset-0 hover:underline"
        >
          {/* El dibujo en su pegatina girasol: el cultivo se reconoce de un vistazo. */}
          <span className="grid size-10 place-items-center rounded-full border-2 border-tinta bg-girasol">
            <IconoCultivo cultivoId={cultivo.id} />
          </span>
          {cultivo.nombre}
        </Link>
        <p className="text-sm text-tinta-suave">
          {etiquetaExposicion[cultivo.sol]}
          <span aria-hidden="true" className="px-1.5">
            ·
          </span>
          {etiquetaDificultad[cultivo.dificultad]}
        </p>
      </div>
      <ReglaMeses ventana={siembra} descripcion={`Se siembra ${ventanaEnTexto(siembra)}`} resaltado={mes} />
    </li>
  );
}
