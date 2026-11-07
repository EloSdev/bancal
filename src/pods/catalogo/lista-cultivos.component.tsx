// La lista del catálogo, como el índice de un cuaderno: el nombre a pluma con
// lo que distingue un cultivo (sol, dificultad) en la misma línea y, debajo,
// la regla de meses con su siembra en la zona elegida. Toda la fila responde
// al clic, pero el enlace accesible es solo el nombre.
import { Link } from "@tanstack/react-router";
import { ReglaMeses } from "../../common/components/regla-meses";
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
    // -mx-2 + px-2 en la fila: el fondo del hover sangra, el texto queda alineado con el título.
    <ul role="list" aria-label="Cultivos" className="-mx-2 grid border-t border-lapiz sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3">
      {cultivos.map((cultivo) => (
        <FilaCultivo key={cultivo.id} cultivo={cultivo} zona={zona} mes={mes} />
      ))}
    </ul>
  );
}

function FilaCultivo({ cultivo, zona, mes }: { cultivo: Cultivo; zona: ZonaClimatica; mes?: Mes }) {
  const siembra = cultivo.calendario[zona].siembra;
  return (
    <li className="relative space-y-2 border-b border-lapiz px-2 py-3 transition-colors hover:bg-superficie-elevada has-[a:focus-visible]:bg-superficie-elevada has-[a:active]:bg-superficie-elevada">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <Link
          to="/cultivos/$cultivoId"
          params={{ cultivoId: cultivo.id }}
          className="font-titulos text-lg font-semibold text-tinta no-underline decoration-acento after:absolute after:inset-0 hover:underline"
        >
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
