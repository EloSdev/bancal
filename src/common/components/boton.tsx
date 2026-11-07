// El único botón con estilo de la app (design-taste §1: un solo sistema).
// Primario = la acción principal de la pantalla, en pluma azul; secundario =
// contorno de pluma; peligro = borrar (el rojo es de la compatibilidad, así
// que solo para acciones destructivas confirmadas); enlace = una acción
// menor dentro de una línea de texto, con el mismo aspecto que un enlace.
import type { ButtonHTMLAttributes, Ref } from "react";

type Variante = "primario" | "secundario" | "peligro" | "enlace";

const caja =
  "inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 font-medium rounded-control transition-[transform,background-color,color] duration-150 ease-pluma motion-safe:active:scale-[0.97]";

const variantes: Record<Variante, string> = {
  primario: `${caja} bg-acento text-sobre-acento hover:bg-acento-intenso active:bg-acento-intenso`,
  secundario: `${caja} border border-acento text-acento hover:bg-acento/10 active:bg-acento/10`,
  peligro: `${caja} bg-desfavorable text-sobre-acento hover:bg-desfavorable/90 active:bg-desfavorable/90`,
  // Zona de toque de 24 px (tailwind-clases-limpias §6); el subrayado es el del enlace.
  enlace:
    "inline-flex min-h-6 items-center rounded-control text-acento underline decoration-1 underline-offset-4 transition-colors hover:decoration-2 active:text-acento-intenso",
};

interface BotonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variante?: Variante;
  ref?: Ref<HTMLButtonElement>;
}

export function Boton({ variante = "primario", type = "button", ...props }: BotonProps) {
  return <button type={type} className={variantes[variante]} {...props} />;
}
