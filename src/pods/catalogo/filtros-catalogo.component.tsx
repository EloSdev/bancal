// Búsqueda y filtros del catálogo. Solo pinta y avisa de la intención (buscar
// o filtrar): los filtros viven en la URL y los guarda la escena.
import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react";
import { busquedaCatalogoSchema } from "../../core/cultivos/busqueda.schema";
import { exposiciones, zonas } from "../../core/cultivos/cultivo.schema";
import { etiquetaExposicion, etiquetaZona, MESES } from "../../core/cultivos/etiquetas";
import { ZONA_POR_DEFECTO, type FiltrosCatalogo } from "../../core/cultivos/filtros";

export interface FiltrosCatalogoProps {
  filtros: FiltrosCatalogo;
  onBuscar: (q?: string) => void;
  onFiltrar: (cambio: Omit<FiltrosCatalogo, "q">) => void;
  /** Para devolver el foco a la búsqueda tras «Quitar filtros» o «Reintentar». */
  refBusqueda: Ref<HTMLInputElement>;
}

// Los valores de los desplegables se leen con el mismo esquema que la URL:
// así no hace falta `as` y un valor raro se descarta igual que en la URL.
const campos = busquedaCatalogoSchema.shape;

export function FiltrosCatalogoForm({ filtros, onBuscar, onFiltrar, refBusqueda }: FiltrosCatalogoProps) {
  const ids = { q: useId(), sol: useId(), temporada: useId(), zona: useId() };

  return (
    <form
      role="search"
      aria-label="Filtrar cultivos"
      // Tarjeta girasol: la mesa de trabajo del catálogo (docs/brief.md, «cuaderno pop»).
      className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-tarjeta border-2 border-tinta bg-girasol p-4 shadow-pegatina sm:p-5 lg:grid-cols-[2fr_1fr_1fr_1fr]"
      onSubmit={(e) => e.preventDefault()}
    >
      <Campo id={ids.q} etiqueta="Buscar por nombre" ancho>
        <CampoBusqueda id={ids.q} q={filtros.q} onBuscar={onBuscar} ref={refBusqueda} />
      </Campo>

      <Campo id={ids.sol} etiqueta="Sol que necesita">
        <select
          id={ids.sol}
          value={filtros.sol ?? ""}
          onChange={(e) => onFiltrar({ sol: campos.sol.parse(e.target.value || undefined) })}
        >
          <option value="">Cualquiera</option>
          {exposiciones.map((e) => (
            <option key={e} value={e}>
              {etiquetaExposicion[e]}
            </option>
          ))}
        </select>
      </Campo>

      <Campo id={ids.temporada} etiqueta="Se siembra en">
        <select
          id={ids.temporada}
          value={filtros.temporada ?? ""}
          onChange={(e) =>
            onFiltrar({ temporada: campos.temporada.parse(e.target.value ? Number(e.target.value) : undefined) })
          }
        >
          <option value="">Cualquiera</option>
          {MESES.map((nombre, i) => (
            <option key={nombre} value={i + 1}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo id={ids.zona} etiqueta="Zona">
        <select
          id={ids.zona}
          value={filtros.zona ?? ZONA_POR_DEFECTO}
          onChange={(e) => onFiltrar({ zona: campos.zona.parse(e.target.value) })}
        >
          {zonas.map((z) => (
            <option key={z} value={z}>
              {etiquetaZona[z]}
            </option>
          ))}
        </select>
      </Campo>
    </form>
  );
}

/**
 * La búsqueda escribe en la URL, pero la navegación del router es asíncrona:
 * si el campo leyera su valor de la URL, cada tecla se escribiría sobre el
 * valor anterior aún sin actualizar y se perderían letras. Por eso el texto
 * vive aquí y la URL solo lo sobrescribe cuando cambia desde fuera («Quitar
 * filtros», el enlace «Cultivos», atrás). Es un efecto de «sincronizar la
 * prop con el estado» que distingue esos cambios de los ecos de lo que se
 * acaba de escribir (llegan en orden, y el router puede saltarse los
 * intermedios); un `key` no sabría distinguirlos.
 */
function CampoBusqueda({
  id,
  q,
  onBuscar,
  ref,
}: {
  id: string;
  q?: string;
  onBuscar: (q?: string) => void;
  ref: Ref<HTMLInputElement>;
}) {
  const [texto, setTexto] = useState(q ?? "");
  const enviados = useRef<string[]>([]);

  useEffect(() => {
    const valor = q ?? "";
    // Lo último que se escribió: la URL ya está al día.
    if (enviados.current.at(-1) === valor) {
      enviados.current = [];
      return;
    }
    // Un valor intermedio que aún va de camino: los ecos llegan en orden, así
    // que corresponde al primero pendiente con ese valor.
    const eco = enviados.current.indexOf(valor);
    if (eco >= 0) {
      enviados.current = enviados.current.slice(eco + 1);
      return;
    }
    // Un cambio que viene de fuera.
    enviados.current = [];
    setTexto(valor);
  }, [q]);

  return (
    <input
      ref={ref}
      id={id}
      type="search"
      value={texto}
      onChange={(e) => {
        const valor = e.target.value;
        setTexto(valor);
        enviados.current.push(valor);
        onBuscar(valor || undefined);
      }}
    />
  );
}

/** `ancho`: ocupa toda la fila en móvil (la búsqueda); los desplegables van de dos en dos. */
function Campo({ id, etiqueta, ancho = false, children }: { id: string; etiqueta: string; ancho?: boolean; children: ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${ancho ? "col-span-2 lg:col-span-1" : ""}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
    </div>
  );
}
