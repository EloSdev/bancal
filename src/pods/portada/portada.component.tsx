// La portada: qué es Bancal, el bancal de ejemplo dibujado a tinta, cómo
// funciona en tres pasos, la tira de cultivos (llega del contenedor) y una
// última invitación. Props → render: los datos los carga el contenedor.
import { Link } from "@tanstack/react-router";
import { useId, type ReactNode } from "react";
import { claseBoton } from "../../common/components/boton";
import { Cota } from "../../common/components/cota";
import { IconoCultivo } from "../../common/components/icono-cultivo";
import { IconoEstado } from "../../common/components/icono-estado";
import { IconoCompatibilidad } from "../../common/components/marca-compatibilidad";
import { BancalEjemplo } from "./bancal-ejemplo.component";

export function Portada({ tira }: { tira: ReactNode }) {
  return (
    <div className="space-y-20 pb-6 sm:space-y-28 sm:pt-6">
      <Presentacion />
      <ComoFunciona />
      {tira}
      <Invitacion />
    </div>
  );
}

function Presentacion() {
  return (
    <div className="grid items-center gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="space-y-6">
        <p className="text-sm font-medium tracking-widest text-tinta-suave uppercase">Cuaderno de huerto urbano</p>
        <h1 className="text-4xl leading-[1.1] sm:text-5xl">
          Dibuja tu bancal y descubre qué plantas <Subrayado>se llevan bien</Subrayado>
        </h1>
        <p className="max-w-[34rem] text-lg text-tinta-suave">
          Mide tu bancal, coloca cada cultivo en su celda de 30 × 30 cm y Bancal te dice al momento qué vecinos se
          ayudan, cuáles se perjudican, si les llega el sol y qué toca sembrar o cosechar cada mes.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/bancales/nuevo" className={claseBoton("primario")}>
            Crear mi primer bancal
          </Link>
          <Link to="/cultivos" className={claseBoton("secundario")}>
            Explorar cultivos
          </Link>
        </div>
        <p className="text-sm text-tinta-suave">Sin registro: tus bancales se guardan en este navegador.</p>
        <ul className="flex flex-wrap gap-x-8 gap-y-3 border-t border-lapiz pt-5">
          <Dato valor="24" texto="cultivos con fuentes" />
          <Dato valor="3" texto="zonas climáticas" />
          <Dato valor="12" texto="meses de temporada" />
        </ul>
      </div>
      <BancalEjemplo />
    </div>
  );
}

/** Un trazo de pluma a mano bajo las palabras: se dibuja al abrir la portada. */
function Subrayado({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
        className="absolute inset-x-0 -bottom-2 h-3 w-full fill-none stroke-acento"
      >
        <path
          d="M2 8c30-5 70-6 110-4s60 3 86-1"
          pathLength={1}
          strokeWidth={3}
          strokeLinecap="round"
          className="[stroke-dasharray:1] motion-safe:animate-pluma"
        />
      </svg>
    </span>
  );
}

function Dato({ valor, texto }: { valor: string; texto: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="font-titulos text-3xl font-semibold tabular-nums">{valor}</span>
      <span className="text-sm text-tinta-suave">{texto}</span>
    </li>
  );
}

function ComoFunciona() {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className="space-y-8">
      <h2 id={idTitulo} className="text-3xl">
        Cómo funciona
      </h2>
      <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
        <Paso numero={1} titulo="Mide tu bancal" dibujo={<Cota texto="120 cm" />}>
          Ancho, largo y horas de sol. Bancal lo dibuja a escala, en celdas de 30 × 30 cm.
        </Paso>
        <Paso
          numero={2}
          titulo="Coloca tus cultivos"
          dibujo={
            <span className="flex gap-3">
              <IconoCompatibilidad tipo="favorable" />
              <IconoCompatibilidad tipo="desfavorable" />
              <IconoCompatibilidad tipo="neutra" />
            </span>
          }
        >
          Con el ratón, el dedo o el teclado. Cada vecino se marca al momento: se ayudan, se perjudican o sin efecto, y
          el porqué en una línea.
        </Paso>
        <Paso
          numero={3}
          titulo="Mira pasar el año"
          dibujo={
            <span className="flex items-center gap-1.5 text-tinta [&>svg]:size-6">
              <IconoEstado estado="semilla" />
              <Flecha />
              <IconoEstado estado="brote" />
              <Flecha />
              <IconoCultivo cultivoId="tomate" />
            </span>
          }
        >
          Desliza los meses y verás cada planta sembrada, creciendo o en cosecha, con lo que toca hacer ese mes.
        </Paso>
      </ol>
    </section>
  );
}

function Flecha() {
  return <span className="text-tinta-suave">→</span>;
}

interface PasoProps {
  numero: number;
  titulo: string;
  dibujo: ReactNode;
  children: ReactNode;
}

function Paso({ numero, titulo, dibujo, children }: PasoProps) {
  return (
    <li className="space-y-3 border-t border-lapiz pt-4">
      <div className="flex h-10 items-center justify-between gap-4">
        {/* El número ya lo dice la lista ordenada. */}
        <span aria-hidden="true" className="font-titulos text-4xl font-light text-tinta-suave tabular-nums">
          {numero}
        </span>
        <span aria-hidden="true" className="flex w-32 justify-end">
          {dibujo}
        </span>
      </div>
      <h3>{titulo}</h3>
      <p className="text-tinta-suave">{children}</p>
    </li>
  );
}

function Invitacion() {
  return (
    <section className="flex flex-col items-start justify-between gap-6 rounded-hoja border border-lapiz bg-superficie-elevada p-6 sm:flex-row sm:items-center sm:p-8">
      <div className="space-y-2">
        <h2 className="text-2xl">Tu primer bancal, en un minuto</h2>
        <p className="text-tinta-suave">Solo necesitas un metro y saber cuántas horas de sol le llegan.</p>
      </div>
      <Link to="/bancales/nuevo" className={claseBoton("primario")}>
        Empezar a dibujar
      </Link>
    </section>
  );
}

interface TiraCultivosProps {
  cultivos: { id: string; nombre: string }[] | null;
  /** Lo que se enseña mientras carga o si falla (el contenedor decide). */
  estado?: ReactNode;
}

export function TiraCultivos({ cultivos, estado }: TiraCultivosProps) {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="space-y-2">
          <h2 id={idTitulo} className="text-3xl">
            Cultivos que caben en una celda
          </h2>
          <p className="max-w-[36rem] text-tinta-suave">
            Hortalizas, aromáticas y flores amigas, con su calendario por zona climática y las fuentes citadas.
          </p>
        </div>
        <Link to="/cultivos">Ver el catálogo con sus filtros</Link>
      </div>
      {estado}
      {cultivos && (
        <ul
          aria-label="Cultivos del catálogo"
          className="grid grid-cols-3 border-t border-l border-lapiz min-[480px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8"
        >
          {cultivos.map((cultivo) => (
            <li key={cultivo.id} className="border-r border-b border-lapiz">
              <Link
                to="/cultivos/$cultivoId"
                params={{ cultivoId: cultivo.id }}
                className="flex h-full flex-col items-center gap-2 px-1 py-4 text-center text-sm text-tinta no-underline transition-colors duration-150 hover:bg-tierra focus-visible:rounded-none focus-visible:-outline-offset-2 [&>svg]:size-8"
              >
                <IconoCultivo cultivoId={cultivo.id} />
                <span>{cultivo.nombre}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
