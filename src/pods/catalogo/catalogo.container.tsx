// Catálogo: carga los cultivos y decide entre cargando, error, sin resultados
// y la lista. Los filtros llegan de la URL (escena) y la lista filtrada y
// ordenada se deriva en cada render, no se guarda.
import { useRef } from "react";
import { Boton } from "../../common/components/boton";
import { ErrorCarga } from "../../common/components/error-carga";
import { etiquetaExposicion, etiquetaZona, nombreMes } from "../../core/cultivos/etiquetas";
import {
  filtrarCultivos,
  hayFiltros,
  ordenarPorNombre,
  ZONA_POR_DEFECTO,
  type FiltrosCatalogo,
} from "../../core/cultivos/filtros";
import { useCultivos } from "../../core/cultivos/hooks";
import type { Cultivo } from "../../core/cultivos/model";
import { FiltrosCatalogoForm, type FiltrosCatalogoProps } from "./filtros-catalogo.component";
import { ListaCultivos } from "./lista-cultivos.component";

interface CatalogoContainerProps extends Pick<FiltrosCatalogoProps, "filtros" | "onBuscar" | "onFiltrar"> {
  onQuitarFiltros: () => void;
}

export function CatalogoContainer({ filtros, onBuscar, onFiltrar, onQuitarFiltros }: CatalogoContainerProps) {
  const { data: cultivos, loading, error, recargar } = useCultivos();
  const refBusqueda = useRef<HTMLInputElement>(null);
  const zona = filtros.zona ?? ZONA_POR_DEFECTO;
  const visibles = cultivos ? ordenarPorNombre(filtrarCultivos(cultivos, filtros)) : [];

  // Los dos botones desaparecen al pulsarlos: el foco va a la búsqueda, que
  // siempre está, en vez de perderse en <body> (frontend-a11y §6).
  const quitarFiltros = () => {
    onQuitarFiltros();
    refBusqueda.current?.focus();
  };
  const reintentar = () => {
    recargar();
    refBusqueda.current?.focus();
  };

  return (
    <>
      <FiltrosCatalogoForm filtros={filtros} onBuscar={onBuscar} onFiltrar={onFiltrar} refBusqueda={refBusqueda} />

      <div className="flex flex-wrap items-center gap-x-3 text-sm text-tinta-suave">
        {/* Existe desde el principio para que el lector anuncie cada cambio (frontend-a11y §5). */}
        <p role="status" aria-live="polite" className="tabular-nums">
          {textoEstado(loading, cultivos, visibles.length, hayFiltros(filtros))}
        </p>
        {/* Leyenda de las reglas: una vez para toda la lista, con la zona que cambia el calendario. */}
        {visibles.length > 0 && <p>Meses de siembra en la zona {etiquetaZona[zona].toLowerCase()}</p>}
        {cultivos && hayFiltros(filtros) && (
          <Boton variante="enlace" onClick={quitarFiltros}>
            Quitar filtros
          </Boton>
        )}
      </div>

      {loading && <ListaCargando />}

      {error && <ErrorCarga titulo="No se ha podido cargar el catálogo." error={error} onReintentar={reintentar} />}

      {cultivos &&
        (visibles.length > 0 ? (
          <ListaCultivos cultivos={visibles} zona={zona} mes={filtros.temporada} />
        ) : (
          <p>{sinResultados(filtros)}</p>
        ))}
    </>
  );
}

function textoEstado(loading: boolean, cultivos: Cultivo[] | null, visibles: number, filtrado: boolean): string {
  if (loading) return "Cargando el catálogo…";
  if (!cultivos) return "";
  const palabra = cultivos.length === 1 ? "cultivo" : "cultivos";
  return filtrado ? `${visibles} de ${cultivos.length} ${palabra}` : `${cultivos.length} ${palabra}`;
}

/** Dice qué no se ha encontrado, con las mismas palabras que los filtros. */
function sinResultados({ q, sol, temporada, zona }: FiltrosCatalogo): string {
  const busqueda = q?.trim();
  if (busqueda) return `Ningún cultivo se llama «${busqueda}»${sol || temporada ? " con estos filtros" : ""}.`;
  const necesita = sol && etiquetaExposicion[sol].toLowerCase();
  if (!temporada) return necesita ? `Ningún cultivo necesita ${necesita}.` : "El catálogo está vacío.";
  const cuando = `se siembra en ${nombreMes(temporada)} en la zona ${etiquetaZona[zona ?? ZONA_POR_DEFECTO].toLowerCase()}`;
  return necesita ? `Ningún cultivo que necesite ${necesita} ${cuando}.` : `Ningún cultivo ${cuando}.`;
}

/** La estructura de la lista mientras carga: las líneas del cuaderno, sin contenido. */
function ListaCargando() {
  return (
    <ul aria-hidden="true" className="-mx-2 grid border-t border-lapiz sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3">
      {["a", "b", "c", "d", "e", "f"].map((clave) => (
        <li key={clave} className="space-y-3 border-b border-lapiz px-2 py-4">
          <div className="h-5 w-2/5 rounded-control bg-lapiz/30 motion-safe:animate-pulse" />
          <div className="h-4 w-full rounded-control bg-lapiz/20 motion-safe:animate-pulse" />
        </li>
      ))}
    </ul>
  );
}
