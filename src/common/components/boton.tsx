// El único botón con estilo de la app (design-taste §1: un solo sistema).
// Primario = la acción principal de la pantalla, en pluma azul; secundario =
// contorno de pluma; peligro = borrar (el rojo es de la compatibilidad, así
// que solo para acciones destructivas confirmadas); enlace = una acción
// menor dentro de una línea de texto, con el mismo aspecto que un enlace.
import type { ButtonHTMLAttributes, Ref } from "react";

type Variante = "primario" | "secundario" | "peligro" | "enlace";

// Pegatina (docs/brief.md, «cuaderno pop»): borde de tinta y sombra dura. Al
// pasar el ratón sube y la sombra crece; al pulsar se hunde hasta taparla.
const caja =
  "inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2 font-semibold rounded-control border-2 border-tinta shadow-pegatina transition-[translate,box-shadow,background-color] duration-150 ease-pluma hover:shadow-pegatina-lg motion-safe:hover:-translate-0.5 active:shadow-none motion-safe:active:translate-1 disabled:shadow-none disabled:translate-0";

const variantes: Record<Variante, string> = {
  primario: `${caja} bg-acento text-sobre-acento hover:bg-acento-intenso active:bg-acento-intenso`,
  secundario: `${caja} bg-superficie-elevada text-tinta hover:bg-tierra active:bg-tierra`,
  peligro: `${caja} bg-desfavorable text-sobre-acento hover:bg-desfavorable/90 active:bg-desfavorable/90`,
  // Zona de toque de 24 px (tailwind-clases-limpias §6); el subrayado es el del enlace.
  enlace:
    "inline-flex min-h-6 items-center rounded-control text-acento underline decoration-1 underline-offset-4 transition-colors hover:decoration-2 active:text-acento-intenso",
};

/**
 * Las clases de una variante, para un enlace que se ve como botón: navegar
 * es un <Link>, no un <button> (frontend-a11y §2), pero el aspecto es el mismo.
 */
export const claseBoton = (variante: Exclude<Variante, "enlace"> = "primario") => `${variantes[variante]} no-underline`;

interface BotonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variante?: Variante;
  ref?: Ref<HTMLButtonElement>;
}

export function Boton({ variante = "primario", type = "button", ...props }: BotonProps) {
  return <button type={type} className={variantes[variante]} {...props} />;
}
