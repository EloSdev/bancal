import { createFileRoute } from "@tanstack/react-router";
import { PortadaScene } from "../scenes/portada.scene";

export const Route = createFileRoute("/")({
  component: PortadaScene,
});
