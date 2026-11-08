// El bancal en pequeño y a escala, dibujado como en el cuaderno: marco de
// tablones con doble línea en madera, tierra con la cuadrícula a lápiz y cada
// celda plantada con un punto de tinta. Una celda de 30 cm = 10 px (24 px en
// grande, la vista previa del formulario). Decorativo (aria-hidden): lo mismo
// se dice en texto al lado.
import type { Dimensiones } from "../../core/bancales/cuadricula";
import type { Plantacion } from "../../core/bancales/model";

interface CroquisProps {
  columnas: number;
  filas: number;
  plantaciones?: Plantacion[];
  grande?: boolean;
  /**
   * Al encoger: el bancal nuevo. Las celdas de fuera se quedan en papel (ya no
   * son bancal) y su punto, hueco: es lo que se quita al guardar.
   */
  recorte?: Dimensiones;
}

export function Croquis({ columnas, filas, plantaciones = [], grande = false, recorte }: CroquisProps) {
  const plantadas = new Set(plantaciones.map(({ celda }) => `${celda.fila}-${celda.columna}`));
  const celdas = Array.from({ length: filas * columnas }, (_, i) => ({
    fila: Math.floor(i / columnas),
    columna: i % columnas,
  }));
  return (
    <div
      aria-hidden="true"
      className="grid w-fit gap-px border-[3px] border-double border-marco bg-lapiz/60 p-px"
      style={{ gridTemplateColumns: `repeat(${columnas}, ${grande ? "1.5rem" : "0.625rem"})` }}
    >
      {celdas.map(({ fila, columna }) => {
        const clave = `${fila}-${columna}`;
        const fuera = recorte !== undefined && (fila >= recorte.filas || columna >= recorte.columnas);
        return (
          <span
            key={clave}
            data-fuera={fuera}
            className="grid aspect-square place-items-center bg-tierra data-[fuera=true]:bg-superficie"
          >
            {plantadas.has(clave) && (
              <span
                data-fuera={fuera}
                className={`rounded-full bg-tinta data-[fuera=true]:border-2 data-[fuera=true]:border-tinta data-[fuera=true]:bg-transparent ${grande ? "size-2.5" : "size-1.5"}`}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
