// Mis bancales: carga los bancales (con sus plantaciones) y el catálogo (para
// contar los avisos), y decide entre cargando, error, vacío y la lista.
// Borrar quita el bancal de la lista que ya está en pantalla, sin recargar
// (decisión de T11): así la lista no se desmonta y el foco tiene adónde ir.
import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { claseBoton } from "../../common/components/boton";
import { ErrorCarga } from "../../common/components/error-carga";
import { deleteBancal, hayDatosDescartados, olvidarDatosDescartados, type BancalDetalle } from "../../core/bancales/api";
import { useBancalesDetalle } from "../../core/bancales/hooks";
import { aErrorApi, type ErrorApi } from "../../core/comun/api";
import { useCultivos } from "../../core/cultivos/hooks";
import { ConfirmarBorrado } from "./confirmar-borrado.component";
import { AvisoDescartados, BancalesVacio } from "./estados.component";
import { ListaBancales } from "./lista-bancales.component";

export function BancalesContainer() {
  const bancales = useBancalesDetalle();
  const cultivos = useCultivos();
  const [borrados, setBorrados] = useState<ReadonlySet<string>>(new Set());
  const [aBorrar, setABorrar] = useState<BancalDetalle | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<ErrorApi | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const [descartadosVisto, setDescartadosVisto] = useState(false);

  const refRaiz = useRef<HTMLDivElement>(null);
  const refOrigen = useRef<HTMLButtonElement | null>(null);
  const refCrear = useRef<HTMLAnchorElement>(null);
  const enlaces = useRef(new Map<string, HTMLAnchorElement>());

  const loading = bancales.loading || cultivos.loading;
  const error = bancales.error ?? cultivos.error;
  const visibles = bancales.data?.filter(({ bancal }) => !borrados.has(bancal.id)) ?? [];
  // Se mira después de cargar: es al leer cuando la api aparta los datos dañados.
  const avisarDescartados = bancales.data !== null && !descartadosVisto && hayDatosDescartados();

  const refEnlace = (bancalId: string) => (enlace: HTMLAnchorElement | null) => {
    if (enlace) enlaces.current.set(bancalId, enlace);
    else enlaces.current.delete(bancalId);
  };

  const pedirBorrado = (detalle: BancalDetalle, boton: HTMLButtonElement) => {
    refOrigen.current = boton;
    setErrorBorrado(null);
    setABorrar(detalle);
  };

  // Cancelar (botón o Escape): el foco vuelve a «Borrar», que sigue ahí.
  const alCerrarDialogo = () => {
    if (!aBorrar) return; // ya se cerró al borrar
    setABorrar(null);
    refOrigen.current?.focus();
  };

  const confirmarBorrado = async () => {
    if (!aBorrar) return;
    const { id, nombre } = aBorrar.bancal;
    setBorrando(true);
    setErrorBorrado(null);
    try {
      await deleteBancal(id);
    } catch (e) {
      setErrorBorrado(aErrorApi(e));
      setBorrando(false);
      return;
    }
    // El foco va al siguiente de la lista, al anterior si era el último, o a
    // «Crear mi primer bancal» si no queda ninguno (frontend-a11y §6).
    const i = visibles.findIndex(({ bancal }) => bancal.id === id);
    const destino = visibles[i + 1] ?? visibles[i - 1];
    // flushSync: que la lista nueva y el diálogo cerrado estén en el DOM antes de mover el foco.
    flushSync(() => {
      setBorrados((previos) => new Set(previos).add(id));
      setABorrar(null);
      setBorrando(false);
      setAnuncio(`«${nombre}» borrado. ${quedan(visibles.length - 1)}`);
    });
    (destino ? enlaces.current.get(destino.bancal.id) : refCrear.current)?.focus();
  };

  // «Reintentar» desaparece al pulsarlo: el foco espera en el envoltorio.
  const reintentar = () => {
    if (bancales.error) bancales.recargar();
    if (cultivos.error) cultivos.recargar();
    refRaiz.current?.focus();
  };

  // El aviso desaparece al cerrarlo: el foco pasa al siguiente paso.
  const cerrarAvisoDescartados = () => {
    olvidarDatosDescartados();
    flushSync(() => setDescartadosVisto(true));
    (refCrear.current ?? refRaiz.current)?.focus();
  };

  // «Nuevo bancal» va en la fila del título desde el principio (no empuja la
  // lista al cargar); solo se quita cuando el vacío ya ofrece «Crear mi primer bancal».
  const vacio = bancales.data !== null && cultivos.data !== null && visibles.length === 0;

  return (
    <div ref={refRaiz} tabIndex={-1} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1>Mis bancales</h1>
        {!vacio && (
          <Link to="/bancales/nuevo" className={claseBoton("primario")}>
            Nuevo bancal
          </Link>
        )}
      </div>

      {/* Existe desde el principio para que el lector anuncie cada cambio
          (frontend-a11y §5). Solo para el lector: a la vista ya están el
          esqueleto de carga y la tarjeta que desaparece. */}
      <p role="status" className="sr-only">
        {loading && !error ? "Cargando tus bancales…" : anuncio}
      </p>

      {avisarDescartados && <AvisoDescartados onEntendido={cerrarAvisoDescartados} />}

      {/* Con dos cargas, una puede fallar mientras la otra sigue: manda el error. */}
      {error ? (
        <ErrorCarga titulo="No se han podido cargar tus bancales." error={error} onReintentar={reintentar} />
      ) : (
        loading && <ListaCargando />
      )}

      {bancales.data &&
        cultivos.data &&
        (visibles.length > 0 ? (
          <ListaBancales detalles={visibles} cultivos={cultivos.data} refEnlace={refEnlace} onBorrar={pedirBorrado} />
        ) : (
          <BancalesVacio refCrear={refCrear} />
        ))}

      <ConfirmarBorrado
        detalle={aBorrar}
        borrando={borrando}
        error={errorBorrado}
        onConfirmar={confirmarBorrado}
        onCerrar={alCerrarDialogo}
      />
    </div>
  );
}

/** Dice cuántos quedan: además informa, y el anuncio cambia aunque dos bancales se llamen igual. */
function quedan(n: number): string {
  if (n === 0) return "No te queda ninguno.";
  return n === 1 ? "Queda 1 bancal." : `Quedan ${n} bancales.`;
}

/** La forma de la lista mientras carga: dos tarjetas con su croquis. */
function ListaCargando() {
  return (
    <ul aria-hidden="true" className="-mx-2 grid border-t border-lapiz sm:grid-cols-2 sm:gap-x-8">
      {["a", "b"].map((clave) => (
        <li key={clave} className="flex gap-4 border-b border-lapiz px-2 py-4">
          <div className="size-12 rounded-control bg-lapiz/30 motion-safe:animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/5 rounded-control bg-lapiz/30 motion-safe:animate-pulse" />
            <div className="h-4 w-4/5 rounded-control bg-lapiz/20 motion-safe:animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}
