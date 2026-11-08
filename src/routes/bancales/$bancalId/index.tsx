import { createFileRoute } from "@tanstack/react-router";
import { BancalScene } from "../../../scenes/bancal.scene";

export const Route = createFileRoute("/bancales/$bancalId/")({
  component: RutaBancal,
});

function RutaBancal() {
  const { bancalId } = Route.useParams();
  return <BancalScene bancalId={bancalId} />;
}
