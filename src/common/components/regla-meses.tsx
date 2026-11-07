// Regla de 12 meses a lápiz, como las cotas del cuaderno: las marcas de la
// ventana van rellenas en madera (el color del marco del bancal, para que el
// nombre del cultivo siga mandando) y, si se elige un mes (filtro del
// catálogo, deslizador de la temporada), una cota de pluma azul lo señala
// por encima, siempre sobre el papel. El lector de pantalla lee
// `descripcion`; el dibujo es aria-hidden. Nada depende solo del color:
// relleno sólido frente a papel, y la cota es una forma.
import { MESES } from "../../core/cultivos/etiquetas";
import type { Mes, Ventana } from "../../core/cultivos/model";
import { enVentana } from "../../core/cultivos/ventana";

interface ReglaMesesProps {
  ventana: Ventana;
  /** Lo que lee el lector de pantalla («Se siembra de marzo a mayo»). */
  descripcion: string;
  resaltado?: Mes;
}

export function ReglaMeses({ ventana, descripcion, resaltado }: ReglaMesesProps) {
  return (
    <div>
      <span className="sr-only">{descripcion}</span>
      <ol aria-hidden="true" className="grid grid-cols-12 gap-px pt-1.5">
        {MESES.map((nombre, i) => (
          <li
            key={nombre}
            data-dentro={enVentana(i + 1, ventana)}
            className="relative border-b-2 border-lapiz py-0.5 text-center text-xs text-tinta-suave tabular-nums data-[dentro=true]:bg-marco data-[dentro=true]:text-superficie"
          >
            {resaltado === i + 1 && <span className="absolute inset-x-0 -top-1.5 h-0.5 bg-acento" />}
            {nombre.charAt(0).toUpperCase()}
          </li>
        ))}
      </ol>
    </div>
  );
}
