import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { mesSchema } from "../../../core/cultivos/cultivo.schema";
import { BancalScene } from "../../../scenes/bancal.scene";

// ?mes=5 (T15). Tolerante a basura: un mes inválido se descarta y la escena
// usa el mes actual (guía §2).
const busquedaEditor = z.object({ mes: mesSchema.optional().catch(undefined) });

export const Route = createFileRoute("/bancales/$bancalId/")({
  validateSearch: busquedaEditor,
  component: RutaBancal,
});

function RutaBancal() {
  const { bancalId } = Route.useParams();
  const { mes } = Route.useSearch();
  return <BancalScene bancalId={bancalId} mes={mes} />;
}
