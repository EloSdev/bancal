// El bancal de ejemplo de la portada: el mismo dibujo a tinta que el editor
// (marco de tablones, tierra, cuadrícula a lápiz, cotas, iconos y marcas en
// la esquina), quieto y sin botones. Las marcas son las que calcula el editor
// para esta disposición (se comprobó con los datos reales): no se inventan.
// El aviso copia el motivo de crops.json (lo vigila portada.test.tsx).
// Decorativo: el <figcaption> lo cuenta en texto; el aviso es texto de verdad.
import { useId } from "react";
import { Cota } from "../../common/components/cota";
import { IconoCultivo } from "../../common/components/icono-cultivo";
import { IconoCompatibilidad } from "../../common/components/marca-compatibilidad";
import type { Compatibilidad } from "../../core/cultivos/model";

interface CeldaEjemplo {
  cultivoId: string;
  nombre: string;
  marca: Compatibilidad;
}

// 120 × 90 cm → 4 × 3 celdas de 30 cm. null = celda vacía.
const FILAS: (CeldaEjemplo | null)[][] = [
  [
    { cultivoId: "tomate", nombre: "Tomate", marca: "desfavorable" },
    { cultivoId: "albahaca", nombre: "Albahaca", marca: "favorable" },
    { cultivoId: "lechuga", nombre: "Lechuga", marca: "favorable" },
    { cultivoId: "rabano", nombre: "Rábano", marca: "favorable" },
  ],
  [
    { cultivoId: "hinojo", nombre: "Hinojo", marca: "desfavorable" },
    null,
    { cultivoId: "zanahoria", nombre: "Zanahoria", marca: "favorable" },
    { cultivoId: "cebolla", nombre: "Cebolla", marca: "favorable" },
  ],
  [{ cultivoId: "calendula", nombre: "Caléndula", marca: "neutra" }, null, null, null],
];

const MOTIVO_HINOJO_TOMATE = "Ojo: se dice que el hinojo frena el crecimiento de las tomateras; mejor dale su propio rincón.";

export function BancalEjemplo() {
  const idPie = useId();
  return (
    <figure aria-labelledby={idPie} className="mx-auto w-fit max-w-full">
      <div className="relative">
        <div aria-hidden="true" className="grid grid-cols-[auto_auto] gap-2">
          <Cota texto="120 cm" />
          <span />
          <div className="border-4 border-double border-marco bg-lapiz/70 p-px">
            <div className="grid grid-cols-4 gap-px">
              {FILAS.flatMap((fila, f) =>
                fila.map((celda, c) => <Celda key={`${f}-${c}`} celda={celda} orden={f * 4 + c} />),
              )}
            </div>
          </div>
          <Cota texto="90 cm" vertical />
        </div>

        {/* La nota del aviso, posada sobre el dibujo como en el panel del editor. */}
        <div className="relative z-10 mx-2 mt-3 max-w-64 space-y-1 rounded-hoja border border-lapiz bg-superficie-elevada p-3 text-sm shadow-hoja motion-safe:animate-posarse sm:absolute sm:right-0 sm:-bottom-14 sm:mx-0 sm:mt-0 sm:-rotate-1">
          <p className="flex items-center gap-2 font-semibold">
            <IconoCompatibilidad tipo="desfavorable" />
            <span>Hinojo junto a tomate</span>
          </p>
          <p className="text-tinta-suave">{MOTIVO_HINOJO_TOMATE}</p>
        </div>
      </div>

      <figcaption id={idPie} className="mt-4 max-w-80 text-xs text-tinta-suave italic sm:mt-14">
        Bancal de ejemplo de 120 × 90 cm: tomate, albahaca, lechuga, rábano, hinojo, zanahoria, cebolla y caléndula.
        El tomate se ayuda con la albahaca y se perjudica con el hinojo.
      </figcaption>
    </figure>
  );
}

function Celda({ celda, orden }: { celda: CeldaEjemplo | null; orden: number }) {
  return (
    <div className="relative grid size-16 place-items-center bg-tierra sm:size-20">
      {celda && (
        <>
          <span className="absolute top-0.5 right-0.5">
            <IconoCompatibilidad tipo={celda.marca} pequeno />
          </span>
          {/* Se dibuja con la pluma, celda a celda, al abrir la portada. */}
          <span
            className="flex flex-col items-center gap-1 motion-safe:animate-trazar [&>svg]:size-7 sm:[&>svg]:size-9"
            style={{ animationDelay: `${120 + orden * 70}ms` }}
          >
            <IconoCultivo cultivoId={celda.cultivoId} />
            <span className="text-[0.6875rem] leading-none">{celda.nombre}</span>
          </span>
        </>
      )}
    </div>
  );
}
