// Filtros del catálogo («Reglas del dominio» de CLAUDE.md, decisión T9).
import type { Cultivo, Exposicion, Mes, ZonaClimatica } from "./model";
import { enVentana } from "./ventana";

export interface FiltrosCatalogo {
  q?: string;
  sol?: Exposicion;
  /** Mes de siembra (1–12) en la ventana de la zona. */
  temporada?: Mes;
  /** Qué calendario se mira; atlántica si no se dice. */
  zona?: ZonaClimatica;
}

export const ZONA_POR_DEFECTO: ZonaClimatica = "atlantica";

/** Minúsculas y sin tildes, para buscar «rabano» y encontrar «Rábano». */
const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function filtrarCultivos(cultivos: Cultivo[], { q, sol, temporada, zona }: FiltrosCatalogo): Cultivo[] {
  const busqueda = normalizar(q ?? "");
  const calendario = zona ?? ZONA_POR_DEFECTO;
  return cultivos.filter(
    (cultivo) =>
      normalizar(cultivo.nombre).includes(busqueda) &&
      (sol === undefined || cultivo.sol === sol) &&
      (temporada === undefined || enVentana(temporada, cultivo.calendario[calendario].siembra)),
  );
}

const alfabetico = new Intl.Collator("es", { sensitivity: "base" });

/** Orden alfabético en español (el índice del cuaderno); devuelve una lista nueva. */
export function ordenarPorNombre(cultivos: Cultivo[]): Cultivo[] {
  return [...cultivos].sort((a, b) => alfabetico.compare(a.nombre, b.nombre));
}

/** ¿Hay algún filtro que pueda dejar fuera cultivos? (la zona sola no filtra) */
export function hayFiltros({ q, sol, temporada }: FiltrosCatalogo): boolean {
  return normalizar(q ?? "") !== "" || sol !== undefined || temporada !== undefined;
}
