// La portada, «cuaderno pop» (docs/brief.md): fotos reales de huerto con
// borde y sombra dura, Fraunces muy gruesa, pegatinas en girasol, una cinta
// de cultivos que desfila, un bento oscuro con lo que vigila la app (el
// bancal dibujado a tinta en el centro) y una invitación final en azul.
// Props → render: la tira de cultivos y las notas de la foto llegan del contenedor.
import { Link } from "@tanstack/react-router";
import { useId, type ReactNode } from "react";
import { claseBoton } from "../../common/components/boton";
import { IconoCultivo } from "../../common/components/icono-cultivo";
import { IconoEstado } from "../../common/components/icono-estado";
import { IconoAvisoPlanta, IconoCompatibilidad, MarcaCompatibilidad } from "../../common/components/marca-compatibilidad";
import { FOTOS, fuenteFoto, type Foto } from "../../common/fotos";
import { etiquetaZona, nombreMes } from "../../core/cultivos/etiquetas";
import type { Cultivo, Mes, ZonaClimatica } from "../../core/cultivos/model";
import type { Pareja } from "../../core/cultivos/parejas";
import { BancalEjemplo } from "./bancal-ejemplo.component";

// El mismo ancho que la cabecera y el resto de pantallas: los bordes se alinean.
const CONTENEDOR = "mx-auto max-w-5xl px-4";

/** Lo que dicen las notas pegadas a la foto (T23); null mientras llega el catálogo. */
export interface NotasFoto {
  mes: Mes;
  zona: ZonaClimatica;
  /** Lo que se siembra este mes en esa zona, por orden alfabético. */
  siembra: Cultivo[];
  ayudan?: Pareja;
  perjudican?: Pareja;
}

interface PortadaProps {
  notas: NotasFoto | null;
  tira: ReactNode;
}

export function Portada({ notas, tira }: PortadaProps) {
  return (
    <>
      <Presentacion notas={notas} />
      <Cinta />
      <ComoFunciona />
      <LoQueVigila />
      {tira}
      <Invitacion />
    </>
  );
}

/* ───────────── Presentación ───────────── */

function Presentacion({ notas }: { notas: NotasFoto | null }) {
  return (
    // overflow-hidden: las pegatinas que asoman por los bordes no ensanchan la página.
    <section className="overflow-hidden">
      <div className={`${CONTENEDOR} grid items-center gap-x-12 gap-y-16 pt-12 pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:pb-28`}>
        <div className="space-y-7 motion-safe:animate-aparecer">
          <Pegatina giro="-rotate-2">Planificador de huertos urbanos</Pegatina>
          <h1 className="text-5xl leading-[0.95] font-black tracking-tight sm:text-6xl lg:text-7xl">
            Dibuja tu bancal y descubre qué plantas <Resaltado>se llevan bien</Resaltado>
          </h1>
          <p className="max-w-xl text-lg text-tinta-suave sm:text-xl">
            Mide tu bancal, coloca cada cultivo en su celda de 30 × 30 cm y Bancal te dice al momento qué vecinos se
            ayudan, cuáles se perjudican, si les llega el sol y qué toca sembrar o cosechar cada mes.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/bancales/nuevo" className={claseBoton("primario")}>
              Crear mi primer bancal <span aria-hidden="true">→</span>
            </Link>
            <Link to="/cultivos" className={claseBoton("secundario")}>
              Explorar cultivos
            </Link>
          </div>
          <p className="text-sm text-tinta-suave">Gratis y sin registro: tus bancales se guardan en este navegador.</p>
        </div>
        <FotoPrincipal notas={notas} />
      </div>
    </section>
  );
}

/** Marcador girasol que se pinta de izquierda a derecha detrás de las palabras. */
function Resaltado({ children }: { children: ReactNode }) {
  return (
    <span className="bg-linear-to-b from-transparent from-58% to-girasol to-58% box-decoration-clone bg-no-repeat px-1 motion-safe:animate-resaltar">
      {children}
    </span>
  );
}

function Pegatina({ giro, children }: { giro: string; children: ReactNode }) {
  return (
    <p
      className={`w-fit rounded-full border-2 border-tinta bg-girasol px-4 py-1 text-sm font-bold text-tinta shadow-pegatina ${giro}`}
    >
      {children}
    </p>
  );
}

function FotoPrincipal({ notas }: { notas: NotasFoto | null }) {
  return (
    <div className="relative mx-auto w-full max-w-md motion-safe:animate-aparecer motion-safe:[animation-delay:150ms] lg:max-w-none">
      <Imagen
        foto={FOTOS.bancal}
        prioridad
        // Se recorta en vertical (4:5) de una foto apaisada: hace falta el
        // doble de ancho del que ocupa para no verse blanda.
        sizes="(min-width: 448px) 900px, 200vw"
        className="aspect-[4/5] w-full rotate-1 rounded-tarjeta border-2 border-tinta object-cover shadow-pegatina-lg"
      />
      <Sello />
      {/* Lo que diría Bancal, en texto, como notas pegadas a la foto (T23).
          Llegan con el catálogo: hasta entonces no hay notas, ni provisionales. */}
      {notas?.ayudan && (
        <NotaVecinos tipo="favorable" pareja={notas.ayudan} className="top-14 -right-1 rotate-2 sm:-right-6" />
      )}
      {notas?.perjudican && (
        <NotaVecinos tipo="desfavorable" pareja={notas.perjudican} className="bottom-28 -left-1 -rotate-2 sm:-left-8" />
      )}
      {notas && notas.siembra.length > 0 && <NotaDelMes notas={notas} />}
    </div>
  );
}

// «tomate e hinojo», «ajo, guisante y 2 más»: la conjunción la pone Intl (y → e).
const enumeracion = new Intl.ListFormat("es", { type: "conjunction" });
const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

interface NotaVecinosProps {
  tipo: "favorable" | "desfavorable";
  pareja: Pareja;
  /** Dónde va pegada y su giro. */
  className: string;
}

function NotaVecinos({ tipo, pareja, className }: NotaVecinosProps) {
  const quienes = mayuscula(enumeracion.format([pareja.a.nombre.toLowerCase(), pareja.b.nombre.toLowerCase()]));
  return (
    // Hasta 18 rem: «Judía verde y capuchina se perjudican» parte en dos líneas sin salirse.
    <p
      className={`absolute flex max-w-72 items-center gap-2 rounded-tarjeta border-2 border-tinta bg-superficie-elevada px-3 py-1.5 text-sm leading-tight font-semibold text-balance shadow-pegatina ${className}`}
    >
      <IconoCompatibilidad tipo={tipo} />
      <span>
        {quienes} {tipo === "favorable" ? "se ayudan" : "se perjudican"}
      </span>
    </p>
  );
}

/** «Noviembre · zona atlántica — Toca sembrar ajo, guisante y 2 más», con el dibujo del primero. */
function NotaDelMes({ notas }: { notas: NotasFoto }) {
  const [primero, segundo, ...resto] = notas.siembra.map((c) => c.nombre.toLowerCase());
  const nombres = [primero, segundo, resto.length > 0 && `${resto.length} más`].filter((n): n is string => Boolean(n));
  return (
    <p className="absolute right-3 -bottom-6 flex max-w-72 -rotate-1 items-center gap-3 rounded-tarjeta border-2 border-tinta bg-girasol px-4 py-2 font-semibold shadow-pegatina [&>svg]:size-8 [&>svg]:shrink-0">
      <IconoCultivo cultivoId={notas.siembra[0]!.id} />
      <span className="leading-tight">
        <span className="block text-xs font-bold tracking-widest whitespace-nowrap uppercase">
          {nombreMes(notas.mes)} · zona {etiquetaZona[notas.zona].toLowerCase()}
        </span>
        Toca sembrar {enumeracion.format(nombres)}
      </span>
    </p>
  );
}

/** Sello redondo que gira despacio en la esquina de la foto (decorativo). */
function Sello() {
  return (
    <div
      aria-hidden="true"
      className="absolute -top-10 -left-3 grid size-28 place-items-center rounded-full border-2 border-tinta bg-girasol shadow-pegatina sm:-left-10 sm:size-32"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full motion-safe:animate-girar">
        <defs>
          <path id="sello-circulo" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text className="fill-tinta text-[9.5px] font-bold uppercase">
          <textPath href="#sello-circulo" textLength="230" lengthAdjust="spacing">
            A escala · celda a celda · 30 × 30 cm ·
          </textPath>
        </text>
      </svg>
      <span className="text-tinta [&>svg]:size-10">
        <IconoCultivo cultivoId="lechuga" />
      </span>
    </div>
  );
}

interface ImagenProps {
  foto: Foto;
  sizes: string;
  className: string;
  /** La foto de arriba se pide la primera; el resto, al acercarse. */
  prioridad?: boolean;
}

function Imagen({ foto, sizes, className, prioridad = false }: ImagenProps) {
  return (
    <img
      src={fuenteFoto(foto, 800)}
      srcSet={`${fuenteFoto(foto, 800)} 800w, ${fuenteFoto(foto, 1600)} 1600w`}
      sizes={sizes}
      width={foto.ancho}
      height={foto.alto}
      alt={foto.alt}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  );
}

/* ───────────── Cinta de cultivos ───────────── */

const CINTA: [string, string][] = [
  ["tomate", "Tomate"],
  ["albahaca", "Albahaca"],
  ["lechuga", "Lechuga"],
  ["zanahoria", "Zanahoria"],
  ["fresa", "Fresa"],
  ["hinojo", "Hinojo"],
  ["rabano", "Rábano"],
  ["calendula", "Caléndula"],
  ["judia-verde", "Judía verde"],
  ["ajo", "Ajo"],
  ["pimiento", "Pimiento"],
  ["espinaca", "Espinaca"],
];

/** Decorativa: la lista de verdad, con enlaces, es la tira de más abajo. */
function Cinta() {
  return (
    <div aria-hidden="true" className="overflow-hidden py-6">
      <div className="-mx-[5%] -rotate-2 border-y-2 border-tinta bg-tinta py-4 text-superficie">
        <div className="flex w-max motion-safe:animate-desfilar">
          {[0, 1].map((vuelta) => (
            <ul key={vuelta} className="flex shrink-0 items-center">
              {CINTA.map(([id, nombre]) => (
                <li key={id} className="flex items-center gap-3 px-5 font-titulos text-2xl font-bold sm:text-3xl [&>svg]:size-8">
                  <IconoCultivo cultivoId={id} />
                  {nombre}
                  <span className="pl-5 text-girasol">✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Cómo funciona ───────────── */

function ComoFunciona() {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className={`${CONTENEDOR} py-20 sm:py-28`}>
      <Encabezado
        antetitulo="En tres pasos"
        titulo={
          <h2 id={idTitulo} className="text-4xl font-black sm:text-5xl">
            Cómo funciona
          </h2>
        }
      >
        Si sabes usar un metro, ya sabes usar Bancal.
      </Encabezado>
      <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-6">
        <Paso numero={1} foto={FOTOS.semillero} titulo="Mide tu bancal" color="bg-girasol text-tinta">
          Ancho, largo y horas de sol. Bancal lo dibuja a escala, en celdas de 30 × 30 cm, como un semillero.
        </Paso>
        <Paso numero={2} foto={FOTOS.plantar} titulo="Coloca tus cultivos" color="bg-superficie-elevada text-tinta">
          Con el ratón, el dedo o el teclado. Cada vecino se marca al momento, con el porqué en una línea.
        </Paso>
        <Paso numero={3} foto={FOTOS.cosecha} titulo="Mira pasar el año" color="bg-acento text-sobre-acento">
          Desliza los meses: cada planta sembrada, creciendo o en cosecha, y lo que toca hacer ese mes.
        </Paso>
      </ol>
    </section>
  );
}

function Encabezado({ antetitulo, titulo, children }: { antetitulo: string; titulo: ReactNode; children: ReactNode }) {
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm font-bold tracking-widest uppercase">{antetitulo}</p>
      {titulo}
      <p className="text-lg opacity-80">{children}</p>
    </div>
  );
}

interface PasoProps {
  numero: number;
  foto: Foto;
  titulo: string;
  /** Fondo y color del texto de la tarjeta. */
  color: string;
  children: ReactNode;
}

function Paso({ numero, foto, titulo, color, children }: PasoProps) {
  return (
    <li className={`relative flex flex-col rounded-tarjeta border-2 border-tinta shadow-pegatina ${color}`}>
      {/* El número ya lo dice la lista ordenada: la pegatina es decorativa. */}
      <span
        aria-hidden="true"
        className="absolute -top-5 -left-3 z-10 grid size-12 -rotate-6 place-items-center rounded-full border-2 border-tinta bg-superficie font-titulos text-2xl font-black text-tinta shadow-pegatina"
      >
        {numero}
      </span>
      <Imagen
        foto={foto}
        sizes="(min-width: 768px) 320px, 100vw"
        className="aspect-[4/3] w-full rounded-t-[calc(var(--radius-tarjeta)-2px)] border-b-2 border-tinta object-cover"
      />
      <div className="space-y-2 p-5">
        <h3 className="text-2xl font-bold text-inherit">{titulo}</h3>
        <p>{children}</p>
      </div>
    </li>
  );
}

/* ───────────── Lo que vigila (bento) ───────────── */

function LoQueVigila() {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className="border-y-2 border-tinta bg-tinta py-20 text-superficie sm:py-28">
      <div className={CONTENEDOR}>
        <Encabezado
          antetitulo="Avisos que aconsejan, nunca bloquean"
          titulo={
            <h2 id={idTitulo} className="text-4xl font-black text-superficie sm:text-5xl">
              Mientras plantas, Bancal vigila
            </h2>
          }
        >
          Cada aviso llega con su porqué y lo que puedes hacer. Tú decides.
        </Encabezado>

        <div className="mt-14 grid gap-5 md:grid-cols-6">
          {/* El bancal dibujado a tinta: lo que se ve en el editor. */}
          <div className="grid gap-8 rounded-tarjeta bg-superficie p-6 text-tinta shadow-pegatina-girasol sm:p-8 md:col-span-6 lg:col-span-4 lg:row-span-2">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Vecinos, en vivo</h3>
              <p className="text-tinta-suave">
                Cada celda lleva su marca, con forma propia para que no dependa del color.
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-x-10 gap-y-8">
              <BancalEjemplo />
              <ul className="space-y-3 text-sm" aria-label="Qué dicen las marcas">
                <li>
                  <MarcaCompatibilidad tipo="favorable" />
                </li>
                <li>
                  <MarcaCompatibilidad tipo="desfavorable" />
                </li>
                <li>
                  <MarcaCompatibilidad tipo="neutra" />
                </li>
                <li className="flex items-center gap-2">
                  <IconoAvisoPlanta /> Le falta sol
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 rounded-tarjeta border-2 border-tinta bg-girasol p-6 text-tinta md:col-span-3 lg:col-span-2">
            <h3 className="text-2xl font-bold">¿Le llega el sol?</h3>
            <ul className="space-y-3 text-sm">
              <Exposicion nombre="Pleno sol" horas="6 h o más" ancho="w-full" />
              <Exposicion nombre="Semisombra" horas="de 3 a 6 h" ancho="w-1/2" />
              <Exposicion nombre="Sombra" horas="menos de 3 h" ancho="w-1/4" />
            </ul>
            <p className="text-sm">Si un cultivo pide más sol del que tiene tu bancal, te lo dice.</p>
          </div>

          <div className="relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-tarjeta border-2 border-superficie/20 p-6 md:col-span-3 lg:col-span-2">
            <Imagen
              foto={FOTOS.riego}
              sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
              className="absolute inset-0 -z-10 size-full object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-tinta via-tinta/70 to-transparent" />
            <span aria-hidden="true" className="mb-3 flex items-center gap-2 [&>svg]:size-7">
              <IconoEstado estado="semilla" /> → <IconoEstado estado="brote" /> → <IconoCultivo cultivoId="tomate" />
            </span>
            <h3 className="text-2xl font-bold text-superficie">Mes a mes</h3>
            <p className="text-superficie">De enero a diciembre: sembrada, creciendo, en cosecha o terminada.</p>
          </div>

          <div className="space-y-4 rounded-tarjeta bg-superficie-elevada p-6 text-tinta md:col-span-3">
            <h3 className="text-2xl font-bold">Las tareas del mes</h3>
            <p className="text-tinta-suave">Qué sembrar y qué cosechar en tu bancal, sin mirar el calendario.</p>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Tarea verbo="Sembrar" cultivoId="tomate" nombre="tomate" />
              <Tarea verbo="Sembrar" cultivoId="albahaca" nombre="albahaca" />
              <Tarea verbo="Cosechar" cultivoId="lechuga" nombre="lechuga" />
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-tarjeta border-2 border-tinta bg-acento p-6 text-sobre-acento md:col-span-3">
            <p className="flex items-baseline gap-3">
              <span className="font-titulos text-6xl font-black tabular-nums">24</span>
              <span className="text-lg font-semibold">cultivos que caben en una celda</span>
            </p>
            <p>
              Con su calendario en tres zonas (atlántica, mediterránea e interior), contrastado con guías de
              horticultura españolas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Exposicion({ nombre, horas, ancho }: { nombre: string; horas: string; ancho: string }) {
  return (
    <li className="space-y-1">
      <span className="flex justify-between gap-3">
        <span className="font-bold">{nombre}</span>
        <span className="tabular-nums">{horas}</span>
      </span>
      <span aria-hidden="true" className="block h-2.5 rounded-full border-2 border-tinta bg-superficie">
        <span className={`block h-full rounded-full bg-tinta ${ancho}`} />
      </span>
    </li>
  );
}

function Tarea({ verbo, cultivoId, nombre }: { verbo: string; cultivoId: string; nombre: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-2 border-tinta bg-superficie px-3 py-1.5 [&>svg]:size-5">
      <IconoCultivo cultivoId={cultivoId} />
      {verbo} {nombre}
    </span>
  );
}

/* ───────────── Tira de cultivos ───────────── */

interface TiraCultivosProps {
  cultivos: { id: string; nombre: string }[] | null;
  /** Lo que se enseña mientras carga o si falla (el contenedor decide). */
  estado?: ReactNode;
}

export function TiraCultivos({ cultivos, estado }: TiraCultivosProps) {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className={`${CONTENEDOR} space-y-10 py-20 sm:py-28`}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <Encabezado
          antetitulo="El catálogo"
          titulo={
            <h2 id={idTitulo} className="text-4xl font-black sm:text-5xl">
              Cultivos que caben en una celda
            </h2>
          }
        >
          Hortalizas, aromáticas y flores amigas, con su calendario por zona y las fuentes citadas.
        </Encabezado>
        <Link to="/cultivos" className="font-semibold">
          Ver el catálogo con sus filtros
        </Link>
      </div>
      {estado}
      {cultivos && (
        <ul aria-label="Cultivos del catálogo" className="grid grid-cols-3 gap-3 min-[480px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8">
          {cultivos.map((cultivo) => (
            <li key={cultivo.id}>
              <Link
                to="/cultivos/$cultivoId"
                params={{ cultivoId: cultivo.id }}
                className="flex h-full flex-col items-center gap-2 rounded-tarjeta border-2 border-tinta bg-superficie-elevada px-1 py-4 text-center text-sm font-semibold text-tinta no-underline shadow-pegatina transition-[translate,box-shadow,background-color] duration-150 ease-pluma hover:bg-girasol hover:shadow-pegatina-lg motion-safe:hover:-translate-0.5 active:shadow-none motion-safe:active:translate-1 [&>svg]:size-8"
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

/* ───────────── Invitación ───────────── */

function Invitacion() {
  return (
    <section className="overflow-hidden border-t-2 border-tinta bg-acento text-sobre-acento">
      <div className={`${CONTENEDOR} relative grid items-center gap-8 py-20 sm:py-24 md:grid-cols-[minmax(0,1fr)_auto]`}>
        <div className="space-y-4">
          <Pegatina giro="rotate-2">Gratis · sin registro</Pegatina>
          <h2 className="text-4xl font-black text-sobre-acento sm:text-6xl">Tu primer bancal, en un minuto</h2>
          <p className="max-w-xl text-lg">Solo necesitas un metro y saber cuántas horas de sol le llegan.</p>
        </div>
        <Link to="/bancales/nuevo" className={`${claseBoton("secundario")} text-lg`}>
          Empezar a dibujar <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
