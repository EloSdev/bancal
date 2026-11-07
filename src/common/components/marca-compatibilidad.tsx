// Compatibilidad entre vecinos: color + icono de forma propia + texto (nunca
// solo color, guía §4). Formas del brief: círculo ✓, rombo ✕, cápsula –.
// Estilo «sello de tinta»: figura rellena con un contorno de tinta tenue,
// como estampada en el papel. Las tres figuras están compensadas a ojo para
// pesar parecido (el rombo y la cápsula, más grandes que el círculo).
// Las mismas palabras («Se ayudan», «Se perjudican», «Sin efecto») en el panel
// de avisos y en el nombre accesible de las celdas: un dato se dice siempre igual.
import type { ReactNode } from "react";
import type { Compatibilidad } from "../../core/cultivos/model";

export const textoCompatibilidad: Record<Compatibilidad, string> = {
  favorable: "Se ayudan",
  desfavorable: "Se perjudican",
  neutra: "Sin efecto",
};

const color: Record<Compatibilidad, string> = {
  favorable: "text-favorable",
  desfavorable: "text-desfavorable",
  neutra: "text-neutra",
};

const forma: Record<Compatibilidad, string> = { favorable: "circulo", desfavorable: "rombo", neutra: "capsula" };

// El borde del sello: tinta tenue alrededor de la figura.
const sello = { className: "stroke-tinta", strokeOpacity: 0.35, strokeWidth: 1.5, strokeLinejoin: "round" } as const;
// El signo interior, en papel claro sobre la figura de color.
const signo = {
  className: "fill-none stroke-superficie-elevada",
  strokeWidth: 2.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const figura: Record<Compatibilidad, ReactNode> = {
  favorable: (
    <>
      <circle cx="10" cy="10" r="9.6" fill="currentColor" {...sello} />
      <path d="M5.8 10.4l2.8 2.7L14.2 7.4" {...signo} />
    </>
  ),
  desfavorable: (
    <>
      <path d="M10 -0.6L20.6 10 10 20.6 -0.6 10z" fill="currentColor" {...sello} />
      <path d="M7.1 7.1l5.8 5.8M12.9 7.1l-5.8 5.8" {...signo} />
    </>
  ),
  neutra: (
    <>
      <rect x="-0.4" y="4.4" width="20.8" height="11.2" rx="5.6" fill="currentColor" {...sello} />
      <path d="M6 10h8" {...signo} />
    </>
  ),
};

// Tamaño mínimo 16 px (marca en la esquina de una celda); 20 px por defecto.
export function IconoCompatibilidad({ tipo, pequeno = false }: { tipo: Compatibilidad; pequeno?: boolean }) {
  return (
    <svg
      viewBox="-1.5 -1.5 23 23"
      className={`${pequeno ? "size-4" : "size-5"} shrink-0 ${color[tipo]}`}
      data-forma={forma[tipo]}
      aria-hidden="true"
    >
      {figura[tipo]}
    </svg>
  );
}

export function MarcaCompatibilidad({ tipo }: { tipo: Compatibilidad }) {
  return (
    <span className="inline-flex items-center gap-2">
      <IconoCompatibilidad tipo={tipo} />
      <span>{textoCompatibilidad[tipo]}</span>
    </span>
  );
}

const tipos: Compatibilidad[] = ["favorable", "desfavorable", "neutra"];

export function LeyendaCompatibilidad() {
  return (
    <ul aria-label="Cómo se llevan los vecinos" className="flex flex-wrap gap-x-6 gap-y-2">
      {tipos.map((tipo) => (
        <li key={tipo}>
          <MarcaCompatibilidad tipo={tipo} />
        </li>
      ))}
    </ul>
  );
}
