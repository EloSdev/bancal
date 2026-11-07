// Cultivos de prueba para la lógica de core/: pocos y explícitos. Copian las
// relaciones reales del catálogo que importan a la demo (tomate–albahaca
// favorable, tomate–hinojo desfavorable, albahaca–hinojo neutra), pero los
// tests no leen public/crops.json: si cambia un dato del catálogo, no se rompen.
import type { CalendarioZona, Cultivo, ZonaClimatica } from "../cultivos/model";

const MOTIVO_HINOJO_TOMATE = "Se dice que el hinojo frena el crecimiento de las tomateras.";

function calendario(
  porZona: Partial<Record<ZonaClimatica, CalendarioZona>>,
  resto: CalendarioZona,
): Record<ZonaClimatica, CalendarioZona> {
  return {
    atlantica: porZona.atlantica ?? resto,
    mediterranea: porZona.mediterranea ?? resto,
    interior: porZona.interior ?? resto,
  };
}

export const tomate: Cultivo = {
  id: "tomate",
  nombre: "Tomate",
  familia: "Solanáceas",
  plantasPorCelda: 1,
  sol: "pleno-sol",
  riego: "alto",
  dificultad: "media",
  calendario: calendario(
    { atlantica: { siembra: { desde: 5, hasta: 5 }, cosecha: { desde: 7, hasta: 9 }, ciclo: { mesesHastaCosecha: 2, mesesDeCosecha: 2 } } },
    { siembra: { desde: 4, hasta: 5 }, cosecha: { desde: 6, hasta: 9 }, ciclo: { mesesHastaCosecha: 2, mesesDeCosecha: 2 } },
  ),
  compatibles: [{ cultivoId: "albahaca", motivo: "Pareja tradicional." }],
  incompatibles: [{ cultivoId: "hinojo", motivo: MOTIVO_HINOJO_TOMATE }],
  fuentes: ["prueba"],
};

export const albahaca: Cultivo = {
  id: "albahaca",
  nombre: "Albahaca",
  familia: "Lamiáceas",
  plantasPorCelda: 4,
  sol: "pleno-sol",
  riego: "medio",
  dificultad: "facil",
  calendario: calendario({}, { siembra: { desde: 5, hasta: 5 }, cosecha: { desde: 7, hasta: 9 }, ciclo: { mesesHastaCosecha: 2, mesesDeCosecha: 3 } }),
  compatibles: [{ cultivoId: "tomate", motivo: "Pareja tradicional." }],
  incompatibles: [],
  fuentes: ["prueba"],
};

export const hinojo: Cultivo = {
  id: "hinojo",
  nombre: "Hinojo",
  familia: "Apiáceas",
  plantasPorCelda: 1,
  sol: "pleno-sol",
  riego: "medio",
  dificultad: "media",
  calendario: calendario({}, { siembra: { desde: 5, hasta: 6 }, cosecha: { desde: 8, hasta: 10 }, ciclo: { mesesHastaCosecha: 3, mesesDeCosecha: 2 } }),
  compatibles: [],
  incompatibles: [{ cultivoId: "tomate", motivo: MOTIVO_HINOJO_TOMATE }],
  fuentes: ["prueba"],
};

/** Neutro con los demás; pide semisombra y su siembra cruza el año (oct → feb). */
export const lechuga: Cultivo = {
  id: "lechuga",
  nombre: "Lechuga",
  familia: "Asteráceas",
  plantasPorCelda: 4,
  sol: "semisombra",
  riego: "medio",
  dificultad: "facil",
  calendario: calendario({}, { siembra: { desde: 10, hasta: 2 }, cosecha: { desde: 12, hasta: 4 }, ciclo: { mesesHastaCosecha: 2, mesesDeCosecha: 1 } }),
  compatibles: [],
  incompatibles: [],
  fuentes: ["prueba"],
};

/**
 * Su ciclo cruza el año: sembrado en octubre, se cosecha en marzo y abril. En
 * interior pasa el invierno más despacio: se cosecha en mayo (ciclo 7 + 1).
 */
export const ajo: Cultivo = {
  id: "ajo",
  nombre: "Ajo",
  familia: "Amarilidáceas",
  plantasPorCelda: 9,
  sol: "pleno-sol",
  riego: "bajo",
  dificultad: "facil",
  calendario: calendario(
    { interior: { siembra: { desde: 10, hasta: 12 }, cosecha: { desde: 5, hasta: 6 }, ciclo: { mesesHastaCosecha: 7, mesesDeCosecha: 1 } } },
    { siembra: { desde: 10, hasta: 12 }, cosecha: { desde: 3, hasta: 6 }, ciclo: { mesesHastaCosecha: 5, mesesDeCosecha: 2 } },
  ),
  compatibles: [],
  incompatibles: [],
  fuentes: ["prueba"],
};

export const cultivosDePrueba: Cultivo[] = [tomate, albahaca, hinojo, lechuga, ajo];
