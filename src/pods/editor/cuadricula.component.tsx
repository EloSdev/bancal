// La cuadrícula del bancal, dibujada a tinta y a escala (docs/brief.md: marco
// de tablones con doble línea, tierra, cuadrícula a lápiz y las cotas fuera).
// Patrón grid con roving tabindex (frontend-a11y §3): una sola celda en el
// orden de Tab, las flechas / Inicio / Fin mueven el foco, Intro y Espacio
// (botón nativo) colocan, Supr y Retroceso quitan. El tamaño de las celdas
// sale del hueco que tiene la cuadrícula (container queries), entre 44 px
// (el dedo) y 80 px; si no cabe, se desplaza dentro de su marco.
import { useRef, type KeyboardEvent, type Ref } from "react";
import { Cota } from "../../common/components/cota";
import { IconoCultivo } from "../../common/components/icono-cultivo";
import { moverCelda, type Dimensiones, type Movimiento } from "../../core/bancales/cuadricula";
import type { Celda, Plantacion } from "../../core/bancales/model";
import { nombreCorto } from "../../core/cultivos/etiquetas";
import type { Cultivo } from "../../core/cultivos/model";

interface CuadriculaProps {
  /** La rejilla, para que el editor devuelva el foco a la celda activa. */
  refRejilla?: Ref<HTMLDivElement>;
  nombre: string;
  ancho: number;
  largo: number;
  dims: Dimensiones;
  plantaciones: Plantacion[];
  cultivosPorId: Map<string, Cultivo>;
  /** La celda que está en el orden de Tab. */
  activa: Celda;
  onActivar: (celda: Celda) => void;
  /** Clic, toque, Intro o Espacio: lo que diga la paleta. */
  onUsar: (celda: Celda) => void;
  onQuitar: (celda: Celda) => void;
}

const TECLAS: Record<string, Movimiento> = {
  ArrowUp: "arriba",
  ArrowDown: "abajo",
  ArrowLeft: "izquierda",
  ArrowRight: "derecha",
  Home: "inicio",
  End: "fin",
};

const clave = ({ fila, columna }: Celda) => `${fila}-${columna}`;

export function Cuadricula(props: CuadriculaProps) {
  const { refRejilla, nombre, ancho, largo, dims, plantaciones, cultivosPorId, activa, onActivar, onUsar, onQuitar } = props;
  const botones = useRef(new Map<string, HTMLButtonElement>());
  const porCelda = new Map(plantaciones.map((p) => [clave(p.celda), p]));

  const alPulsarTecla = (evento: KeyboardEvent<HTMLButtonElement>, celda: Celda) => {
    const movimiento = TECLAS[evento.key];
    if (movimiento) {
      evento.preventDefault(); // las flechas no desplazan la página
      const siguiente = moverCelda(celda, movimiento, dims);
      onActivar(siguiente);
      botones.current.get(clave(siguiente))?.focus();
    } else if (evento.key === "Delete" || evento.key === "Backspace") {
      evento.preventDefault();
      onQuitar(celda);
    }
  };

  // Ancho de columna: lo que da el hueco (100cqi menos la cota y el marco),
  // entre el mínimo para el dedo y 7 rem (un bancal pequeño no se queda
  // diminuto en escritorio). round(): líneas a lápiz de grosor parejo.
  const columna = `round(down, clamp(var(--spacing-celda), calc((100cqi - 3rem) / ${dims.columnas}), 7rem), 1px)`;
  const filas = Array.from({ length: dims.filas }, (_, fila) =>
    Array.from({ length: dims.columnas }, (_, columna) => ({ fila, columna })),
  );

  return (
    <div className="@container min-w-0">
      {/* minmax(0, auto): si el bancal no cabe, la columna del marco encoge y
          se desplaza lo de DENTRO; el marco y las cotas se quedan quietos. */}
      <div className="grid w-fit max-w-full grid-cols-[minmax(0,auto)_auto] gap-2">
        <Cota texto={`${ancho} cm`} />
        <span />
        <div
          ref={refRejilla}
          role="grid"
          aria-label={`${nombre}, ${dims.filas} ${dims.filas === 1 ? "fila" : "filas"} por ${dims.columnas} ${dims.columnas === 1 ? "columna" : "columnas"}`}
          className="min-w-0 border-4 border-double border-marco bg-lapiz/70"
        >
          <div className="overflow-x-auto p-px [scrollbar-color:var(--color-lapiz)_transparent] [scrollbar-width:thin]">
            <div className="flex w-fit flex-col gap-px">
            {filas.map((celdas, f) => (
              <div key={`fila-${f}`} role="row" className="grid gap-px" style={{ gridTemplateColumns: `repeat(${dims.columnas}, ${columna})` }}>
                {celdas.map((celda) => {
                  const plantacion = porCelda.get(clave(celda));
                  return (
                    <div key={clave(celda)} role="gridcell">
                      <BotonCelda
                        refBoton={(boton) => {
                          if (boton) botones.current.set(clave(celda), boton);
                          else botones.current.delete(clave(celda));
                        }}
                        celda={celda}
                        plantacion={plantacion}
                        cultivo={plantacion && cultivosPorId.get(plantacion.cultivoId)}
                        activa={celda.fila === activa.fila && celda.columna === activa.columna}
                        onClick={() => {
                          onActivar(celda);
                          onUsar(celda);
                        }}
                        onKeyDown={(evento) => alPulsarTecla(evento, celda)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
            </div>
          </div>
        </div>
        <Cota texto={`${largo} cm`} vertical />
      </div>
    </div>
  );
}

interface BotonCeldaProps {
  refBoton: Ref<HTMLButtonElement>;
  celda: Celda;
  plantacion?: Plantacion;
  cultivo?: Cultivo;
  /** La celda activa es la única en el orden de Tab (roving tabindex). */
  activa: boolean;
  onClick: () => void;
  onKeyDown: (evento: KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * Una celda: la tierra y, si está plantada, el icono con el nombre corto. Su
 * nombre accesible dice todo lo que dice el dibujo (frontend-a11y §3).
 */
function BotonCelda({ refBoton, celda, plantacion, cultivo, activa, onClick, onKeyDown }: BotonCeldaProps) {
  const contenido = plantacion ? (cultivo?.nombre.toLowerCase() ?? "cultivo desconocido") : "vacía";
  return (
    <button
      ref={refBoton}
      type="button"
      tabIndex={activa ? 0 : -1}
      aria-label={`Fila ${celda.fila + 1}, columna ${celda.columna + 1}: ${contenido}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      // En el móvil la banda fija de la paleta tapa el borde de abajo, pero el
      // navegador cuenta esa celda como visible y no desplaza: se trae a la
      // vista a mano, con un margen del alto de la banda (scroll-mb).
      onFocus={(evento) => evento.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
      // @container: el icono y el nombre crecen con la celda. El anillo de foco
      // va por dentro (offset negativo): el desplazamiento del marco lo cortaría.
      className="@container relative flex aspect-square w-full scroll-mb-36 flex-col items-center justify-center gap-0.5 bg-tierra p-0.5 text-tinta transition-colors duration-100 hover:bg-superficie-elevada focus-visible:z-10 focus-visible:-outline-offset-4 motion-safe:active:scale-[0.97] lg:scroll-mb-0"
    >
      {plantacion && (
        // key: al cambiar de cultivo, el dibujo nuevo vuelve a brotar.
        <span key={plantacion.cultivoId} className="flex max-w-full flex-col items-center gap-0.5 motion-safe:animate-brotar">
          <span className="[&>svg]:size-[max(1.5rem,40cqi)]">
            <IconoCultivo cultivoId={plantacion.cultivoId} />
          </span>
          {/* En Fraunces (la letra de los cultivos). En una celda de menos de
              60 px, la abreviatura de cuaderno («Remol.»); en una mayor, el
              nombre entero en dos líneas como mucho. Nunca cortado a mitad. */}
          <span
            aria-hidden="true"
            className="max-w-full text-center font-titulos text-[max(0.625rem,11cqi)] leading-tight"
          >
            <span className="@[3.75rem]:hidden">{cultivo ? nombreCorto(cultivo.nombre) : "?"}</span>
            <span className="hidden @[3.75rem]:line-clamp-2">{cultivo?.nombre ?? "?"}</span>
          </span>
        </span>
      )}
    </button>
  );
}
