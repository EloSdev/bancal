import { z } from "zod";
import type { Cultivo } from "./model";

// Valida public/crops.json (capa api, T8). `satisfies` comprueba en
// compilación que lo que devuelve el esquema es un Cultivo del modelo.

export const zonas = ["atlantica", "mediterranea", "interior"] as const;
export const exposiciones = ["pleno-sol", "semisombra", "sombra"] as const;

export const mesSchema = z
  .number({ error: "El mes tiene que ser un número." })
  .int("El mes tiene que ser un número entero.")
  .min(1, "El mes va de 1 (enero) a 12 (diciembre).")
  .max(12, "El mes va de 1 (enero) a 12 (diciembre).");

const ventanaSchema = z.object({ desde: mesSchema, hasta: mesSchema });

const calendarioZonaSchema = z.object({ siembra: ventanaSchema, cosecha: ventanaSchema });

const meses = z.number().int("El ciclo va en meses enteros.").min(1, "El ciclo dura al menos un mes.");

const cicloSchema = z
  .object({ mesesHastaCosecha: meses, mesesDeCosecha: meses })
  .refine((c) => c.mesesHastaCosecha + c.mesesDeCosecha <= 12, "El ciclo no puede pasar de 12 meses.");

const relacionSchema = z.object({
  cultivoId: z.string().min(1),
  motivo: z.string().trim().min(1, "Cada relación explica su motivo."),
});

export const cultivoSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "El id va en minúsculas, sin espacios ni tildes."),
  nombre: z.string().trim().min(1),
  familia: z.string().trim().min(1),
  plantasPorCelda: z.number().int().min(1),
  sol: z.enum(exposiciones),
  riego: z.enum(["bajo", "medio", "alto"]),
  dificultad: z.enum(["facil", "media", "dificil"]),
  calendario: z.object({
    atlantica: calendarioZonaSchema,
    mediterranea: calendarioZonaSchema,
    interior: calendarioZonaSchema,
  }),
  ciclo: cicloSchema,
  compatibles: z.array(relacionSchema),
  incompatibles: z.array(relacionSchema),
  fuentes: z.array(z.string().trim().min(1)).min(1, "Cada cultivo cita al menos una fuente."),
}) satisfies z.ZodType<Cultivo>;
