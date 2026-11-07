import { createFileRoute } from "@tanstack/react-router";
import { CultivosScene } from "../../scenes/cultivos.scene";

export const Route = createFileRoute("/cultivos/")({
  component: CultivosScene,
});
