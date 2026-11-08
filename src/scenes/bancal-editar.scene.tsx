import { useNavigate } from "@tanstack/react-router";
import type { Bancal } from "../core/bancales/model";
import { EditarBancalContainer } from "../pods/bancales";

export function BancalEditarScene({ bancalId }: { bancalId: string }) {
  const navigate = useNavigate();
  const alGuardar = (bancal: Bancal) => navigate({ to: "/bancales/$bancalId", params: { bancalId: bancal.id } });

  // El <h1> lo pone el contenedor: lleva el nombre del bancal, que se carga.
  return <EditarBancalContainer bancalId={bancalId} onGuardado={alGuardar} />;
}
