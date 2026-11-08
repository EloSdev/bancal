// La temporada (T15): el deslizador de meses, nativo (frontend-a11y §7: las
// flechas ya funcionan y aria-valuetext dice «mayo», no «5»), y las tareas
// del mes que salen de las plantaciones. El mes vive en la URL; esto solo
// pinta y avisa con onCambiarMes.
import { useId } from "react";
import { nombreMes } from "../../core/cultivos/etiquetas";
import type { Cultivo, Mes } from "../../core/cultivos/model";
import type { TareasDelMes } from "../../core/bancales/temporada";

interface TemporadaProps {
  mes: Mes;
  onCambiarMes: (mes: Mes) => void;
  tareas: TareasDelMes;
  cultivosPorId: Map<string, Cultivo>;
}

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function Temporada({ mes, onCambiarMes, tareas, cultivosPorId }: TemporadaProps) {
  const id = useId();
  const nombre = (cultivoId: string) => cultivosPorId.get(cultivoId)?.nombre ?? cultivoId;
  const mesTexto = nombreMes(mes);
  return (
    // Girasol: la temporada es el detalle memorable del editor (docs/brief.md).
    // @container: dos columnas solo si la tarjeta tiene sitio (en xl la columna central es estrecha).
    <div className="@container rounded-tarjeta border-2 border-tinta bg-girasol p-4 shadow-pegatina sm:p-5">
      <div className="grid gap-x-8 gap-y-4 @lg:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${id}-mes`} className="flex items-baseline justify-between gap-3">
            <span>Mes</span>
            <span aria-hidden="true" className="font-titulos text-3xl font-black">
              {mayuscula(mesTexto)}
            </span>
          </label>
          <input
            id={`${id}-mes`}
            type="range"
            min={1}
            max={12}
            step={1}
            value={mes}
            aria-valuetext={mesTexto}
            onChange={(e) => onCambiarMes(e.target.valueAsNumber)}
            // Sin la caja de los campos de texto (estilos base de input): solo la pista.
            className="min-h-11 w-full border-0 bg-transparent px-0 accent-tinta focus-visible:shadow-none"
          />
          <div aria-hidden="true" className="grid grid-cols-12 text-center text-xs tabular-nums">
            {["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((letra, i) => (
              <span key={`${letra}-${i}`} className={i + 1 === mes ? "font-black underline decoration-2 underline-offset-4" : undefined}>
                {letra}
              </span>
            ))}
          </div>
        </div>
  
        <section aria-labelledby={`${id}-tareas`} className="space-y-1">
          <h2 id={`${id}-tareas`} className="text-lg">
            Tareas de {mesTexto}
          </h2>
          {tareas.sembrar.length === 0 && tareas.cosechar.length === 0 ? (
            <p className="text-sm">Nada que sembrar ni cosechar en {mesTexto}.</p>
          ) : (
            <div className="space-y-1 text-sm">
              <ListaTarea titulo="Sembrar" ids={tareas.sembrar} nombre={nombre} />
              <ListaTarea titulo="Cosechar" ids={tareas.cosechar} nombre={nombre} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ListaTarea({ titulo, ids, nombre }: { titulo: string; ids: string[]; nombre: (id: string) => string }) {
  const id = useId();
  if (ids.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-2">
      <span className="font-medium">
        <span id={id}>{titulo}</span>:
      </span>
      <ul role="list" aria-labelledby={id} className="flex flex-wrap gap-x-2">
        {ids.map((cultivoId, i) => (
          <li key={cultivoId}>
            {nombre(cultivoId)}
            {i < ids.length - 1 && <span aria-hidden="true">,</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
