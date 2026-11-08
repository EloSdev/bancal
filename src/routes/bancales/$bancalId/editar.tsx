import { createFileRoute } from "@tanstack/react-router";
import { BancalEditarScene } from "../../../scenes/bancal-editar.scene";

export const Route = createFileRoute("/bancales/$bancalId/editar")({
  component: RutaEditarBancal,
});

function RutaEditarBancal() {
  const { bancalId } = Route.useParams();
  return <BancalEditarScene bancalId={bancalId} />;
}
