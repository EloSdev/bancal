// Ficha de un cultivo, como una página del cuaderno: el nombre a pluma, sus
// datos en una línea de cotas, el calendario de las tres zonas (texto + regla
// de meses: legible sin color) y los vecinos que lo ayudan o lo perjudican,
// cada uno enlazado a su ficha y con el porqué.
import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef } from "react";
import { IconoCultivo } from "../../common/components/icono-cultivo";
import { MarcaCompatibilidad } from "../../common/components/marca-compatibilidad";
import { ReglaMeses } from "../../common/components/regla-meses";
import { zonas } from "../../core/cultivos/cultivo.schema";
import {
  etiquetaDificultad,
  etiquetaExposicion,
  etiquetaRiego,
  etiquetaZona,
  ventanaEnTexto,
} from "../../core/cultivos/etiquetas";
import type { CalendarioZona, Cultivo, ZonaClimatica } from "../../core/cultivos/model";

/** Un vecino del catálogo ya resuelto: su nombre para el enlace y el motivo. */
export interface Vecino {
  id: string;
  nombre: string;
  motivo: string;
}

interface FichaCultivoProps {
  cultivo: Cultivo;
  compatibles: Vecino[];
  incompatibles: Vecino[];
}

export function FichaCultivo({ cultivo, compatibles, incompatibles }: FichaCultivoProps) {
  const ids = { calendario: useId(), vecinos: useId() };
  const refTitulo = useRef<HTMLHeadingElement>(null);

  // De ficha a ficha la ruta no se vuelve a montar: sin esto el foco caería en
  // <body> y el cambio de título no se anunciaría (frontend-a11y §6).
  useEffect(() => {
    refTitulo.current?.focus();
  }, [cultivo.id]);

  return (
    <article className="space-y-8">
      <header className="space-y-1">
        {/* Una miga al catálogo, no un «volver»: Atrás conserva los filtros. */}
        <Link to="/cultivos" className="inline-flex min-h-6 items-center text-sm">
          Catálogo
        </Link>
        <div className="flex items-center gap-3">
          {/* -ml-2: el dibujo deja aire en su viewBox; así su trazo se alinea con «Catálogo». */}
          <span className="-ml-2">
            <IconoCultivo cultivoId={cultivo.id} grande />
          </span>
          <h1 ref={refTitulo} tabIndex={-1} className="w-fit">
            {cultivo.nombre}
          </h1>
        </div>
      </header>

      <DatosCultivo cultivo={cultivo} />

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
        <section aria-labelledby={ids.calendario} className="space-y-4">
          <h2 id={ids.calendario}>Calendario</h2>
          {zonas.map((zona) => (
            <CalendarioDeZona key={zona} zona={zona} calendario={cultivo.calendario[zona]} />
          ))}
        </section>

        <section aria-labelledby={ids.vecinos} className="space-y-4">
          <h2 id={ids.vecinos}>Vecinos</h2>
          {compatibles.length === 0 && incompatibles.length === 0 ? (
            <p className="text-tinta-suave">
              Ningún cultivo del catálogo lo ayuda ni lo perjudica: puedes ponerlo en cualquier sitio del bancal.
            </p>
          ) : (
            <>
              {/* Lo que hay que evitar se lee primero. */}
              <ListaVecinos tipo="desfavorable" vecinos={incompatibles} vacio="Ningún cultivo del catálogo lo perjudica." />
              <ListaVecinos tipo="favorable" vecinos={compatibles} vacio="Ningún cultivo del catálogo lo ayuda." />
            </>
          )}
        </section>
      </div>
    </article>
  );
}

function DatosCultivo({ cultivo }: { cultivo: Cultivo }) {
  const datos = [
    { termino: "Plantas por celda", valor: String(cultivo.plantasPorCelda) },
    { termino: "Sol", valor: etiquetaExposicion[cultivo.sol] },
    { termino: "Riego", valor: etiquetaRiego[cultivo.riego] },
    { termino: "Dificultad", valor: etiquetaDificultad[cultivo.dificultad] },
    { termino: "Familia", valor: cultivo.familia },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 border-y border-lapiz py-3 sm:grid-cols-5">
      {datos.map(({ termino, valor }) => (
        <div key={termino} className="py-1.5">
          <dt className="text-sm text-tinta-suave">{termino}</dt>
          <dd className="font-medium tabular-nums">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

function CalendarioDeZona({ zona, calendario }: { zona: ZonaClimatica; calendario: CalendarioZona }) {
  const id = useId();
  // Siembra subrayada y cosecha rellena: se distinguen por la forma, no solo por la etiqueta.
  const tramos = [
    { termino: "Siembra", ventana: calendario.siembra, marca: "subrayado" },
    { termino: "Cosecha", ventana: calendario.cosecha, marca: "relleno" },
  ] as const;
  return (
    <section aria-labelledby={id} className="space-y-1.5">
      <h3 id={id}>{etiquetaZona[zona]}</h3>
      <dl className="space-y-2">
        {tramos.map(({ termino, ventana, marca }) => (
          <div key={termino}>
            <dt className="inline text-sm font-medium">{termino}</dt>
            <dd className="inline">
              <span className="pl-2 text-sm text-tinta-suave">{ventanaEnTexto(ventana)}</span>
              <ReglaMeses ventana={ventana} marca={marca} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

interface ListaVecinosProps {
  tipo: "favorable" | "desfavorable";
  vecinos: Vecino[];
  vacio: string;
}

function ListaVecinos({ tipo, vecinos, vacio }: ListaVecinosProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <h3 id={id} className="text-base">
        <MarcaCompatibilidad tipo={tipo} />
      </h3>
      {vecinos.length === 0 ? (
        <p className="text-sm text-tinta-suave">{vacio}</p>
      ) : (
        <ul role="list" aria-labelledby={id} className="border-t border-lapiz">
          {vecinos.map((vecino) => (
            // Como en la lista del catálogo: toda la fila responde, el enlace accesible es el nombre.
            <li
              key={vecino.id}
              className="relative -mx-2 border-b border-lapiz px-2 py-2 transition-colors hover:bg-superficie-elevada has-[a:focus-visible]:bg-superficie-elevada has-[a:active]:bg-superficie-elevada"
            >
              <Link
                to="/cultivos/$cultivoId"
                params={{ cultivoId: vecino.id }}
                className="inline-flex min-h-6 items-center gap-2 font-titulos font-semibold after:absolute after:inset-0"
              >
                {/* El dibujo, siempre en tinta: el azul es del enlace (el texto). */}
                <span className="text-tinta">
                  <IconoCultivo cultivoId={vecino.id} />
                </span>
                {vecino.nombre}
              </Link>
              <p className="text-sm text-tinta-suave">{vecino.motivo}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
