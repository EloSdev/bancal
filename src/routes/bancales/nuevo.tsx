import { createFileRoute } from "@tanstack/react-router";
import { BancalNuevoScene } from "../../scenes/bancal-nuevo.scene";

export const Route = createFileRoute("/bancales/nuevo")({
  component: BancalNuevoScene,
});
