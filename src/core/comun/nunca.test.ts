import { describe, expect, it } from "vitest";
import type { Aviso, EstadoPlanta } from "../bancales/model";
import { nunca } from "./nunca";

// C3.2 se comprueba en COMPILACIÓN (`tsc --noEmit`, dentro de `npm run build`):
// un switch sobre EstadoPlanta o Aviso que olvida un caso no compila, porque el
// valor que llega a `nunca()` no es `never`. Cada `@ts-expect-error` de abajo
// afirma que ese error existe: si un día deja de producirse (la unión cambia o
// `nunca` acepta cualquier cosa), el propio @ts-expect-error rompe el build.

function estadoSinTerminada(estado: EstadoPlanta): string {
  switch (estado.tipo) {
    case "por-sembrar":
    case "sembrada":
    case "creciendo":
    case "cosecha":
      return estado.tipo;
    default:
      // @ts-expect-error C3.2: falta el caso "terminada"
      return nunca(estado);
  }
}

function avisoSinSol(aviso: Aviso): string {
  switch (aviso.tipo) {
    case "vecindad":
    case "fuera-de-temporada":
      return aviso.tipo;
    default:
      // @ts-expect-error C3.2: falta el caso "sol"
      return nunca(aviso);
  }
}

function estadoCompleto(estado: EstadoPlanta): string {
  switch (estado.tipo) {
    case "por-sembrar":
      return `Se siembra en el mes ${estado.siembraEn}`;
    case "sembrada":
      return "Sembrada";
    case "creciendo":
      return `Se cosecha desde el mes ${estado.cosechaDesde}`;
    case "cosecha":
      return `Se cosecha hasta el mes ${estado.cosechaHasta}`;
    case "terminada":
      return "Terminada";
    default:
      return nunca(estado);
  }
}

describe("nunca", () => {
  it("C3.2 · un switch con todos los estados compila y cubre cada caso", () => {
    expect(estadoCompleto({ tipo: "por-sembrar", siembraEn: 4 })).toBe("Se siembra en el mes 4");
    expect(estadoCompleto({ tipo: "terminada" })).toBe("Terminada");
  });

  it("C3.2 · si un caso se cuela en ejecución (datos corruptos), falla en voz alta", () => {
    expect(() => estadoSinTerminada({ tipo: "terminada" })).toThrow("Caso no previsto: terminada");
    expect(() =>
      avisoSinSol({ tipo: "sol", celda: { fila: 0, columna: 0 }, cultivoId: "tomate", necesita: "pleno-sol", tiene: "sombra" }),
    ).toThrow("Caso no previsto: sol");
  });
});
