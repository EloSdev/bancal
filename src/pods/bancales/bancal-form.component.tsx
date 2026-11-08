// Formulario de alta y edición de un bancal (TanStack Form + el esquema Zod de
// core). No llama a la api ni navega: entrega los valores limpios a
// `onGuardar` (el contenedor guarda; la escena navega). A la derecha, la vista
// previa en vivo (vista-previa.component.tsx).
import { useForm } from "@tanstack/react-form";
import { useId, type ReactNode } from "react";
import { Alerta } from "../../common/components/alerta";
import { Boton } from "../../common/components/boton";
import { bancalSchema, LADO_MAXIMO_CM, LADO_MINIMO_CM } from "../../core/bancales/bancal.schema";
import { plantacionesFuera } from "../../core/bancales/cuadricula";
import type { BancalInput, Plantacion } from "../../core/bancales/model";
import type { ErrorApi } from "../../core/comun/api";
import { zonas } from "../../core/cultivos/cultivo.schema";
import { etiquetaZona } from "../../core/cultivos/etiquetas";
import { medidasValidas, textoQuitar, VistaPrevia } from "./vista-previa.component";

/** Un bancal nuevo empieza con el de la demo (120 × 90); las horas de sol, por decidir. */
const NUEVO: BancalInput = { nombre: "", ancho: 120, largo: 90, horasSol: Number.NaN, zona: "atlantica" };

const CAMPOS = ["nombre", "ancho", "largo", "horasSol", "zona"] as const;
type NombreCampo = (typeof CAMPOS)[number];

interface BancalFormProps {
  valoresIniciales?: BancalInput;
  /** Al editar: las plantaciones, para avisar de las que quedarían fuera al encoger. */
  plantaciones?: Plantacion[];
  textoGuardar: string;
  errorGuardado: ErrorApi | null;
  onGuardar: (input: BancalInput) => Promise<void>;
  /** El enlace para salir sin guardar (a la lista o al editor). */
  cancelar: ReactNode;
}

interface MetaCampo {
  isTouched: boolean;
  errors: ({ message: string } | undefined)[];
}

/** El error se enseña cuando el campo se ha tocado (enviar marca todos como tocados). */
const errorVisible = (meta: MetaCampo): string | undefined => (meta.isTouched ? meta.errors[0]?.message : undefined);

export function BancalForm({
  valoresIniciales = NUEVO,
  plantaciones = [],
  textoGuardar,
  errorGuardado,
  onGuardar,
  cancelar,
}: BancalFormProps) {
  const base = useId();
  const id = (campo: NombreCampo) => `${base}-${campo}`;
  const idQuitar = `${base}-quitar`;

  const form = useForm({
    defaultValues: valoresIniciales,
    validators: { onChange: bancalSchema, onSubmit: bancalSchema },
    onSubmit: async ({ value }) => {
      // parse devuelve los valores limpios: el nombre recortado y sin claves de más.
      await onGuardar(bancalSchema.parse(value));
    },
    // Con errores, el foco va al primer campo que lo tiene (frontend-a11y §1). En
    // el siguiente fotograma, para que el lector ya encuentre su error enlazado.
    onSubmitInvalid: ({ formApi }) => {
      const primero = CAMPOS.find((campo) => (formApi.getFieldMeta(campo)?.errors.length ?? 0) > 0);
      if (primero) requestAnimationFrame(() => document.getElementById(id(primero))?.focus());
    },
  });

  return (
    <form
      noValidate
      className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,26rem)_1fr]"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (!form.state.isSubmitting) void form.handleSubmit();
      }}
    >
      <div className="space-y-5">
        <form.Field name="nombre">
          {(field) => (
            <Campo id={id("nombre")} etiqueta="Nombre" error={errorVisible(field.state.meta)}>
              {(aria) => (
                <input
                  {...aria}
                  type="text"
                  required
                  autoComplete="off"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </Campo>
          )}
        </form.Field>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            {(["ancho", "largo"] as const).map((lado) => (
              <form.Field key={lado} name={lado}>
                {(field) => (
                  <CampoNumero
                    id={id(lado)}
                    etiqueta={lado === "ancho" ? "Ancho (cm)" : "Largo (cm)"}
                    pista={`De ${LADO_MINIMO_CM} a ${LADO_MAXIMO_CM} cm.`}
                    error={errorVisible(field.state.meta)}
                    valor={field.state.value}
                    min={LADO_MINIMO_CM}
                    max={LADO_MAXIMO_CM}
                    paso={1}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                  />
                )}
              </form.Field>
            ))}
          </div>
          <p className="text-sm text-tinta-suave">Cada celda mide 30 × 30 cm; lo que sobra no se usa.</p>
        </div>

        <form.Field name="horasSol">
          {(field) => (
            <CampoNumero
              id={id("horasSol")}
              etiqueta="Horas de sol al día"
              pista="De 0 a 24, con decimales si hace falta (2,5)."
              error={errorVisible(field.state.meta)}
              valor={field.state.value}
              min={0}
              max={24}
              paso={0.5}
              decimal
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="zona">
          {(field) => (
            <Campo
              id={id("zona")}
              etiqueta="Zona climática"
              pista="Decide cuándo se siembra y se cosecha cada cultivo."
              error={errorVisible(field.state.meta)}
            >
              {(aria) => (
                <select
                  {...aria}
                  required
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(bancalSchema.shape.zona.parse(e.target.value))}
                >
                  {zonas.map((zona) => (
                    <option key={zona} value={zona}>
                      {etiquetaZona[zona]}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
          )}
        </form.Field>

        {errorGuardado && (
          <Alerta>
            <p>No se ha podido guardar. {errorGuardado.message}</p>
          </Alerta>
        )}

        <form.Subscribe selector={(state) => ({ guardando: state.isSubmitting, valores: state.values })}>
          {({ guardando, valores }) => {
            const fuera = medidasValidas(valores) ? plantacionesFuera(plantaciones, valores.ancho, valores.largo).length : 0;
            return (
              <>
                {/* Justo encima de guardar (en el móvil la vista previa queda
                    debajo) y enlazado al botón: se lee antes de perder nada. */}
                {fuera > 0 && (
                  <p id={idQuitar} className="border-l-4 border-tinta pl-3 font-medium">
                    {textoQuitar(fuera)}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  {/* aria-disabled y no disabled: el botón con el foco no lo pierde
                      a <body> mientras guarda (y si falla, se sigue aquí). */}
                  <Boton type="submit" aria-disabled={guardando} aria-describedby={fuera > 0 ? idQuitar : undefined}>
                    {guardando ? "Guardando…" : textoGuardar}
                  </Boton>
                  {cancelar}
                </div>
              </>
            );
          }}
        </form.Subscribe>
      </div>

      <form.Subscribe selector={(state) => state.values}>
        {(valores) => <VistaPrevia valores={valores} plantaciones={plantaciones} />}
      </form.Subscribe>
    </form>
  );
}

// Lo que el control recibe para quedar enlazado a su etiqueta, pista y error.
interface AriaControl {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
}

interface CampoProps {
  id: string;
  etiqueta: string;
  pista?: string;
  error?: string;
  children: (aria: AriaControl) => ReactNode;
}

/** Etiqueta, control, pista y error, enlazados (frontend-a11y §1). */
function Campo({ id, etiqueta, pista, error, children }: CampoProps) {
  const idPista = `${id}-pista`;
  const idError = `${id}-error`;
  const describe = [error && idError, pista && idPista].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {etiqueta}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describe })}
      {/* El error, antes que la pista (es lo primero que hay que leer) y con el
          filete de Alerta: un solo sistema para lo que hay que atender. */}
      {error && (
        <p id={idError} className="border-l-2 border-tinta pl-2 text-sm font-medium text-tinta">
          {error}
        </p>
      )}
      {pista && (
        <p id={idPista} className="text-sm text-tinta-suave">
          {pista}
        </p>
      )}
    </div>
  );
}

interface CampoNumeroProps {
  id: string;
  etiqueta: string;
  pista: string;
  error?: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  decimal?: boolean;
  onBlur: () => void;
  onChange: (valor: number) => void;
}

/** Un número: vacío se guarda como NaN (el esquema lo rechaza con su mensaje) y se pinta vacío. */
function CampoNumero({ id, etiqueta, pista, error, valor, min, max, paso, decimal, onBlur, onChange }: CampoNumeroProps) {
  return (
    <Campo id={id} etiqueta={etiqueta} pista={pista} error={error}>
      {(aria) => (
        <input
          {...aria}
          type="number"
          required
          inputMode={decimal ? "decimal" : "numeric"}
          min={min}
          max={max}
          step={paso}
          className="tabular-nums"
          value={Number.isNaN(valor) ? "" : valor}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      )}
    </Campo>
  );
}

