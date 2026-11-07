// Avisos de un bancal: recomendaciones con explicación, nunca bloqueos
// («Reglas del dominio» de CLAUDE.md). Se derivan en cada render.
import { nunca } from "../comun/nunca";
import { relacionEntre } from "../cultivos/compatibilidad";
import { etiquetaExposicion, etiquetaZona, nombreMes, ventanaEnTexto } from "../cultivos/etiquetas";
import type { Cultivo, Exposicion, ZonaClimatica } from "../cultivos/model";
import { enVentana } from "../cultivos/ventana";
import { dimensiones, vecinos } from "./cuadricula";
import { exposicion } from "./exposicion";
import type { Aviso, Bancal, Celda, Plantacion } from "./model";

const RANGO_SOL: Record<Exposicion, number> = { sombra: 0, semisombra: 1, "pleno-sol": 2 };

const clave = ({ fila, columna }: Celda) => `${fila}:${columna}`;

const antes = (a: Celda, b: Celda) => a.fila - b.fila || a.columna - b.columna;

/**
 * Vecindad desfavorable (uno por pareja de celdas), falta de sol y siembra fuera
 * de temporada. Las plantaciones de cultivos que no están en `cultivos` se ignoran.
 */
export function avisosBancal(bancal: Bancal, plantaciones: Plantacion[], cultivos: Cultivo[]): Aviso[] {
  const porId = new Map(cultivos.map((c) => [c.id, c]));
  const conCultivo = plantaciones
    .flatMap((p) => {
      const cultivo = porId.get(p.cultivoId);
      return cultivo ? [{ plantacion: p, cultivo }] : [];
    })
    .sort((a, b) => antes(a.plantacion.celda, b.plantacion.celda));
  const porCelda = new Map(conCultivo.map((pc) => [clave(pc.plantacion.celda), pc]));
  const dims = dimensiones(bancal.ancho, bancal.largo);
  const tiene = exposicion(bancal.horasSol);

  const vecindad: Aviso[] = conCultivo.flatMap(({ plantacion, cultivo }) =>
    vecinos(plantacion.celda, dims)
      // Cada pareja se mira una sola vez: desde la celda que va antes.
      .filter((celda) => antes(plantacion.celda, celda) < 0)
      .flatMap((celda): Aviso[] => {
        const vecino = porCelda.get(clave(celda));
        if (!vecino) return [];
        const relacion = relacionEntre(cultivo, vecino.cultivo);
        if (relacion.compatibilidad !== "desfavorable") return [];
        return [
          {
            tipo: "vecindad",
            celdas: [plantacion.celda, vecino.plantacion.celda],
            cultivoIds: [cultivo.id, vecino.cultivo.id],
            motivo: relacion.motivo ?? "",
          },
        ];
      }),
  );

  const porPlantacion: Aviso[] = conCultivo.flatMap(({ plantacion, cultivo }) => {
    const lista: Aviso[] = [];
    if (RANGO_SOL[cultivo.sol] > RANGO_SOL[tiene]) {
      lista.push({ tipo: "sol", celda: plantacion.celda, cultivoId: cultivo.id, necesita: cultivo.sol, tiene });
    }
    if (!enVentana(plantacion.mesSiembra, cultivo.calendario[bancal.zona].siembra)) {
      lista.push({
        tipo: "fuera-de-temporada",
        celda: plantacion.celda,
        cultivoId: cultivo.id,
        mesSiembra: plantacion.mesSiembra,
        zona: bancal.zona,
      });
    }
    return lista;
  });

  return [...vecindad, ...porPlantacion];
}

// En mitad de la frase, las etiquetas van en minúscula («necesita pleno sol»).
const exposicionEnFrase = (e: Exposicion) => etiquetaExposicion[e].toLowerCase();
const zonaEnFrase = (z: ZonaClimatica) => etiquetaZona[z].toLowerCase();

/** La explicación del aviso para el usuario: nombra los cultivos y el porqué. */
export function textoAviso(aviso: Aviso, cultivos: Cultivo[]): string {
  const cultivo = (id: string) => cultivos.find((c) => c.id === id);
  const nombre = (id: string) => cultivo(id)?.nombre ?? id;

  switch (aviso.tipo) {
    case "vecindad": {
      const [a, b] = aviso.cultivoIds;
      return `${nombre(a)} junto a ${nombre(b).toLowerCase()}. ${aviso.motivo}`;
    }
    case "sol":
      return `${nombre(aviso.cultivoId)} necesita ${exposicionEnFrase(aviso.necesita)} y este bancal está en ${exposicionEnFrase(aviso.tiene)}.`;
    case "fuera-de-temporada": {
      const ventana = cultivo(aviso.cultivoId)?.calendario[aviso.zona].siembra;
      const mes = nombreMes(aviso.mesSiembra);
      if (!ventana) return `${nombre(aviso.cultivoId)}: ${mes} queda fuera de su temporada de siembra.`;
      return `${nombre(aviso.cultivoId)} se siembra ${ventanaEnTexto(ventana)} en la zona ${zonaEnFrase(aviso.zona)}; ${mes} queda fuera de temporada.`;
    }
    default:
      return nunca(aviso);
  }
}
