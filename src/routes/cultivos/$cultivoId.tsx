import { createFileRoute } from "@tanstack/react-router";
import { CultivoScene } from "../../scenes/cultivo.scene";

export const Route = createFileRoute("/cultivos/$cultivoId")({
  component: RutaCultivo,
});

function RutaCultivo() {
  const { cultivoId } = Route.useParams();
  return <CultivoScene cultivoId={cultivoId} />;
}
