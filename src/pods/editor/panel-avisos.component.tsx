// El panel de avisos: cada uno explicado (quién, con quién, por qué y qué
// hacer), con su forma (rombo de vecindad, triángulo de la planta) y un botón
// por cultivo implicado, nombrado con su sitio: con dos tomates junto a un
// hinojo, cada aviso dice de qué tomate habla. Los avisos aconsejan, no
// regañan (docs/brief.md, «Tono»).
import { useId, type Ref } from "react";
import { Boton } from "../../common/components/boton";
import { IconoAvisoPlanta, IconoCompatibilidad } from "../../common/components/marca-compatibilidad";
import { claseTarjeta } from "../../common/components/tarjeta";
import { claveAviso, textoAviso } from "../../core/bancales/avisos";
import type { Aviso, Celda } from "../../core/bancales/model";
import type { Cultivo } from "../../core/cultivos/model";

interface PanelAvisosProps {
  avisos: Aviso[];
  cultivos: Cultivo[];
  onIr: (celda: Celda) => void;
  /** El título, para llevar el foco al panel desde la banda del móvil. */
  refTitulo?: Ref<HTMLHeadingElement>;
}

/** Los cultivos de un aviso, cada uno con su celda (dos en vecindad, uno si es de la planta). */
const implicados = (aviso: Aviso): { cultivoId: string; celda: Celda }[] =>
  aviso.tipo === "vecindad"
    ? aviso.celdas.map((celda, i) => ({ cultivoId: aviso.cultivoIds[i]!, celda }))
    : [{ cultivoId: aviso.cultivoId, celda: aviso.celda }];

export function PanelAvisos({ avisos, cultivos, onIr, refTitulo }: PanelAvisosProps) {
  const id = useId();
  const nombre = (cultivoId: string) => (cultivos.find((c) => c.id === cultivoId)?.nombre ?? cultivoId).toLowerCase();
  return (
    <section aria-labelledby={id} className={`${claseTarjeta} space-y-3 p-4 sm:p-5`}>
      <h2 ref={refTitulo} id={id} tabIndex={-1} className="w-fit text-xl">
        Avisos ({avisos.length})
      </h2>
      {avisos.length === 0 ? (
        <p className="flex items-center gap-2 text-tinta-suave">
          <IconoCompatibilidad tipo="favorable" />
          Sin avisos: todo se lleva bien.
        </p>
      ) : (
        <ul role="list" className="border-t border-lapiz">
          {avisos.map((aviso, i) => {
            // Cada «Ver…» se describe con el texto de su aviso: dos avisos de la
            // misma celda no se confunden en la lista de botones del lector.
            const idTexto = `${id}-aviso-${i}`;
            return (
              <li key={claveAviso(aviso)} className="flex gap-3 border-b border-lapiz py-3 last:border-b-0 last:pb-0">
                <span className="pt-0.5">
                  {aviso.tipo === "vecindad" ? <IconoCompatibilidad tipo="desfavorable" /> : <IconoAvisoPlanta />}
                </span>
                <div className="min-w-0 space-y-1">
                  <p id={idTexto}>{textoAviso(aviso, cultivos)}</p>
                  <p className="flex flex-wrap gap-x-4">
                    {implicados(aviso).map(({ cultivoId, celda }) => (
                      <Boton key={`${celda.fila}-${celda.columna}`} variante="enlace" aria-describedby={idTexto} onClick={() => onIr(celda)}>
                        Ver {nombre(cultivoId)} (fila {celda.fila + 1}, columna {celda.columna + 1})
                      </Boton>
                    ))}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
