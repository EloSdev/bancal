// El bancal en pequeño y a escala, dibujado como en el cuaderno: marco de
// tablones con doble línea en madera, tierra con la cuadrícula a lápiz y cada
// celda plantada con un punto de tinta. Una celda de 30 cm = 10 px, así que
// el más grande (300 × 300) mide 10 × 10 celdas. Decorativo (aria-hidden):
// lo mismo se dice en texto al lado.
import type { Plantacion } from "../../core/bancales/model";

interface CroquisProps {
  columnas: number;
  filas: number;
  plantaciones?: Plantacion[];
}

export function Croquis({ columnas, filas, plantaciones = [] }: CroquisProps) {
  const plantadas = new Set(plantaciones.map(({ celda }) => `${celda.fila}-${celda.columna}`));
  const celdas = Array.from({ length: filas * columnas }, (_, i) => `${Math.floor(i / columnas)}-${i % columnas}`);
  return (
    <div
      aria-hidden="true"
      className="grid w-fit gap-px border-[3px] border-double border-marco bg-lapiz/60 p-px"
      style={{ gridTemplateColumns: `repeat(${columnas}, 0.625rem)` }}
    >
      {celdas.map((clave) => (
        <span key={clave} className="grid size-2.5 place-items-center bg-tierra">
          {plantadas.has(clave) && <span className="size-1.5 rounded-full bg-tinta" />}
        </span>
      ))}
    </div>
  );
}
