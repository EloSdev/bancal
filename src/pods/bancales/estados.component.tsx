// Los dos estados de «Mis bancales» que no son la lista: vacío y datos dañados.
import { Link } from "@tanstack/react-router";
import type { Ref } from "react";
import { Alerta } from "../../common/components/alerta";
import { Boton, claseBoton } from "../../common/components/boton";
import { Croquis } from "./croquis.component";

/**
 * Sin bancales: qué pasa y el siguiente paso (el foco llega aquí tras borrar
 * el último). El dibujo es el bancal de la demo, 120 × 90, aún por plantar.
 */
export function BancalesVacio({ refCrear }: { refCrear: Ref<HTMLAnchorElement> }) {
  return (
    <div className="flex flex-wrap items-center gap-8 rounded-tarjeta border-2 border-dashed border-tinta bg-superficie-elevada p-8 sm:p-10">
      <div className="-rotate-3 rounded-control border-2 border-tinta bg-tierra p-3 shadow-pegatina">
        <Croquis columnas={4} filas={3} grande />
      </div>
      <div className="space-y-4">
        <p className="font-titulos text-2xl font-bold">Aún no tienes bancales.</p>
        <p className="max-w-sm text-tinta-suave">Mide el tuyo con un metro: con el ancho, el largo y las horas de sol ya lo puedes dibujar.</p>
        <Link ref={refCrear} to="/bancales/nuevo" className={claseBoton("primario")}>
          Crear mi primer bancal
        </Link>
      </div>
    </div>
  );
}

/** La api apartó datos que no se podían leer (C8.5): se avisa una vez. */
export function AvisoDescartados({ onEntendido }: { onEntendido: () => void }) {
  return (
    <Alerta>
      <p>Los bancales guardados en este navegador estaban dañados y no se han podido leer, así que empiezas de cero.</p>
      <Boton variante="secundario" onClick={onEntendido}>
        Entendido
      </Boton>
    </Alerta>
  );
}
