import { describe, expect, it } from "vitest";
import catalogoJson from "../../../public/crops.json";
import { zonas } from "../../core/cultivos/cultivo.schema";
import type { Cultivo } from "../../core/cultivos/model";
import { enVentana } from "../../core/cultivos/ventana";
import { NOTAS_DEL_MES } from "./notas-del-mes";

// Como el test de coherencia del catálogo (T4), este lee el crops.json real:
// existe para que un consejo nunca diga algo que el catálogo no respalda.
const catalogo = catalogoJson as unknown as Cultivo[];
const cultivo = (id: string) => catalogo.find((c) => c.id === id);
const meses = Array.from({ length: 12 }, (_, i) => i + 1);

describe("notas del mes de la portada (T24)", () => {
  it("C24.1 · hay un consejo para cada uno de los 12 meses, sin hablar de zonas", () => {
    for (const mes of meses) {
      const nota = NOTAS_DEL_MES[mes];
      expect(nota, `mes ${mes}`).toBeDefined();
      expect(nota!.texto.length).toBeGreaterThan(10);
      expect(nota!.texto).not.toMatch(/atl[aá]ntica|mediterr[aá]nea|interior|zona/i);
    }
  });

  it.each(meses)("C24.2 · mes %i: lo que el consejo manda sembrar o cosechar es cierto en las tres zonas", (mes) => {
    const nota = NOTAS_DEL_MES[mes]!;
    for (const id of [...nota.siembra, ...nota.cosecha, nota.icono]) {
      expect(cultivo(id), `«${id}» no está en el catálogo`).toBeDefined();
    }
    for (const id of nota.siembra) {
      for (const zona of zonas) {
        expect(enVentana(mes, cultivo(id)!.calendario[zona].siembra), `${id} no se siembra en el mes ${mes} (${zona})`).toBe(true);
      }
    }
    for (const id of nota.cosecha) {
      for (const zona of zonas) {
        expect(enVentana(mes, cultivo(id)!.calendario[zona].cosecha), `${id} no se cosecha en el mes ${mes} (${zona})`).toBe(true);
      }
    }
  });
});
