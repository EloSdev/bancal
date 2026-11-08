// Iconos de cultivo del brief («Cultivos en pantalla»): un dibujo por
// cultivo de LO QUE SE COSECHA (el fruto, la raíz o la mata si se recoge
// entera), que es lo que se reconoce a 24 px; los dibujos de cada estado
// (semilla, brote, planta) son del detalle memorable, T15. A tinta, como con
// estilográfica: viewBox de 24 × 24, trazo de 1,5 px en currentColor (no
// escala con el tamaño: non-scaling-stroke), sin rellenos y sin círculos
// geométricos (todo a mano alzada, con el cierre un poco montado). Los puntos
// (semillas de la fresa) son trazos de largo cero con la punta redonda.
// Decorativos (aria-hidden): el nombre del cultivo va siempre en texto al
// lado. Se distinguen por la silueta, no por el color (C19.4).
import type { ReactNode } from "react";

const PETALO = "M11.1 6.9C10.8 4.6 11.3 3 12 3s1.2 1.6.9 3.9";

const dibujos: Record<string, ReactNode> = {
  // Solanáceas: frutos
  tomate: (
    <>
      {/* Achatado, con la muesca del tallo y el cáliz en estrella apoyado
          (sin gajos marcados: con ellos se lee calabaza) */}
      <path d="M12 9.2c-3-1.4-7.2-.6-7.8 3.5-.6 4 2.6 7.8 7.8 7.8s8.4-3.8 7.8-7.8c-.6-4.1-4.8-4.9-7.8-3.5" />
      <path d="M12 9.2c0-2 .4-3.6 1.6-4.6M12 9.2c-1.2-1-2.8-1-4 0M12 9.2c1.2-1 2.8-1 4 0M12 9.2c-.8.6-1.4 1.6-1.5 2.6M12 9.2c.8.6 1.4 1.6 1.5 2.6" />
    </>
  ),
  pimiento: (
    <>
      {/* Morrón: tres lóbulos abajo y pedúnculo curvo */}
      <path d="M7 9.5c-1.5 1.5-1.7 5.5-.8 8.5.6 2 2.1 2.6 3.3 1.6.8 1.2 1.7 1.4 2.5.6.8.8 1.7.6 2.5-.6 1.2 1 2.7.4 3.3-1.6.9-3 .7-7-.8-8.5-1.5-1.3-8.5-1.3-10 0z" />
      <path d="M12 9c0-2-.5-3.5 1-5 .8-.7 1.8-.8 2.5-.5" />
    </>
  ),
  berenjena: (
    <>
      <path d="M9.5 7c3 .2 4.5 2.3 7 3.3 3.3 1.4 4.5 4.6 3 7.7-1.5 3-5.5 3.4-8 1.8-3-2-4.4-6.5-5.4-9.4" />
      <path d="M5 10.5c.3-2.4 2.3-4.2 4.5-3.5L8.8 9l2.4-.3M7 7.2 5 4" />
    </>
  ),
  // Apiáceas: raíces, bulbos y hojas finas
  zanahoria: (
    <>
      <path d="M7 8h10l-4.2 13c-.3.7-1.3.7-1.6 0z" />
      <path d="M9 11.5h2.8M10.3 15h2.2M12 8V3M12 8 8.5 3.5M12 8l3.5-4.5" />
    </>
  ),
  hinojo: (
    <>
      {/* Bulbo ancho de vainas solapadas; tallos en abanico con penachos */}
      <path d="M10 9v2.5C8 12 5 13 5 17c0 2.5 3 4 7 4s7-1.5 7-4c0-4-3-5-5-5.5V9" />
      <path d="M12 21c-2.5-2-3-6-2-9.5M12 21c2.5-2 3-6 2-9.5" />
      <path d="M10 9 7 3.5M12 9V3M14 9l3-5.5M7 3.5 5.5 3M7 3.5l-.2-1.5M12 3l-1-1M12 3l1-1M17 3.5l.2-1.5M17 3.5l1.5-.5M8.5 6 7 5.8M15.5 6l1.5-.2" />
    </>
  ),
  perejil: (
    <>
      <path d="M12 21v-9M12 15l-4-5M12 15l4-5" />
      <path d="M12 12c-2-1-2-5 0-7 2 2 2 6 0 7zM8 10c-2 0-3.5-2.5-2.5-4.5 2 0 3.5 2.5 2.5 4.5zM16 10c2 0 3.5-2.5 2.5-4.5-2 0-3.5 2.5-2.5 4.5z" />
    </>
  ),
  cilantro: (
    <>
      {/* Hojitas de tres lóbulos festoneados */}
      <path d="M12 21V10M12 17l-4.5-2M12 17l4.5-2" />
      <path d="M12 10c-2 0-3.5-1-3-2.5-1-1-.2-2.7 1.3-2.3.2-1.4 3.2-1.4 3.4 0 1.5-.4 2.3 1.3 1.3 2.3.5 1.5-1 2.5-3 2.5z" />
      <path d="M7.5 15c-1.5 0-2.5-.8-2.1-2-.8-.8-.2-2.2 1-1.9.2-1.1 2.2-1.1 2.4 0 1.2-.3 1.8 1.1 1 1.9.4 1.2-.8 2-2.3 2z" />
      <path d="M16.5 15c-1.5 0-2.5-.8-2.1-2-.8-.8-.2-2.2 1-1.9.2-1.1 2.2-1.1 2.4 0 1.2-.3 1.8 1.1 1 1.9.4 1.2-.8 2-2.3 2z" />
    </>
  ),
  // Asteráceas
  lechuga: (
    // Roseta que se abre: hojas de fuera rizadas, cogollo en medio
    <g transform="translate(0 -2)">
      <path d="M7 20h10M8 20c-3-2-4.5-6-4-10 3 1 5 4 6 8M16 20c3-2 4.5-6 4-10-3 1-5 4-6 8" />
      <path d="M12 20c-2.5-2-3.5-6-2.5-10 1.2-1.5 3.8-1.5 5 0 1 4 0 8-2.5 10" />
      <path d="M9.6 10q1.2 1 2.4 0 1.2 1 2.4 0M4 10q.5-1.5 1.5-1M20 10q-.5-1.5-1.5-1" />
    </g>
  ),
  calendula: (
    <>
      {/* Margarita de pétalos en lazo (no rayos: no es un sol) */}
      <path d="M12 6.8c1.3 0 2.2 1 2.2 2.2 0 1.3-1 2.2-2.2 2.2s-2.2-.9-2.2-2.2c0-1.2 1-2.2 2.4-2.15" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((grados) => (
        <path key={grados} d={PETALO} transform={`rotate(${grados} 12 9)`} />
      ))}
      <path d="M12 15v6.5M12 19c2-1.5 4-1 5 0" />
    </>
  ),
  // Brasicáceas
  rabano: (
    <>
      <path d="M12 9.5c2.6-.1 4.5 2 4.5 4.5s-2 4.5-4.5 4.5-4.5-2-4.5-4.5c0-2.4 1.8-4.4 4.3-4.5" />
      <path d="M12 18.5c0 1.5.3 3 .8 4M12 9.5C10 7 8 6 7 3c2.5 0 4.5 2 5 6.5zM12 9.5c2-2.5 4-3.5 5-6.5-2.5 0-4.5 2-5 6.5z" />
    </>
  ),
  rucula: (
    // Una hoja suelta e inclinada, lobulada como el diente de león
    <path d="M5 20c2-1 3-1.5 4-1.5l.5-2c1.5 0 2.5-.5 3-1.5l.5-2c1.5 0 2.5-1 3-2l.5-1.5c2 0 3.5-1.5 3.5-3.5S18 3 16 3.5c-1.5.5-2.5 2-2 3.5l-2 .5c-.5 1.5-.5 2.5 0 3l-2 .5c-1 1.5-1 2.5-.5 3.5l-2 .5c-1 1.5-1.5 3-2.5 5zM5 20 16.5 6.5" />
  ),
  // Amarantáceas
  acelga: (
    <>
      <path d="M11 22v-9M13 22v-9" />
      <path d="M12 13c-6-1-7-7-4-9.5 2-1.5 6-1.5 8 0 3 2.5 2 8.5-4 9.5z" />
      <path d="M12 13V4.5M12 9 9.5 7M12 9l2.5-2" />
    </>
  ),
  espinaca: (
    <>
      <path d="M10 21c-5-1-7-6-5-10 3 1 5 5 5 10zM13 21c0-6 2-12 7-14 1 6-2 12-7 14z" />
      <path d="M10 21l-3.5-7.5M13 21l5-11" />
    </>
  ),
  remolacha: (
    <>
      <path d="M12 21c-4-2-6-5-5.5-8 .5-2.5 3-3.5 5.5-3.5s5 1 5.5 3.5c.5 3-1.5 6-5.5 8z" />
      <path d="M12 21v1.5M11 9.5c-1-3.5-3-5.5-6-6 0 2.5 2.5 5 6 6zM13 9.5c1-3.5 3-5.5 6-6 0 2.5-2.5 5-6 6zM11 9.5 7.5 5.5M13 9.5l3.5-4" />
    </>
  ),
  // Fabáceas: vainas
  "judia-verde": (
    <>
      <path d="M5 4c0 8 4 15 13 16.5 1 .1 1.5-.7 1-1.5-8-2.5-11.5-8-12-15-.1-.8-1.9-.8-2 0zM6 4c0-1 1-2 2-2" />
      {/* Las judías marcadas en la vaina */}
      <path d="M6.6 8.2l1.3-.3M8 12.4l1.2-.6M10.6 15.9l1-.9M14 18.6l.6-1" />
    </>
  ),
  guisante: (
    <>
      <path d="M3 9.5c3 8.5 14 9.5 18-1M3 9.5c5 3.5 13 3.5 18-1M21 8.5c1-2-.5-4-2-3-1 1 .5 2 1 1" />
      <path d="M7.5 12.3c.9 0 1.5.7 1.5 1.5s-.6 1.5-1.5 1.5S6 14.6 6 13.8s.6-1.5 1.6-1.45M12 13.1c.9 0 1.5.7 1.5 1.5s-.6 1.5-1.5 1.5-1.5-.7-1.5-1.5.6-1.5 1.6-1.45M16.5 12.1c.9 0 1.5.7 1.5 1.5s-.6 1.5-1.5 1.5-1.5-.7-1.5-1.5.6-1.5 1.6-1.45" />
    </>
  ),
  haba: (
    <>
      {/* Vaina gruesa en diagonal, con punta; semillas en riñón con su «ojo» */}
      <path d="M5 19c-1.5-4 1-10 6-13 3-2 6.5-3 9-2.5 0 2.5-1.5 6.5-5 10.5-3 3.5-7 6-10 5zM5 19l-1.5 1.5" />
      <path d="M7 16.5c-.6-1.4.4-2.8 1.9-2.6 1.2.2 1.4 1.6.5 2.4-.8.7-2 .8-2.4.2zM10.5 12.9c-.6-1.4.4-2.8 1.9-2.6 1.2.2 1.4 1.6.5 2.4-.8.7-2 .8-2.4.2zM14 9.3c-.6-1.4.4-2.8 1.9-2.6 1.2.2 1.4 1.6.5 2.4-.8.7-2 .8-2.4.2z" />
      <path d="M8 15.6l.6-.4M11.5 12l.6-.4M15 8.4l.6-.4" />
    </>
  ),
  // Amarilidáceas: bulbos y tallos
  cebolla: (
    <>
      {/* Redonda, de cuello largo y con capas (el ajo, en cambio, en dientes) */}
      <path d="M11.4 2.5V7c0 2-5.9 3.5-6.4 7.5-.4 3.5 3 6 7 6s7.4-2.5 7-6c-.5-4-6.4-5.5-6.4-7.5V2.5" />
      <path d="M12 9.6c-3 1.4-4.5 3.4-4.5 5.9 0 2.5 2 4 4.5 4M12 12c-1.6.8-2.3 2-2.3 3.4 0 1.5 1 2.4 2.3 2.4" />
      <path d="M10 20.8l-.8 1.2M12 20.8V22M14 20.8l.8 1.2" />
    </>
  ),
  ajo: (
    <>
      <path d="M12 4c.5 2 1 3 3 4 3 1.5 4 4 3.5 7-.5 3.5-3.5 5-6.5 5s-6-1.5-6.5-5c-.5-3 .5-5.5 3.5-7 2-1 2.5-2 3-4z" />
      <path d="M12 8v12M9 9c-1 3-.5 8 1 11M15 9c1 3 .5 8-1 11" />
    </>
  ),
  puerro: (
    <g transform="translate(0 -1)">
      <path d="M10 21V11M14 21V11M10 21h4M10 15h4" />
      <path d="M10 11C9 8 7 5 5 3M14 11c1-3 3-6 5-8M12 11V3M10.5 21.5l-1 1.5M12 21.5V23M13.5 21.5l1 1.5" />
    </g>
  ),
  cebollino: (
    <>
      <path d="M9 21 8 8M10.5 21 10 9.5M12 21V6M13.5 21l.5-11.5M15 21l1-13" />
      <path d="M12 2c1.2 0 2 .9 2 2s-.8 2-2 2-2-.9-2-2 .9-2 2.1-1.95" />
    </>
  ),
  // Lamiáceas
  albahaca: (
    <>
      {/* Dos pares de hojas anchas y abombadas, con su nervio, y el cogollo */}
      <path d="M12 22V7M12 7c-1.2-1-1.2-3 0-4 1.2 1 1.2 3 0 4" />
      <path d="M12 11c-4 1-7.5-1-7.5-4.5 4-.5 7 1.5 7.5 4.5zM12 11c4 1 7.5-1 7.5-4.5-4-.5-7 1.5-7.5 4.5zM12 17c-3.5 1-6.5-.5-6.5-3.5 3.5-.5 6 1 6.5 3.5zM12 17c3.5 1 6.5-.5 6.5-3.5-3.5-.5-6 1-6.5 3.5z" />
      <path d="M12 11 7 8M12 11l5-3M12 17l-4-2.2M12 17l4-2.2" />
    </>
  ),
  // Rosáceas
  fresa: (
    <>
      <path d="M12 21c-5-4-7-8-6.5-11 .5-2 2.5-2.5 6.5-1.5 4-1 6-.5 6.5 1.5.5 3-1.5 7-6.5 11z" />
      <path d="M8 8l1.5-2.5L11 7.5l1-3 1 3 1.5-2L16 8" />
      <path d="M9.5 11.5h0M12 12.5h0M14.5 11.5h0M10.5 15h0M13.5 15h0M12 17.5h0" />
    </>
  ),
  // Tropeoláceas: hoja redonda con los nervios desde un punto descentrado, y su
  // flor de trompeta con espolón (lo que la hace reconocible)
  capuchina: (
    <>
      <path d="M9 8.5c3.3-.1 5.6 2.5 5.5 5.5-.1 3.2-2.5 5.5-5.5 5.5s-5.5-2.3-5.5-5.5c0-3.1 2.4-5.4 5.3-5.5" />
      <path d="M8 15l1-6M8 15l5.8-3M8 15l5 3M8 15l-3 4M8 15l-4.2-2.5M9.5 19.5l1 2.5" />
      <path d="M15 9c-1-2.5 0-5 2-5.5 2.5-.5 4 1 3.5 3.5-.5 2-2.5 3-4.5 2.5zM15 9c-1.5.5-2.5-.5-3-2M17 6.5 16 8" />
    </>
  ),
};

/**
 * El genérico: una estaca de huerto con su etiqueta, para un cultivo que aún
 * no tiene dibujo (no un brote: se confundiría con ese estado de la planta).
 */
const estaca = (
  <path d="M12 22V11M8 22h8M7.5 4.5h9c.6 0 1 .4 1 1V10c0 .6-.4 1-1 1h-9c-.6 0-1-.4-1-1V5.5c0-.6.4-1 1-1zM9 7.8h6" />
);

interface IconoCultivoProps {
  cultivoId: string;
  /** 48 px, junto a un título; si no, 24 px, junto a un nombre. */
  grande?: boolean;
}

export function IconoCultivo({ cultivoId, grande = false }: IconoCultivoProps) {
  const dibujo = dibujos[cultivoId];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-cultivo={dibujo ? cultivoId : "generico"}
      // vector-effect no se hereda: va en cada descendiente (variante **:).
      className={`shrink-0 **:[vector-effect:non-scaling-stroke] ${grande ? "size-12" : "size-6"}`}
    >
      {dibujo ?? estaca}
    </svg>
  );
}
