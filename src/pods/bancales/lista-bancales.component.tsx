// La lista «Mis bancales»: cada bancal con su croquis a escala, sus medidas y lo que hay que mirar (avisos). Toda la tarjeta lleva al
// editor; el enlace accesible es el nombre y «Borrar» queda por encima.
import { Link } from "@tanstack/react-router";
import type { Ref } from "react";
import { Boton } from "../../common/components/boton";
import { IconoCompatibilidad } from "../../common/components/marca-compatibilidad";
import { claseTarjetaPulsable } from "../../common/components/tarjeta";
import type { BancalDetalle } from "../../core/bancales/api";
import { resumenBancal } from "../../core/bancales/resumen";
import type { Cultivo } from "../../core/cultivos/model";
import { Croquis } from "./croquis.component";

interface ListaBancalesProps {
  detalles: BancalDetalle[];
  cultivos: Cultivo[];
  /** El contenedor guarda los enlaces para llevar el foco tras borrar. */
  refEnlace: (bancalId: string) => Ref<HTMLAnchorElement>;
  onBorrar: (detalle: BancalDetalle, boton: HTMLButtonElement) => void;
}

export function ListaBancales({ detalles, cultivos, refEnlace, onBorrar }: ListaBancalesProps) {
  return (
    <ul role="list" aria-label="Bancales" className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {detalles.map((detalle) => (
        <TarjetaBancal
          key={detalle.bancal.id}
          detalle={detalle}
          cultivos={cultivos}
          refEnlace={refEnlace(detalle.bancal.id)}
          onBorrar={onBorrar}
        />
      ))}
    </ul>
  );
}

interface TarjetaBancalProps {
  detalle: BancalDetalle;
  cultivos: Cultivo[];
  refEnlace: Ref<HTMLAnchorElement>;
  onBorrar: (detalle: BancalDetalle, boton: HTMLButtonElement) => void;
}

function TarjetaBancal({ detalle, cultivos, refEnlace, onBorrar }: TarjetaBancalProps) {
  const { bancal, plantaciones } = detalle;
  const resumen = resumenBancal(detalle, cultivos);
  return (
    <li className={`${claseTarjetaPulsable} flex min-w-0 gap-4 p-4 sm:p-5`}>
      {/* Caja fija (cabe el de 10 celdas) sobre tierra: el texto empieza siempre en la misma línea. */}
      <div className="flex w-32 shrink-0 items-center justify-center self-start rounded-control border-2 border-tinta bg-tierra p-2">
        <Croquis columnas={resumen.columnas} filas={resumen.filas} plantaciones={plantaciones} />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <h2 className="text-xl">
          <Link
            ref={refEnlace}
            to="/bancales/$bancalId"
            params={{ bancalId: bancal.id }}
            className="break-words text-tinta no-underline decoration-acento after:absolute after:inset-0 hover:underline"
          >
            {bancal.nombre}
          </Link>
        </h2>
        {/* Cada dato entero: a 360 px el corte cae en el «·», no a mitad de dato. */}
        <p className="text-sm text-tinta-suave tabular-nums">
          <span className="whitespace-nowrap">
            {bancal.ancho} × {bancal.largo} cm
          </span>
          <Separador />
          <span className="whitespace-nowrap">
            {resumen.columnas} × {resumen.filas} celdas
          </span>
          <Separador />
          <span className="whitespace-nowrap">
            {resumen.plantadas} de {resumen.celdas} {resumen.celdas === 1 ? "plantada" : "plantadas"}
          </span>
        </p>
        {resumen.avisos === 0 ? (
          <p className="text-sm text-tinta-suave">Sin avisos</p>
        ) : (
          // Lo que hay que mirar de cada bancal: con forma (el rombo), no solo con peso.
          <p className="flex w-fit items-center gap-1.5 rounded-full border-2 border-tinta bg-girasol px-2.5 py-0.5 text-sm font-semibold">
            <IconoCompatibilidad tipo="desfavorable" pequeno />
            {resumen.avisos} {resumen.avisos === 1 ? "aviso" : "avisos"}
          </p>
        )}
        {/* Siempre en su línea, al final: el nombre se lee igual en todas las
            tarjetas. relative: por encima del enlace que cubre la tarjeta. */}
        <div className="relative flex gap-4 pt-1">
          {/* Los nombres accesibles dicen cuál; empiezan por la palabra visible («label in name»). */}
          <Link
            to="/bancales/$bancalId/editar"
            params={{ bancalId: bancal.id }}
            aria-label={`Editar «${bancal.nombre}»`}
            className="inline-flex min-h-6 items-center"
          >
            Editar
          </Link>
          <Boton
            variante="enlace"
            aria-label={`Borrar «${bancal.nombre}»`}
            onClick={(evento) => onBorrar(detalle, evento.currentTarget)}
          >
            Borrar
          </Boton>
        </div>
      </div>
    </li>
  );
}

// Los espacios van dentro (JSX quita los de entre elementos): son el único
// sitio por donde se puede partir la línea, y separan las palabras para el lector.
function Separador() {
  return <span aria-hidden="true">{" · "}</span>;
}
