// Lo que sale con estas medidas, en vivo: el bancal dibujado a escala con sus
// cotas a lápiz, las celdas y la exposición. Al editar, las plantaciones
// (las que quedarían fuera, con el punto hueco). La región de estado lo
// resume para el lector, también cuántas plantaciones se quitarían.
import { Cota } from "../../common/components/cota";
import { bancalSchema } from "../../core/bancales/bancal.schema";
import { dimensiones, plantacionesFuera } from "../../core/bancales/cuadricula";
import { exposicion } from "../../core/bancales/exposicion";
import type { BancalInput, Plantacion } from "../../core/bancales/model";
import { etiquetaExposicion } from "../../core/cultivos/etiquetas";
import { Croquis } from "./croquis.component";

const valido = <K extends keyof typeof bancalSchema.shape>(campo: K, valor: unknown) =>
  bancalSchema.shape[campo].safeParse(valor).success;

/** ¿Ancho y largo están dentro de los límites? (si no, no hay cuadrícula que enseñar) */
export const medidasValidas = ({ ancho, largo }: BancalInput) => valido("ancho", ancho) && valido("largo", largo);

export const textoQuitar = (n: number) =>
  n === 1
    ? "Al guardar se quitará 1 plantación que queda fuera del bancal."
    : `Al guardar se quitarán ${n} plantaciones que quedan fuera del bancal.`;

export function VistaPrevia({ valores, plantaciones }: { valores: BancalInput; plantaciones: Plantacion[] }) {
  const validas = medidasValidas(valores);
  const nuevo = dimensiones(valores.ancho, valores.largo);
  const fuera = validas ? plantacionesFuera(plantaciones, valores.ancho, valores.largo) : [];
  // Si algo queda fuera, se dibuja también la parte que se pierde (en papel).
  const dibujo = {
    columnas: Math.max(nuevo.columnas, ...fuera.map(({ celda }) => celda.columna + 1)),
    filas: Math.max(nuevo.filas, ...fuera.map(({ celda }) => celda.fila + 1)),
  };
  const sol = valido("horasSol", valores.horasSol)
    ? etiquetaExposicion[exposicion(valores.horasSol)].toLowerCase()
    : "sol por decidir";

  const resumen = validas
    ? [
        `${nuevo.columnas} × ${nuevo.filas} ${nuevo.columnas * nuevo.filas === 1 ? "celda" : "celdas"}`,
        sol,
        fuera.length > 0 && `se ${fuera.length === 1 ? "quitará 1 plantación" : `quitarán ${fuera.length} plantaciones`}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Corrige las medidas para ver el bancal.";

  return (
    // Girasol: lo que se está dibujando, como una nota pegada al lado del formulario.
    <section
      aria-label="Vista previa"
      className="min-w-0 space-y-4 self-start rounded-tarjeta border-2 border-tinta bg-girasol p-5 shadow-pegatina sm:p-6 lg:sticky lg:top-6"
    >
      <h2>Así queda</h2>
      {validas && (
        <div className="grid w-fit grid-cols-[auto_auto] gap-2" aria-hidden="true">
          <Cota texto={`${valores.ancho} cm`} />
          <span />
          <Croquis
            {...dibujo}
            plantaciones={plantaciones}
            grande
            recorte={fuera.length > 0 ? nuevo : undefined}
          />
          <Cota texto={`${valores.largo} cm`} vertical />
        </div>
      )}
      <p role="status" className="font-semibold tabular-nums">
        {resumen}
      </p>
      {fuera.length > 0 && <p className="text-sm">Los puntos huecos son las plantaciones que se quitan.</p>}
    </section>
  );
}
