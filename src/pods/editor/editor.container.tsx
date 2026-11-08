// El editor de un bancal: carga el bancal (con sus plantaciones) y el
// catálogo, y decide entre cargando, error, no encontrado y el editor. El
// editor lleva el estado de la edición (plantaciones, herramienta elegida,
// celda activa) y guarda cada cambio con la api; lo derivado (la cuadrícula,
// los nombres) se calcula en el render.
import { Link } from "@tanstack/react-router";
import { useId, useRef, useState, type ReactNode } from "react";
import { Alerta } from "../../common/components/alerta";
import { Boton } from "../../common/components/boton";
import { ErrorCarga } from "../../common/components/error-carga";
import { TituloPagina } from "../../common/components/titulo-pagina";
import { savePlantaciones, type BancalDetalle } from "../../core/bancales/api";
import { dimensiones } from "../../core/bancales/cuadricula";
import { exposicion } from "../../core/bancales/exposicion";
import { useBancal } from "../../core/bancales/hooks";
import type { Celda, Plantacion } from "../../core/bancales/model";
import { colocar, quitar } from "../../core/bancales/plantaciones";
import { mesSiembraPorDefecto } from "../../core/bancales/temporada";
import { aErrorApi, type ErrorApi } from "../../core/comun/api";
import { etiquetaExposicion, etiquetaZona } from "../../core/cultivos/etiquetas";
import { ordenarPorNombre } from "../../core/cultivos/filtros";
import { useCultivos } from "../../core/cultivos/hooks";
import type { Cultivo } from "../../core/cultivos/model";
import { Cuadricula } from "./cuadricula.component";
import { Paleta, type Herramienta } from "./paleta.component";

export function EditorContainer({ bancalId }: { bancalId: string }) {
  const bancal = useBancal(bancalId);
  const cultivos = useCultivos();

  const error = bancal.error ?? cultivos.error;
  if (error) {
    const reintentar = () => {
      if (bancal.error) bancal.recargar();
      if (cultivos.error) cultivos.recargar();
    };
    return <ErrorCarga titulo="No se ha podido abrir el bancal." error={error} onReintentar={reintentar} />;
  }
  if (bancal.loading || !cultivos.data) {
    return (
      <p role="status" className="text-tinta-suave">
        Cargando el bancal…
      </p>
    );
  }
  if (!bancal.data) return <BancalNoEncontrado />;

  // key: al pasar a otro bancal, el estado de la edición empieza de cero.
  return <Editor key={bancal.data.bancal.id} detalle={bancal.data} cultivos={cultivos.data} />;
}

type EstadoGuardado = "" | "guardando" | "guardado";

/**
 * Guarda la lista entera tras cada cambio. Si llega otro cambio durante la
 * latencia, el guardado anterior se aborta (el nuevo ya lo lleva todo). No se
 * aborta al salir de la pantalla: lo plantado se guarda aunque te vayas.
 * Compromiso aceptado: si ese último guardado falla con la pantalla ya
 * cerrada, nadie lo ve (al volver, el bancal enseña lo que de verdad quedó).
 */
function useGuardarPlantaciones(bancalId: string) {
  const [estado, setEstado] = useState<EstadoGuardado>("");
  const [error, setError] = useState<ErrorApi | null>(null);
  const enCurso = useRef<AbortController | null>(null);

  const guardar = (plantaciones: Plantacion[]) => {
    enCurso.current?.abort();
    const controller = new AbortController();
    enCurso.current = controller;
    setEstado("guardando");
    setError(null);
    savePlantaciones(bancalId, plantaciones, controller.signal).then(
      () => {
        if (!controller.signal.aborted) setEstado("guardado");
      },
      (e: unknown) => {
        if (controller.signal.aborted) return;
        setError(aErrorApi(e));
        setEstado("");
      },
    );
  };
  return { estado, error, guardar };
}

function Editor({ detalle, cultivos }: { detalle: BancalDetalle; cultivos: Cultivo[] }) {
  const { bancal } = detalle;
  const [plantaciones, setPlantaciones] = useState(detalle.plantaciones);
  const [herramienta, setHerramienta] = useState<Herramienta>(null);
  // Se tocó una celda sin nada elegido: se dice también a la vista, junto a la paleta.
  const [pideElegir, setPideElegir] = useState(false);
  const elegir = (nueva: Herramienta) => {
    setHerramienta(nueva);
    setPideElegir(false);
  };
  const [activa, setActiva] = useState<Celda>({ fila: 0, columna: 0 });
  // n cambia en cada anuncio: el texto se vuelve a montar y el lector lo
  // repite aunque sea igual que el anterior (dos clics sin cultivo elegido).
  const [anuncio, setAnuncio] = useState({ texto: "", n: 0 });
  const anunciar = (texto: string) => setAnuncio(({ n }) => ({ texto, n: n + 1 }));
  const { estado, error, guardar } = useGuardarPlantaciones(bancal.id);
  const refRejilla = useRef<HTMLDivElement>(null);
  const idPaleta = useId();

  const dims = dimensiones(bancal.ancho, bancal.largo);
  const cultivosPorId = new Map(cultivos.map((c) => [c.id, c]));
  const posicion = ({ fila, columna }: Celda) => `la fila ${fila + 1}, columna ${columna + 1}`;

  /** core devuelve la misma lista cuando no cambia nada: entonces ni se guarda. */
  const cambiar = (nuevas: Plantacion[], hecho: string, sinCambio: string) => {
    if (nuevas === plantaciones) {
      anunciar(sinCambio);
      return;
    }
    anunciar(hecho);
    setPlantaciones(nuevas);
    guardar(nuevas);
  };

  const quitarDe = (celda: Celda) =>
    cambiar(
      quitar(plantaciones, celda),
      `Vacía ${posicion(celda)}.`,
      `La fila ${celda.fila + 1}, columna ${celda.columna + 1} ya está vacía.`,
    );

  const usar = (celda: Celda) => {
    if (herramienta === null) {
      anunciar("Elige primero un cultivo de la paleta.");
      setPideElegir(true);
      return;
    }
    if (herramienta.tipo === "quitar") {
      quitarDe(celda);
      return;
    }
    const cultivo = cultivosPorId.get(herramienta.cultivoId);
    if (!cultivo) return;
    const mes = mesSiembraPorDefecto(cultivo, bancal.zona);
    const texto = `${cultivo.nombre} en ${posicion(celda)}.`;
    cambiar(colocar(plantaciones, celda, cultivo.id, mes), texto, `Ya hay ${cultivo.nombre.toLowerCase()} en ${posicion(celda)}.`);
  };

  // «Reintentar» desaparece al pulsarlo: el foco vuelve a la celda activa.
  const reintentar = () => {
    guardar(plantaciones);
    refRejilla.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  };

  const sol = etiquetaExposicion[exposicion(bancal.horasSol)].toLowerCase();

  return (
    // pb: en el móvil la paleta va en una banda fija abajo y no debe tapar nada.
    <section className="space-y-5 pb-32 lg:pb-0">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 space-y-1">
          <Link to="/bancales" className="inline-flex min-h-6 items-center text-sm">
            Mis bancales
          </Link>
          <TituloPagina>{bancal.nombre}</TituloPagina>
          {/* El estado del guardado va al final de la línea de medidas: no
              empuja «Editar medidas» cada vez que se guarda. */}
          <p className="text-sm text-tinta-suave tabular-nums">
            {bancal.ancho} × {bancal.largo} cm · {dims.columnas} × {dims.filas} celdas · {sol} ({bancal.horasSol} h) · zona{" "}
            {etiquetaZona[bancal.zona].toLowerCase()}
            {estado !== "" && <span className="font-medium"> · {estado === "guardando" ? "Guardando…" : "Guardado"}</span>}
          </p>
        </div>
        <Link to="/bancales/$bancalId/editar" params={{ bancalId: bancal.id }} className="inline-flex min-h-6 items-center">
          Editar medidas
        </Link>
      </header>

      {/* Lo que pasa al tocar una celda, para el lector (frontend-a11y §5). */}
      <p role="status" aria-label="Cambios en el bancal" className="sr-only">
        <span key={anuncio.n}>{anuncio.texto}</span>
      </p>

      {error && (
        <Alerta>
          <p>No se han podido guardar los cambios. {error.message}</p>
          <Boton variante="secundario" onClick={reintentar}>
            Reintentar
          </Boton>
        </Alerta>
      )}

      <div className="lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Primero en el orden de Tab: se elige qué plantar y luego dónde. */}
        <BandaPaleta idTitulo={idPaleta}>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 id={idPaleta} className="font-sans text-sm font-medium">
              Elige qué plantar
            </h2>
            {pideElegir && <p className="border-l-2 border-tinta pl-2 text-sm font-medium">Elige primero un cultivo.</p>}
          </div>
          <Paleta cultivos={ordenarPorNombre(cultivos)} elegida={herramienta} onElegir={elegir} />
        </BandaPaleta>
        <Cuadricula
          refRejilla={refRejilla}
          nombre={bancal.nombre}
          ancho={bancal.ancho}
          largo={bancal.largo}
          dims={dims}
          plantaciones={plantaciones}
          cultivosPorId={cultivosPorId}
          activa={activa}
          onActivar={setActiva}
          onUsar={usar}
          onQuitar={quitarDe}
        />
      </div>
    </section>
  );
}

/**
 * Donde vive la paleta: en el móvil, la banda fija de abajo (lo único con
 * sombra, docs/brief.md); en escritorio, una columna al lado de la cuadrícula.
 */
function BandaPaleta({ idTitulo, children }: { idTitulo: string; children: ReactNode }) {
  return (
    <aside
      aria-labelledby={idTitulo}
      className="fixed inset-x-0 bottom-0 z-20 space-y-2 border-t border-lapiz bg-superficie-elevada px-4 py-3 shadow-flota lg:sticky lg:top-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      {children}
    </aside>
  );
}

function BancalNoEncontrado() {
  return (
    <section className="space-y-3">
      <TituloPagina>Bancal no encontrado</TituloPagina>
      <p>Ese bancal no existe o ya se ha borrado.</p>
      <Link to="/bancales" className="inline-block py-1">
        Volver a mis bancales
      </Link>
    </section>
  );
}
