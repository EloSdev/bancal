import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeyendaCompatibilidad, MarcaCompatibilidad } from "./marca-compatibilidad";

describe("MarcaCompatibilidad", () => {
  it("C2.3 · cada compatibilidad lleva un icono de forma distinta, oculto al lector, y su texto", () => {
    const { container } = render(
      <>
        <MarcaCompatibilidad tipo="favorable" />
        <MarcaCompatibilidad tipo="desfavorable" />
        <MarcaCompatibilidad tipo="neutra" />
      </>,
    );

    const iconos = [...container.querySelectorAll("svg")];
    expect(iconos).toHaveLength(3);
    expect(new Set(iconos.map((svg) => svg.dataset.forma)).size).toBe(3);
    iconos.forEach((svg) => expect(svg).toHaveAttribute("aria-hidden", "true"));

    expect(screen.getByText("Se ayudan")).toBeInTheDocument();
    expect(screen.getByText("Se perjudican")).toBeInTheDocument();
    expect(screen.getByText("Sin efecto")).toBeInTheDocument();
  });

  it("C2.3 · la leyenda muestra los tres estados en una lista con nombre", () => {
    render(<LeyendaCompatibilidad />);

    const lista = screen.getByRole("list", { name: "Cómo se llevan los vecinos" });
    expect(lista.querySelectorAll("li")).toHaveLength(3);
  });
});
