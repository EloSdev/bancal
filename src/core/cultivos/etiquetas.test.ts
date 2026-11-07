import { describe, expect, it } from "vitest";
import { etiquetaDificultad, etiquetaExposicion, etiquetaZona, MESES, nombreMes, ventanaEnTexto } from "./etiquetas";

describe("etiquetas", () => {
  it("los doce meses, de enero a diciembre", () => {
    expect(MESES).toHaveLength(12);
    expect(nombreMes(1)).toBe("enero");
    expect(nombreMes(12)).toBe("diciembre");
  });

  it("una ventana de un mes se dice «en mayo»; una de varios, «de marzo a mayo»", () => {
    expect(ventanaEnTexto({ desde: 5, hasta: 5 })).toBe("en mayo");
    expect(ventanaEnTexto({ desde: 3, hasta: 5 })).toBe("de marzo a mayo");
    expect(ventanaEnTexto({ desde: 10, hasta: 2 })).toBe("de octubre a febrero");
  });

  it("exposición, zona y dificultad en español, con tildes", () => {
    expect(etiquetaExposicion).toEqual({ "pleno-sol": "Pleno sol", semisombra: "Semisombra", sombra: "Sombra" });
    expect(etiquetaZona).toEqual({ atlantica: "Atlántica", mediterranea: "Mediterránea", interior: "Interior" });
    expect(etiquetaDificultad).toEqual({ facil: "Fácil", media: "Media", dificil: "Difícil" });
  });
});
