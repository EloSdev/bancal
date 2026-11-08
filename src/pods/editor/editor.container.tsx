// El editor de un bancal: carga el bancal (con sus plantaciones) y el
// catálogo, y decide entre cargando, error, no encontrado y el editor. El
// editor lleva el estado de la edición (plantaciones, herramienta elegida,
// celda activa) y guarda cada cambio con la api; lo derivado (la cuadrícula,
// los nombres) se calcula en el render.
import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Alerta } from "../../common/components/alerta";
import { Boton } from "../../common/components/boton";
import { ErrorCarga } from "../../common/components/error-carga";
import { TituloPagina } from "../../common/components/titulo-pagina";
import { IconoAvisoPlanta, IconoCompatibilidad, LeyendaCompatibilidad } from "../../common/components/marca-compatibilidad";
import { savePlantaciones, type BancalDetalle } from "../../core/bancales/api";
import { avisosBancal, diferenciaAvisos, resumenAviso } from "../../core/bancales/avisos";
import { dimensiones } from "../../core/bancales/cuadricula";
import { exposicion } from "../../core/bancales/exposicion";
import { useBancal } from "../../core/bancales/hooks";
import type { Aviso, Celda, Plantacion } from "../../core/bancales/model";
import { colocar, quitar } from "../../core/bancales/plantaciones";
import { mesSiembraPorDefecto, tareasDelMes } from "../../core/bancales/temporada";
import { aErrorApi, type ErrorApi } from "../../core/comun/api";
import { etiquetaExposicion, etiquetaZona } from "../../core/cultivos/etiquetas";
import { ordenarPorNombre } from "../../core/cultivos/filtros";
import { useCultivos } from "../../core/cultivos/hooks";
import type { Cultivo, Mes } from "../../core/cultivos/model";
import { Temporada } from "./temporada.component";
import { claveCelda, Cuadricula } from "./cuadricula.component";
import { PanelAvisos } from "./panel-avisos.component";
import { Paleta, type Herramienta } from "./paleta.component";

interface EditorContainerProps {
  bancalId: string;
  /** El mes de la temporada (de la URL, T15). */
  mes: Mes;
  onCambiarMes: (mes: Mes) => void;
}

export function EditorContainer({ bancalId, mes, onCambiarMes }: EditorContainerProps) {
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
  return (
    <Editor
      key={bancal.data.bancal.id}
      detalle={bancal.data}
      cultivos={cultivos.data}
      mes={mes}
      onCambiarMes={onCambiarMes}
    />
  );
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

interface EditorProps {
  detalle: BancalDetalle;
  cultivos: Cultivo[];
  mes: Mes;
  onCambiarMes: (mes: Mes) => void;
}

function Editor({ detalle, cultivos, mes, onCambiarMes }: EditorProps) {
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

  const refAvisos = useRef<HTMLHeadingElement>(null);
  const [senalada, setSenalada] = useState<Celda | null>(null);
  // La señal se apaga sola: sincroniza con un temporizador (efecto con limpieza).
  useEffect(() => {
    if (!senalada) return;
    const temporizador = setTimeout(() => setSenalada(null), 1500);
    return () => clearTimeout(temporizador);
  }, [senalada]);

  const dims = dimensiones(bancal.ancho, bancal.largo);
  const cultivosPorId = new Map(cultivos.map((c) => [c.id, c]));
  // Derivados en cada render, nunca guardados (react-bancal §3).
  const avisos = avisosBancal(bancal, plantaciones, cultivos);
  const posicion = ({ fila, columna }: Celda) => `la fila ${fila + 1}, columna ${columna + 1}`;

  /**
   * core devuelve la misma lista cuando no cambia nada: entonces ni se guarda.
   * Si cambia, se anuncia lo hecho y los avisos que aparecen o se resuelven (C14.3).
   */
  const cambiar = (nuevas: Plantacion[], hecho: string, sinCambio: string) => {
    if (nuevas === plantaciones) {
      anunciar(sinCambio);
      return;
    }
    const { nuevos, resueltos } = diferenciaAvisos(avisos, avisosBancal(bancal, nuevas, cultivos));
    // Un resumen, no la lista entera (frontend-a11y §5): el primero y cuántos
    // más; la explicación completa está en el panel.
    const resumir = (cambiados: Aviso[], uno: string) => {
      const [primero, ...resto] = cambiados;
      if (!primero) return [];
      const mas = resto.length === 0 ? "" : ` (y ${resto.length} más)`;
      return [`${uno}: ${resumenAviso(primero, cultivos)}${mas}.`];
    };
    anunciar([hecho, ...resumir(nuevos, "Nuevo aviso"), ...resumir(resueltos, "Aviso resuelto")].join(" "));
    setPlantaciones(nuevas);
    guardar(nuevas);
  };

  /**
   * «Ver avisos» (móvil): foco al título del panel y, además, traerlo a la
   * vista: el navegador lo dejaría pegado abajo, tapado por la banda fija.
   */
  const irAlPanel = () => {
    const titulo = refAvisos.current;
    titulo?.focus({ preventScroll: true });
    titulo?.scrollIntoView({ block: "start" });
  };

  /**
   * Lleva el foco a una celda (desde el panel de avisos) y la señala un
   * momento: tras un clic con el ratón, el anillo de foco no se ve.
   */
  const irA = (celda: Celda) => {
    setActiva(celda);
    setSenalada(celda);
    refRejilla.current?.querySelector<HTMLButtonElement>(`[data-celda="${claveCelda(celda)}"]`)?.focus();
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

      {/* lg: paleta | bancal (avisos debajo). xl: paleta | bancal | avisos al lado (brief). */}
      <div className="lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
        {/* Primero en el orden de Tab: se elige qué plantar y luego dónde. */}
        <BandaPaleta idTitulo={idPaleta}>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 id={idPaleta} className="font-sans text-sm font-medium">
              Elige qué plantar
            </h2>
            {pideElegir && <p className="border-l-2 border-tinta pl-2 text-sm font-medium">Elige primero un cultivo.</p>}
            {/* En el móvil el panel queda debajo: la banda dice cuántos hay y lleva a él. */}
            {avisos.length > 0 && (
              <span className="ml-auto lg:hidden">
                <ContadorAvisos avisos={avisos} onVer={irAlPanel} />
              </span>
            )}
          </div>
          <Paleta cultivos={ordenarPorNombre(cultivos)} elegida={herramienta} onElegir={elegir} />
        </BandaPaleta>
        <div className="min-w-0 space-y-6">
          <Temporada
            mes={mes}
            onCambiarMes={onCambiarMes}
            tareas={tareasDelMes(plantaciones, cultivos, bancal.zona, mes)}
            cultivosPorId={cultivosPorId}
          />
          <Cuadricula
            refRejilla={refRejilla}
            nombre={bancal.nombre}
            ancho={bancal.ancho}
            largo={bancal.largo}
            dims={dims}
            plantaciones={plantaciones}
            cultivosPorId={cultivosPorId}
            avisos={avisos}
            mes={mes}
            zona={bancal.zona}
            activa={activa}
            senalada={senalada}
            onActivar={setActiva}
            onUsar={usar}
            onQuitar={quitarDe}
          />
          <LeyendaCompatibilidad conAvisoPlanta />
        </div>
        <div className="mt-6 lg:col-start-2 xl:sticky xl:top-6 xl:col-start-3 xl:row-start-1 xl:mt-0 xl:max-h-[calc(100dvh-3rem)] xl:overflow-y-auto xl:p-1">
          <PanelAvisos avisos={avisos} cultivos={cultivos} onIr={irA} refTitulo={refAvisos} />
        </div>
      </div>
    </section>
  );
}

/**
 * El contador de la banda del móvil (brief: «✕ 1 · ✓ 2»): cuántos avisos hay
 * de cada forma, y lleva al panel. El texto visible empieza por «Ver avisos»,
 * así que el nombre accesible lo contiene («label in name»).
 */
function ContadorAvisos({ avisos, onVer }: { avisos: Aviso[]; onVer: () => void }) {
  const vecindad = avisos.filter((a) => a.tipo === "vecindad").length;
  const planta = avisos.length - vecindad;
  return (
    <Boton variante="enlace" aria-label={`Ver avisos (${avisos.length})`} onClick={onVer}>
      <span className="inline-flex items-center gap-2 tabular-nums">
        Ver avisos
        {vecindad > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <IconoCompatibilidad tipo="desfavorable" pequeno /> {vecindad}
          </span>
        )}
        {planta > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <IconoAvisoPlanta pequeno /> {planta}
          </span>
        )}
      </span>
    </Boton>
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
