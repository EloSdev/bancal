import { z } from "zod";
import { mesSchema, zonas } from "../cultivos/cultivo.schema";
import type { Bancal, BancalInput, Plantacion } from "./model";

// Un esquema para alta y edición (TanStack Form, T10) y otro para lo guardado
// en localStorage (capa api, T8). Mensajes en español: los ve el usuario.
// Límites de «Reglas del dominio» (CLAUDE.md): 30–300 cm enteros por lado,
// 0–24 h de sol (con decimales), nombre de 1 a 40 caracteres.

export const LADO_MINIMO_CM = 30;
export const LADO_MAXIMO_CM = 300;

const lado = (nombre: "ancho" | "largo") =>
  z
    .number({ error: `Indica el ${nombre} en cm.` })
    .int(`El ${nombre} va en centímetros enteros.`)
    .min(LADO_MINIMO_CM, `El ${nombre} mínimo es ${LADO_MINIMO_CM} cm (una celda).`)
    .max(LADO_MAXIMO_CM, `El ${nombre} máximo es ${LADO_MAXIMO_CM} cm.`);

export const bancalSchema = z.object({
  nombre: z.string().trim().min(1, "Ponle un nombre al bancal.").max(40, "El nombre no puede pasar de 40 caracteres."),
  ancho: lado("ancho"),
  largo: lado("largo"),
  horasSol: z
    .number({ error: "Indica las horas de sol al día." })
    .min(0, "Las horas de sol van de 0 a 24.")
    .max(24, "Las horas de sol van de 0 a 24."),
  zona: z.enum(zonas, { error: "Elige una zona climática." }),
}) satisfies z.ZodType<BancalInput>;

export const bancalGuardadoSchema = bancalSchema.extend({
  id: z.string().min(1),
}) satisfies z.ZodType<Bancal>;

const celdaSchema = z.object({
  fila: z.number().int().min(0),
  columna: z.number().int().min(0),
});

export const plantacionSchema = z.object({
  cultivoId: z.string().min(1),
  celda: celdaSchema,
  mesSiembra: mesSchema,
}) satisfies z.ZodType<Plantacion>;
