// El <h1> de una pantalla a la que se llega navegando: recibe el foco al
// montarse, para que el lector anuncie dónde está (frontend-a11y §6). Es el
// mismo patrón que la ficha de cultivo; el arreglo general de la app es T16.
import { useEffect, useRef, type ReactNode } from "react";

export function TituloPagina({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1} className="w-fit break-words">
      {children}
    </h1>
  );
}
