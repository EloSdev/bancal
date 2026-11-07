// Capa api de los bancales: localStorage, validado con Zod y con latencia simulada.
// Todo vive bajo una clave: { bancales, plantaciones por id de bancal }. Si lo
// guardado está corrupto, se aparta a otra clave (para no perderlo), se sigue
// sin datos y hayDatosDescartados() permite avisar al usuario.
import { z } from "zod";
import { ErrorApi, esperar, LATENCIA_MS } from "../comun/api";
import { bancalGuardadoSchema, bancalSchema, plantacionSchema } from "./bancal.schema";
import { dentroDeCuadricula, dimensiones } from "./cuadricula";
import type { Bancal, BancalInput, Plantacion } from "./model";

export const CLAVE_ALMACEN = "bancal:datos";
export const CLAVE_DESCARTADOS = "bancal:datos-descartados";

export interface BancalDetalle {
  bancal: Bancal;
  plantaciones: Plantacion[];
}

const almacenSchema = z.object({
  bancales: z.array(bancalGuardadoSchema),
  plantaciones: z.record(z.string(), z.array(plantacionSchema)),
});

type Almacen = z.infer<typeof almacenSchema>;

const VACIO: Almacen = { bancales: [], plantaciones: {} };

function errorAlmacenamiento(error: unknown): ErrorApi {
  return new ErrorApi("almacenamiento", "El navegador no deja guardar ni leer los bancales.", { cause: error });
}

function descartar(guardado: string, motivo: unknown): void {
  console.warn("Bancal: los datos guardados no se pueden leer; se apartan y se empieza de cero.", motivo);
  try {
    localStorage.setItem(CLAVE_DESCARTADOS, guardado);
  } catch (error) {
    // Sin sitio para la copia: se pierde, pero la app no puede quedarse atascada en datos ilegibles.
    console.warn("Bancal: no se ha podido guardar la copia de los datos descartados.", error);
  }
  try {
    localStorage.removeItem(CLAVE_ALMACEN);
  } catch (error) {
    throw errorAlmacenamiento(error);
  }
}

function leer(): Almacen {
  let guardado: string | null;
  try {
    guardado = localStorage.getItem(CLAVE_ALMACEN);
  } catch (error) {
    throw errorAlmacenamiento(error);
  }
  if (guardado === null) return VACIO;

  let json: unknown;
  try {
    json = JSON.parse(guardado);
  } catch (error) {
    descartar(guardado, error);
    return VACIO;
  }
  const resultado = almacenSchema.safeParse(json);
  if (!resultado.success) {
    descartar(guardado, resultado.error);
    return VACIO;
  }
  return resultado.data;
}

function escribir(almacen: Almacen): void {
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(almacen));
  } catch (error) {
    throw errorAlmacenamiento(error);
  }
}

function validar<T>(schema: z.ZodType<T>, valor: unknown): T {
  const resultado = schema.safeParse(valor);
  if (!resultado.success) {
    const motivo = resultado.error.issues[0]?.message ?? "Datos no válidos.";
    throw new ErrorApi("datos", motivo, { cause: resultado.error });
  }
  return resultado.data;
}

const noEncontrado = () => new ErrorApi("no-encontrado", "Ese bancal ya no existe.");

const plantacionesDe = (almacen: Almacen, id: string): Plantacion[] =>
  Object.hasOwn(almacen.plantaciones, id) ? almacen.plantaciones[id]! : [];

/** Una plantación por celda y todas dentro de la cuadrícula del bancal («Reglas del dominio»). */
function comprobarCeldas(bancal: Bancal, plantaciones: Plantacion[]): void {
  const dims = dimensiones(bancal.ancho, bancal.largo);
  const ocupadas = new Set<string>();
  for (const { celda } of plantaciones) {
    if (!dentroDeCuadricula(celda, dims)) {
      throw new ErrorApi("datos", `La celda (${celda.fila + 1}, ${celda.columna + 1}) queda fuera del bancal.`);
    }
    const clave = `${celda.fila}:${celda.columna}`;
    if (ocupadas.has(clave)) {
      throw new ErrorApi("datos", `La celda (${celda.fila + 1}, ${celda.columna + 1}) tiene dos cultivos; solo cabe uno.`);
    }
    ocupadas.add(clave);
  }
}

export async function getBancales(signal?: AbortSignal): Promise<Bancal[]> {
  await esperar(LATENCIA_MS, signal);
  return leer().bancales;
}

/** El bancal con sus plantaciones, o undefined si no existe. */
export async function getBancal(id: string, signal?: AbortSignal): Promise<BancalDetalle | undefined> {
  await esperar(LATENCIA_MS, signal);
  const almacen = leer();
  const bancal = almacen.bancales.find((b) => b.id === id);
  return bancal && { bancal, plantaciones: plantacionesDe(almacen, id) };
}

/**
 * Sin id crea un bancal nuevo; con id sustituye al bancal que tiene ese id.
 * Si el bancal encoge, se quitan las plantaciones que quedan fuera.
 */
export async function saveBancal(input: BancalInput, id?: string, signal?: AbortSignal): Promise<Bancal> {
  await esperar(LATENCIA_MS, signal);
  const datos = validar(bancalSchema, input);
  const almacen = leer();
  if (id === undefined) {
    const bancal: Bancal = { ...datos, id: crypto.randomUUID() };
    escribir({ ...almacen, bancales: [...almacen.bancales, bancal] });
    return bancal;
  }

  if (!almacen.bancales.some((b) => b.id === id)) throw noEncontrado();
  const bancal: Bancal = { ...datos, id };
  const dims = dimensiones(bancal.ancho, bancal.largo);
  const queCaben = plantacionesDe(almacen, id).filter((p) => dentroDeCuadricula(p.celda, dims));
  escribir({
    bancales: almacen.bancales.map((b) => (b.id === id ? bancal : b)),
    plantaciones: { ...almacen.plantaciones, [id]: queCaben },
  });
  return bancal;
}

/** Borra el bancal y sus plantaciones. Borrar uno que no existe no hace nada. */
export async function deleteBancal(id: string, signal?: AbortSignal): Promise<void> {
  await esperar(LATENCIA_MS, signal);
  const almacen = leer();
  const { [id]: _borradas, ...plantaciones } = almacen.plantaciones;
  escribir({ bancales: almacen.bancales.filter((b) => b.id !== id), plantaciones });
}

/** Sustituye todas las plantaciones de un bancal. */
export async function savePlantaciones(
  bancalId: string,
  plantaciones: Plantacion[],
  signal?: AbortSignal,
): Promise<void> {
  await esperar(LATENCIA_MS, signal);
  const validas = validar(z.array(plantacionSchema), plantaciones);
  const almacen = leer();
  const bancal = almacen.bancales.find((b) => b.id === bancalId);
  if (!bancal) throw noEncontrado();
  comprobarCeldas(bancal, validas);
  escribir({ ...almacen, plantaciones: { ...almacen.plantaciones, [bancalId]: validas } });
}

/** ¿Se apartaron datos guardados que no se podían leer? (para avisar al usuario) */
export function hayDatosDescartados(): boolean {
  try {
    return localStorage.getItem(CLAVE_DESCARTADOS) !== null;
  } catch {
    return false;
  }
}

/** El usuario ya está avisado: se borra la copia apartada. */
export function olvidarDatosDescartados(): void {
  try {
    localStorage.removeItem(CLAVE_DESCARTADOS);
  } catch {
    // Si el navegador no deja tocar localStorage, no hay copia que olvidar.
  }
}
