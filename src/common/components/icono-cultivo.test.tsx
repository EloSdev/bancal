import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import catalogoJson from "../../../public/crops.json";
import { IconoCultivo } from "./icono-cultivo";

// Lee el catálogo real (como los tests de coherencia de T4): cada cultivo
// tiene que tener su dibujo, también los que se añadan mañana.
const ids: string[] = (catalogoJson as { id: string }[]).map((c) => c.id);

const dibujar = (cultivoId: string) => {
  const { container } = render(<IconoCultivo cultivoId={cultivoId} />);
  return container.querySelector("svg")!;
};

describe("IconoCultivo", () => {
  it.each(ids)("C19.1 · «%s» tiene su propio dibujo", (id) => {
    expect(dibujar(id)).toHaveAttribute("data-cultivo", id);
  });

  it("C19.1 · todos con el mismo viewBox y trazo de 1,5 en currentColor, sin rellenos de color", () => {
    for (const id of ids) {
      const svg = dibujar(id);
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      expect(svg).toHaveAttribute("stroke", "currentColor");
      expect(svg).toHaveAttribute("stroke-width", "1.5");
      expect(svg).toHaveAttribute("fill", "none");
      // Dentro, nadie cambia el trazo ni rellena: todo hereda del <svg>.
      for (const el of svg.querySelectorAll("*")) {
        const propios = ["fill", "stroke", "stroke-width", "style"].filter((a) => el.hasAttribute(a));
        expect([id, el.tagName, propios]).toEqual([id, el.tagName, []]);
      }
    }
  });

  it("C19.4 · no hay dos cultivos con el mismo dibujo", () => {
    const dibujos = ids.map((id) => dibujar(id).innerHTML);
    expect(new Set(dibujos).size).toBe(ids.length);
  });

  it("C19.2 · es decorativo: aria-hidden y sin nombre propio (el nombre va en texto)", () => {
    const svg = dibujar("tomate");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.querySelector("title")).toBeNull();
  });

  it("C19.2 · un id sin dibujo pinta el genérico (una estaca con etiqueta) y no rompe", () => {
    const svg = dibujar("patata");
    expect(svg).toHaveAttribute("data-cultivo", "generico");
    expect(svg.innerHTML).not.toBe("");
  });

  it("C19.2 · dos tamaños: 24 px junto a un nombre, 48 px junto a un título", () => {
    const { container } = render(
      <>
        <IconoCultivo cultivoId="tomate" />
        <IconoCultivo cultivoId="tomate" grande />
      </>,
    );
    const [normal, grande] = container.querySelectorAll("svg");
    expect(normal).toHaveClass("size-6");
    expect(grande).toHaveClass("size-12");
  });
});
