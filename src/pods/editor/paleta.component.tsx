// La paleta: qué se pone al tocar una celda. Una barra de herramientas
// (role="toolbar") de botones con aria-pressed: un cultivo o «Quitar». Es un
// solo punto de Tab y las flechas / Inicio / Fin la recorren (roving
// tabindex, como la cuadrícula): llegar al bancal no cuesta 25 Tabs. En el
// móvil es una fila que se desplaza; en escritorio, dos columnas compactas.
// El elegido va en pluma azul: es la herramienta activa, no un dato.
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { IconoCultivo } from "../../common/components/icono-cultivo";
import type { Cultivo } from "../../core/cultivos/model";

export type Herramienta = { tipo: "cultivo"; cultivoId: string } | { tipo: "quitar" } | null;

interface PaletaProps {
  cultivos: Cultivo[];
  elegida: Herramienta;
  onElegir: (herramienta: Herramienta) => void;
}

const ANTERIOR = new Set(["ArrowLeft", "ArrowUp"]);
const SIGUIENTE = new Set(["ArrowRight", "ArrowDown"]);

export function Paleta({ cultivos, elegida, onElegir }: PaletaProps) {
  const opciones: { clave: string; herramienta: Exclude<Herramienta, null>; nombre: string; dibujo: ReactNode }[] = [
    { clave: "quitar", herramienta: { tipo: "quitar" }, nombre: "Quitar", dibujo: <Goma /> },
    ...cultivos.map((c) => ({
      clave: c.id,
      herramienta: { tipo: "cultivo" as const, cultivoId: c.id },
      nombre: c.nombre,
      dibujo: <IconoCultivo cultivoId={c.id} />,
    })),
  ];
  const esElegida = (h: Exclude<Herramienta, null>) =>
    elegida !== null &&
    elegida.tipo === h.tipo &&
    (h.tipo === "quitar" || (elegida.tipo === "cultivo" && elegida.cultivoId === h.cultivoId));

  // El punto de Tab: el último botón que tuvo el foco (al principio, el elegido o el primero).
  const [foco, setFoco] = useState(() => Math.max(0, opciones.findIndex((o) => esElegida(o.herramienta))));
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  const mover = (evento: KeyboardEvent, desde: number) => {
    let hacia: number | null = null;
    if (ANTERIOR.has(evento.key)) hacia = Math.max(0, desde - 1);
    else if (SIGUIENTE.has(evento.key)) hacia = Math.min(opciones.length - 1, desde + 1);
    else if (evento.key === "Home") hacia = 0;
    else if (evento.key === "End") hacia = opciones.length - 1;
    if (hacia === null) return;
    evento.preventDefault();
    setFoco(hacia);
    botones.current[hacia]?.focus();
  };

  return (
    // En escritorio, dos columnas que se desplazan dentro de su hueco: la
    // cuadrícula no se va de la vista al elegir el último cultivo. p-1: que
    // el anillo de foco no se recorte en el borde del desplazamiento.
    <div
      role="toolbar"
      aria-label="Cultivos para plantar"
      className="flex gap-2 overflow-x-auto p-1 [scrollbar-width:thin] lg:grid lg:max-h-[calc(100dvh-12rem)] lg:grid-cols-2 lg:overflow-y-auto"
    >
      {opciones.map((opcion, i) => {
        const pulsado = esElegida(opcion.herramienta);
        return (
          <BotonPaleta
            key={opcion.clave}
            refBoton={(boton) => {
              botones.current[i] = boton;
            }}
            pulsado={pulsado}
            enTab={i === foco}
            onFocus={() => setFoco(i)}
            onKeyDown={(evento) => mover(evento, i)}
            onClick={() => onElegir(pulsado ? null : opcion.herramienta)}
          >
            {opcion.dibujo}
            {opcion.nombre}
          </BotonPaleta>
        );
      })}
    </div>
  );
}

interface BotonPaletaProps {
  refBoton: (boton: HTMLButtonElement | null) => void;
  pulsado: boolean;
  enTab: boolean;
  onFocus: () => void;
  onKeyDown: (evento: KeyboardEvent) => void;
  onClick: () => void;
  children: ReactNode;
}

function BotonPaleta({ refBoton, pulsado, enTab, onFocus, onKeyDown, onClick, children }: BotonPaletaProps) {
  return (
    <button
      ref={refBoton}
      type="button"
      aria-pressed={pulsado}
      tabIndex={enTab ? 0 : -1}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onClick={onClick}
      // Pegatina: el cultivo elegido se queda «pegado» en azul pluma con su sombra dura.
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control border-2 border-tinta bg-superficie-elevada px-2 py-1.5 text-left text-sm font-medium text-tinta transition-[translate,box-shadow,background-color,color] duration-100 hover:bg-girasol motion-safe:active:translate-0.5 aria-pressed:bg-acento aria-pressed:text-sobre-acento aria-pressed:shadow-[2px_2px_0_var(--color-tinta)] lg:min-h-9 lg:w-full lg:py-1"
    >
      {children}
    </button>
  );
}

/** Una goma de borrar, a tinta, como los iconos de cultivo. */
function Goma() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-6 shrink-0">
      <path d="M8.5 19.5 3.8 14.8c-.6-.6-.6-1.6 0-2.2l8.6-8.6c.6-.6 1.6-.6 2.2 0l5.2 5.2c.6.6.6 1.6 0 2.2l-7.8 7.8M8.5 19.5H20M7.5 10.5l6.2 6.2" />
    </svg>
  );
}
