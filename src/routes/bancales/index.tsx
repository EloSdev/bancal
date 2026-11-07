import { createFileRoute } from "@tanstack/react-router";
import { BancalesScene } from "../../scenes/bancales.scene";

export const Route = createFileRoute("/bancales/")({
  component: BancalesScene,
});
