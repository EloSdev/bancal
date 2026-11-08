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
  /**
   * Lo que lee el lector de pantalla («Se siembra de marzo a mayo»). Solo se
   * omite si la ventana ya está en texto visible junto a la regla (la ficha):
   * el dibujo es aria-hidden y sin ella no se lee nada.
   */
  descripcion?: string;
  resaltado?: Mes;
  /**
   * Cómo se marcan los meses de la ventana: relleno en madera (por defecto) o
   * subrayado grueso en madera, para poner dos reglas juntas que se
   * distingan por la forma (siembra y cosecha en la ficha).
   */
  marca?: "relleno" | "subrayado";
}

const marcas = {
  relleno: "data-[dentro=true]:bg-marco data-[dentro=true]:text-superficie",
  subrayado: "data-[dentro=true]:border-b-4 data-[dentro=true]:border-marco data-[dentro=true]:font-semibold data-[dentro=true]:text-tinta",
};

export function ReglaMeses({ ventana, descripcion, resaltado, marca = "relleno" }: ReglaMesesProps) {
  return (
    <div>
      {descripcion && <span className="sr-only">{descripcion}</span>}
      <ol aria-hidden="true" className="grid grid-cols-12 gap-px pt-1.5">
        {MESES.map((nombre, i) => (
          <li
            key={nombre}
            data-dentro={enVentana(i + 1, ventana)}
            className={`relative border-b-2 border-lapiz py-0.5 text-center text-xs text-tinta-suave tabular-nums ${marcas[marca]}`}
          >
            {resaltado === i + 1 && <span className="absolute inset-x-0 -top-1.5 h-0.5 bg-acento" />}
            {nombre.charAt(0).toUpperCase()}
          </li>
        ))}
      </ol>
    </div>
  );
}
