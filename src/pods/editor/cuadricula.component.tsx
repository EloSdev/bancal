// La cuadrícula del bancal, dibujada a tinta y a escala (docs/brief.md: marco
// de tablones con doble línea, tierra, cuadrícula a lápiz y las cotas fuera).
// Patrón grid con roving tabindex (frontend-a11y §3): una sola celda en el
// orden de Tab, las flechas / Inicio / Fin mueven el foco, Intro y Espacio
// (botón nativo) colocan, Supr y Retroceso quitan. El tamaño de las celdas
// sale del hueco que tiene la cuadrícula (container queries), entre 44 px
// (el dedo) y 7 rem; si no cabe, se desplaza dentro de su marco.
// Cada celda plantada lleva en la esquina la marca de cómo se lleva con sus
// vecinos (✓ círculo, ✕ rombo, – cápsula) y, si la planta tiene un aviso
// propio (sol, temporada), un triángulo en la otra esquina (T14).
import { useId, useRef, type KeyboardEvent, type Ref } from "react";
import { IconoEstado } from "../../common/components/icono-estado";
import { estadoPlanta, textoEstado } from "../../core/bancales/temporada";
import { Cota } from "../../common/components/cota";
import { IconoCultivo } from "../../common/components/icono-cultivo";
import { IconoAvisoPlanta, IconoCompatibilidad } from "../../common/components/marca-compatibilidad";
import { moverCelda, type Dimensiones, type Movimiento } from "../../core/bancales/cuadricula";
import type { Aviso, Celda, EstadoPlanta, Plantacion } from "../../core/bancales/model";
import { estadoVecindad, type EstadoVecindad } from "../../core/bancales/vecindad";
import { nombreCorto, nombreMes } from "../../core/cultivos/etiquetas";
import type { Cultivo, Mes, ZonaClimatica } from "../../core/cultivos/model";

interface CuadriculaProps {
  /** La rejilla, para que el editor lleve el foco a una celda (activa, o la de un aviso). */
  refRejilla?: Ref<HTMLDivElement>;
  nombre: string;
  ancho: number;
  largo: number;
  dims: Dimensiones;
  plantaciones: Plantacion[];
  cultivosPorId: Map<string, Cultivo>;
  /** Los avisos del bancal (derivados): los de sol y temporada se marcan en su celda. */
  avisos: Aviso[];
  /** El mes de la temporada y la zona del bancal: dan el estado de cada planta (T15). */
  mes: Mes;
  zona: ZonaClimatica;
  /** La celda que está en el orden de Tab. */
  activa: Celda;
  /** La celda a la que se acaba de ir desde un aviso: se señala un momento. */
  senalada?: Celda | null;
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

export const claveCelda = ({ fila, columna }: Celda) => `${fila}-${columna}`;

export function Cuadricula(props: CuadriculaProps) {
  const { refRejilla, nombre, ancho, largo, dims, plantaciones, cultivosPorId, avisos, mes, zona, activa, senalada } = props;
  const { onActivar, onUsar, onQuitar } = props;
  const botones = useRef(new Map<string, HTMLButtonElement>());
  const porCelda = new Map(plantaciones.map((p) => [claveCelda(p.celda), p]));
  const cultivos = [...cultivosPorId.values()];
  const avisosDe = (celda: Celda) =>
    avisos.flatMap((a) => (a.tipo !== "vecindad" && claveCelda(a.celda) === claveCelda(celda) ? [a.tipo] : []));

  const alPulsarTecla = (evento: KeyboardEvent<HTMLButtonElement>, celda: Celda) => {
    const movimiento = TECLAS[evento.key];
    if (movimiento) {
      evento.preventDefault(); // las flechas no desplazan la página
      const siguiente = moverCelda(celda, movimiento, dims);
      onActivar(siguiente);
      botones.current.get(claveCelda(siguiente))?.focus();
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
                    const plantacion = porCelda.get(claveCelda(celda));
                    const cultivo = plantacion && cultivosPorId.get(plantacion.cultivoId);
                    return (
                      <div key={claveCelda(celda)} role="gridcell">
                        <BotonCelda
                          refBoton={(boton) => {
                            if (boton) botones.current.set(claveCelda(celda), boton);
                            else botones.current.delete(claveCelda(celda));
                          }}
                          celda={celda}
                          plantacion={plantacion}
                          cultivo={cultivo}
                          estado={plantacion && cultivo ? estadoPlanta(plantacion, cultivo, zona, mes) : undefined}
                          mes={mes}
                          vecindad={estadoVecindad(celda, plantaciones, cultivos, dims)}
                          avisosPropios={avisosDe(celda)}
                          nombreDe={(id) => cultivosPorId.get(id)?.nombre.toLowerCase() ?? id}
                          activa={celda.fila === activa.fila && celda.columna === activa.columna}
                          senalada={senalada?.fila === celda.fila && senalada.columna === celda.columna}
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
  /** El estado de la planta en el mes elegido (T15); sin planta, nada. */
  estado?: EstadoPlanta;
  mes: Mes;
  /** Cómo se lleva con sus vecinos (null: vacía o sin vecinos plantados). */
  vecindad: EstadoVecindad | null;
  avisosPropios: ("sol" | "fuera-de-temporada")[];
  nombreDe: (cultivoId: string) => string;
  /** La celda activa es la única en el orden de Tab (roving tabindex). */
  activa: boolean;
  senalada: boolean;
  onClick: () => void;
  onKeyDown: (evento: KeyboardEvent<HTMLButtonElement>) => void;
}

const MARCA = "absolute top-0 [&>svg]:size-3 @[3.75rem]:top-0.5 @[3.75rem]:[&>svg]:size-[max(1rem,14cqi)]";

// «hinojo, col y patata»: la conjunción solo antes del último.
const enumeracion = new Intl.ListFormat("es", { type: "conjunction" });
const lista = (nombres: string[]) => enumeracion.format(nombres);

/** Lo que dicen las marcas, en palabras: va en el nombre accesible de la celda. */
function textoMarcas(vecindad: EstadoVecindad | null, avisosPropios: BotonCeldaProps["avisosPropios"], nombreDe: (id: string) => string) {
  const partes: string[] = [];
  if (vecindad) {
    if (vecindad.desfavorables.length > 0) partes.push(`se perjudica con ${lista(vecindad.desfavorables.map(nombreDe))}`);
    if (vecindad.favorables.length > 0) partes.push(`se ayuda con ${lista(vecindad.favorables.map(nombreDe))}`);
    if (vecindad.compatibilidad === "neutra") partes.push("sin efecto con sus vecinos");
  }
  if (avisosPropios.includes("sol")) partes.push("le falta sol");
  // «siembra», no «sembrado»: concuerda con todos los cultivos (albahaca, tomate).
  if (avisosPropios.includes("fuera-de-temporada")) partes.push("siembra fuera de temporada");
  return partes.map((p) => `, ${p}`).join("");
}

/**
 * Una celda: la tierra y, si está plantada, el icono con el nombre corto y
 * sus marcas. Su nombre accesible dice todo lo que dicen los dibujos
 * (frontend-a11y §3): la compatibilidad nunca va solo en el color.
 */
function BotonCelda(props: BotonCeldaProps) {
  const { refBoton, celda, plantacion, cultivo, estado, mes, vecindad, avisosPropios, nombreDe, activa, senalada } = props;
  const { onClick, onKeyDown } = props;
  const idEstado = useId();
  const contenido = plantacion ? (cultivo?.nombre.toLowerCase() ?? "cultivo desconocido") : "vacía";
  return (
    <button
      ref={refBoton}
      type="button"
      data-celda={claveCelda(celda)}
      data-estado={estado?.tipo}
      // El estado de la planta en el mes va en la descripción (C15.2): el
      // nombre sigue siendo la posición, el cultivo y su vecindad.
      aria-describedby={estado ? idEstado : undefined}
      // Señalada un momento al llegar desde un aviso: con el ratón el foco no se ve.
      data-senalada={senalada}
      tabIndex={activa ? 0 : -1}
      aria-label={`Fila ${celda.fila + 1}, columna ${celda.columna + 1}: ${contenido}${textoMarcas(vecindad, avisosPropios, nombreDe)}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      // En el móvil la banda fija de la paleta tapa el borde de abajo, pero el
      // navegador cuenta esa celda como visible y no desplaza: se trae a la
      // vista a mano, con un margen del alto de la banda (scroll-mb).
      onFocus={(evento) => evento.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
      // @container: el icono y el nombre crecen con la celda. El anillo de foco
      // va por dentro (offset negativo): el desplazamiento del marco lo cortaría.
      className="@container relative flex aspect-square w-full scroll-mb-36 flex-col items-center justify-center gap-0.5 bg-tierra p-0.5 text-tinta transition-colors duration-100 hover:bg-superficie-elevada focus-visible:z-10 focus-visible:-outline-offset-4 motion-safe:active:scale-[0.97] lg:scroll-mb-0 data-[senalada=true]:bg-superficie-elevada data-[senalada=true]:outline-2 data-[senalada=true]:-outline-offset-4 data-[senalada=true]:outline-acento"
    >
      {/* Las marcas crecen con la celda; por debajo de 60 px van más pequeñas
          (12 px) y pegadas a las esquinas para no tapar el icono. */}
      {vecindad && (
        <span className={MARCA + " right-0 @[3.75rem]:right-0.5"}>
          <IconoCompatibilidad tipo={vecindad.compatibilidad} pequeno />
        </span>
      )}
      {avisosPropios.length > 0 && (
        <span className={MARCA + " left-0 @[3.75rem]:left-0.5"}>
          <IconoAvisoPlanta pequeno />
        </span>
      )}
      {estado && (
        <span id={idEstado} className="sr-only">
          {mayuscula(nombreMes(mes))}: {textoEstado(estado)}
        </span>
      )}
      {plantacion && (
        // key: al cambiar de cultivo o de estado, el dibujo nuevo brota
        // (C15.3: animación CSS, solo con motion-safe).
        <span
          key={`${plantacion.cultivoId}-${estado?.tipo}`}
          className="flex max-w-full flex-col items-center gap-0.5 pt-2 motion-safe:animate-brotar @[3.75rem]:pt-0"
        >
          <span className="[&_svg]:size-5 @[3.75rem]:[&_svg]:size-[max(1.5rem,40cqi)]">
            <DibujoEstado cultivoId={plantacion.cultivoId} estado={estado} />
          </span>
          {/* En Fraunces (la letra de los cultivos). En una celda de menos de
              60 px, la abreviatura de cuaderno («Remol.»); en una mayor, el
              nombre entero en dos líneas como mucho. Nunca cortado a mitad. */}
          <span aria-hidden="true" className="max-w-full text-center font-titulos text-[max(0.625rem,11cqi)] leading-tight">
            <span className="@[3.75rem]:hidden">{cultivo ? nombreCorto(cultivo.nombre) : "?"}</span>
            <span className="hidden @[3.75rem]:line-clamp-2">{cultivo?.nombre ?? "?"}</span>
          </span>
        </span>
      )}
    </button>
  );
}

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * El dibujo de la planta en su estado: semilla y brote compartidos, el icono
 * del cultivo en cosecha, a lápiz (tenue) si aún no se ha sembrado, y el
 * rastrojo cuando la celda ya queda libre.
 */
function DibujoEstado({ cultivoId, estado }: { cultivoId: string; estado?: EstadoPlanta }) {
  switch (estado?.tipo) {
    case "sembrada":
      return <IconoEstado estado="semilla" />;
    case "creciendo":
      return <IconoEstado estado="brote" />;
    case "terminada":
      return <IconoEstado estado="rastrojo" />;
    case "por-sembrar":
      return (
        <span className="text-tinta-suave opacity-60">
          <IconoCultivo cultivoId={cultivoId} />
        </span>
      );
    default:
      return <IconoCultivo cultivoId={cultivoId} />;
  }
}
