// Alta y edición de un bancal: guardan con la api y avisan a la escena con
// `onGuardado` (la escena navega). El formulario es el mismo; la edición
// además carga el bancal y sus plantaciones (para avisar al encoger).
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ErrorCarga } from "../../common/components/error-carga";
import { TituloPagina } from "../../common/components/titulo-pagina";
import { saveBancal } from "../../core/bancales/api";
import { useBancal } from "../../core/bancales/hooks";
import type { Bancal, BancalInput } from "../../core/bancales/model";
import { aErrorApi, type ErrorApi } from "../../core/comun/api";
import { BancalForm } from "./bancal-form.component";

interface GuardarProps {
  onGuardado: (bancal: Bancal) => void;
}

/**
 * Guarda (sin id crea, con id sustituye) y recuerda el error para el
 * formulario. Si se sale de la pantalla durante la latencia, se aborta:
 * no se guarda nada y no hay una navegación que nadie ha pedido.
 */
function useGuardarBancal(onGuardado: (bancal: Bancal) => void, id?: string) {
  const [error, setError] = useState<ErrorApi | null>(null);
  const enCurso = useRef<AbortController | null>(null);

  useEffect(() => () => enCurso.current?.abort(), []);

  const guardar = async (input: BancalInput) => {
    const controller = new AbortController();
    enCurso.current = controller;
    setError(null);
    let bancal: Bancal;
    try {
      bancal = await saveBancal(input, id, controller.signal);
    } catch (e) {
      if (!controller.signal.aborted) setError(aErrorApi(e));
      return;
    }
    if (!controller.signal.aborted) onGuardado(bancal);
  };
  return { error, guardar };
}

export function NuevoBancalContainer({ onGuardado }: GuardarProps) {
  const { error, guardar } = useGuardarBancal(onGuardado);
  return (
    <BancalForm
      textoGuardar="Crear bancal"
      errorGuardado={error}
      onGuardar={guardar}
      cancelar={
        <Link to="/bancales" className="inline-flex min-h-6 items-center">
          Cancelar
        </Link>
      }
    />
  );
}

export function EditarBancalContainer({ bancalId, onGuardado }: GuardarProps & { bancalId: string }) {
  const { data: detalle, loading, error: errorCarga, recargar } = useBancal(bancalId);
  const { error, guardar } = useGuardarBancal(onGuardado, bancalId);

  if (loading) {
    return (
      <p role="status" className="text-tinta-suave">
        Cargando el bancal…
      </p>
    );
  }
  if (errorCarga) return <ErrorCarga titulo="No se ha podido cargar el bancal." error={errorCarga} onReintentar={recargar} />;
  if (!detalle) return <BancalNoEncontrado />;

  const { id: _id, ...valores } = detalle.bancal;
  return (
    <section className="space-y-6">
      <TituloPagina>Editar «{detalle.bancal.nombre}»</TituloPagina>
      <BancalForm
        valoresIniciales={valores}
        plantaciones={detalle.plantaciones}
        textoGuardar="Guardar cambios"
        errorGuardado={error}
        onGuardar={guardar}
        cancelar={
          <Link to="/bancales/$bancalId" params={{ bancalId }} className="inline-flex min-h-6 items-center">
            Cancelar
          </Link>
        }
      />
    </section>
  );
}

function BancalNoEncontrado() {
  return (
    <section className="space-y-3">
      <h1>Bancal no encontrado</h1>
      <p>Ese bancal no existe o ya se ha borrado.</p>
      <Link to="/bancales" className="inline-block py-1">
        Volver a mis bancales
      </Link>
    </section>
  );
}
