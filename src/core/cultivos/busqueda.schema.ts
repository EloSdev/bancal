// Search params del catálogo (/cultivos?q=&sol=&temporada=&zona=), decisión T9.
// Tolerante a basura: un valor inválido se descarta (`catch`) y la página sigue.
import { z } from "zod";
import { exposiciones, mesSchema, zonas } from "./cultivo.schema";
import type { FiltrosCatalogo } from "./filtros";

export const busquedaCatalogoSchema = z.object({
  q: z.string().optional().catch(undefined),
  sol: z.enum(exposiciones).optional().catch(undefined),
  temporada: mesSchema.optional().catch(undefined),
  zona: z.enum(zonas).optional().catch(undefined),
}) satisfies z.ZodType<FiltrosCatalogo>;
