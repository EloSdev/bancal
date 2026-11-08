// Los dibujos de los estados de la planta que comparten todos los cultivos
// (docs/brief.md, «Detalle memorable»: semilla y brote compartidos), más el
// rastrojo de «terminada». Mismo juego que los iconos de cultivo: viewBox de
// 24, trazo de 1,5 px en currentColor sin escalar. La «cosecha» es el icono
// del cultivo (T19); la planta propia de cada cultivo es una iteración.
// Decorativos: el estado va en texto en la descripción de la celda.
import type { ReactNode } from "react";

export type EstadoDibujado = "semilla" | "brote" | "rastrojo";

const dibujos: Record<EstadoDibujado, ReactNode> = {
  // La semilla en la tierra, con la línea del suelo
  semilla: (
    <path d="M4 17h16M6.5 20h2M11 20h2M15.5 20h2M12 11.5c1.9 0 3 1.3 3 2.8s-1.1 2.7-3 2.7-3-1.2-3-2.7 1.1-2.8 3.1-2.75M11 13.5c.4-.6 1.1-.9 1.8-.8" />
  ),
  // Dos hojitas recién salidas
  brote: <path d="M4 20h16M12 20v-8M12 15c-3 0-5-2-5-5 3 0 5 2 5 5zM12 12c0-3 2-5 5-5 0 3-2 5-5 5z" />,
  // Lo que queda tras la cosecha: tallos cortados sobre el suelo
  rastrojo: <path d="M4 18h16M7 18l-.6-4.5M6 13.3l1-.4M10 18v-5.5M9.4 12.3h1.2M13 18l.5-4.8M13 13l1.1.2M16.5 18l1-4M17 13.8l1 .5" />,
};

export function IconoEstado({ estado }: { estado: EstadoDibujado }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-dibujo={estado}
      className="size-6 shrink-0 **:[vector-effect:non-scaling-stroke]"
    >
      {dibujos[estado]}
    </svg>
  );
}
