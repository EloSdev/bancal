// Capa api del catálogo: public/crops.json, validado con Zod.
// Los fallos llegan como ErrorApi; una cancelación se propaga tal cual (AbortError).
import { z } from "zod";
import { ErrorApi, esCancelacion, responder } from "../comun/api";
import { cultivoSchema } from "./cultivo.schema";
import type { Cultivo } from "./model";

const URL_CULTIVOS = `${import.meta.env.BASE_URL}crops.json`;

const catalogoSchema = z.array(cultivoSchema);

async function descargar(signal?: AbortSignal): Promise<Response> {
  try {
    return await fetch(URL_CULTIVOS, { signal });
  } catch (error) {
    if (esCancelacion(error)) throw error;
    throw new ErrorApi("red", "No se ha podido descargar el catálogo de cultivos. Revisa la conexión.", {
      cause: error,
    });
  }
}

async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    return await respuesta.json();
  } catch (error) {
    if (esCancelacion(error)) throw error;
    throw new ErrorApi("datos", "El catálogo de cultivos no se puede leer.", { cause: error });
  }
}

export async function getCultivos(signal?: AbortSignal): Promise<Cultivo[]> {
  await responder(signal);
  const respuesta = await descargar(signal);
  if (!respuesta.ok) {
    // El código HTTP no le dice nada a quien usa la app: va en `cause`, no en el mensaje.
    throw new ErrorApi("red", "Puede ser un fallo pasajero del catálogo de cultivos: vuelve a intentarlo en un momento.", {
      cause: { status: respuesta.status },
    });
  }
  const resultado = catalogoSchema.safeParse(await leerJson(respuesta));
  if (!resultado.success) {
    throw new ErrorApi("datos", "El catálogo de cultivos tiene datos que no son válidos.", {
      cause: resultado.error,
    });
  }
  return resultado.data;
}

/** El cultivo con ese id, o undefined si no está en el catálogo. */
export async function getCultivo(id: string, signal?: AbortSignal): Promise<Cultivo | undefined> {
  const cultivos = await getCultivos(signal);
  return cultivos.find((cultivo) => cultivo.id === id);
}
