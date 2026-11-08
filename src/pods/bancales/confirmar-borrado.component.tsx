// Confirmación de borrado con <dialog> nativo y showModal(): atrapa el foco,
// deja el fondo inerte y cierra con Escape (frontend-a11y §6). Abrir y cerrar
// se sincroniza en un efecto de layout para que, al cerrarse por un cambio de
// estado, el fondo deje de ser inerte antes de que el contenedor mueva el foco.
// Cancelar (botón o Escape) llega como el evento «close» → onCerrar.
import { useId, useLayoutEffect, useRef } from "react";
import { Alerta } from "../../common/components/alerta";
import { Boton } from "../../common/components/boton";
import type { BancalDetalle } from "../../core/bancales/api";
import { dimensiones } from "../../core/bancales/cuadricula";
import { Croquis } from "./croquis.component";
import type { ErrorApi } from "../../core/comun/api";

interface ConfirmarBorradoProps {
  /** El bancal que se va a borrar; null = diálogo cerrado. */
  detalle: BancalDetalle | null;
  borrando: boolean;
  error: ErrorApi | null;
  onConfirmar: () => void;
  onCerrar: () => void;
}

export function ConfirmarBorrado({ detalle, borrando, error, onConfirmar, onCerrar }: ConfirmarBorradoProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const refCancelar = useRef<HTMLButtonElement>(null);
  const idTitulo = useId();
  const abierto = detalle !== null;

  useLayoutEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) {
      dialogo.showModal();
      // Empieza en «Conservar bancal»: lo destructivo nunca es lo que se pulsa sin querer.
      refCancelar.current?.focus();
    }
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      // Mientras se borra, Escape no cierra: el resultado tiene que verse.
      onCancel={(evento) => borrando && evento.preventDefault()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-hoja bg-superficie-elevada p-5 text-tinta shadow-hoja backdrop:bg-tinta/40"
    >
      {detalle && (
        <div className="space-y-4">
          {/* El croquis: que se vea cuál se va a borrar, no solo su nombre. */}
          <div className="flex items-start gap-4">
            <Croquis {...dimensiones(detalle.bancal.ancho, detalle.bancal.largo)} plantaciones={detalle.plantaciones} />
            <h2 id={idTitulo} className="min-w-0 break-words">
              ¿Borrar «{detalle.bancal.nombre}»?
            </h2>
          </div>
          <p>{queSeBorra(detalle.plantaciones.length)} No se puede deshacer.</p>
          {error && (
            <Alerta>
              <p>No se ha podido borrar. {error.message} Inténtalo otra vez en un momento.</p>
            </Alerta>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <Boton ref={refCancelar} variante="secundario" disabled={borrando} onClick={() => ref.current?.close()}>
              Conservar bancal
            </Boton>
            {/* aria-disabled y no disabled: un botón deshabilitado con el foco lo
                pierde a <body>, y si el borrado falla hay que seguir aquí. */}
            <Boton variante="peligro" aria-disabled={borrando} onClick={() => !borrando && onConfirmar()}>
              {borrando ? "Borrando…" : "Borrar bancal"}
            </Boton>
          </div>
        </div>
      )}
    </dialog>
  );
}

function queSeBorra(plantaciones: number): string {
  if (plantaciones === 0) return "No tiene nada plantado.";
  if (plantaciones === 1) return "Se borrará también su 1 plantación.";
  return `Se borrarán también sus ${plantaciones} plantaciones.`;
}
