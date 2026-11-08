import { useNavigate } from "@tanstack/react-router";
import type { Mes } from "../core/cultivos/model";
import { EditorContainer } from "../pods/editor";

// El <h1> lo pone el editor: lleva el nombre del bancal, que se carga.
// El mes vive en la URL (?mes=): sin él, o si no vale, el mes actual. Mover
// el deslizador sustituye la entrada del historial (no una por mes).
export function BancalScene({ bancalId, mes }: { bancalId: string; mes?: Mes }) {
  const navigate = useNavigate({ from: "/bancales/$bancalId/" });
  const cambiarMes = (nuevo: Mes) => navigate({ search: { mes: nuevo }, replace: true });
  return <EditorContainer bancalId={bancalId} mes={mes ?? new Date().getMonth() + 1} onCambiarMes={cambiarMes} />;
}
