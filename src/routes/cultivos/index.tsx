import { createFileRoute } from "@tanstack/react-router";
import { busquedaCatalogoSchema } from "../../core/cultivos/busqueda.schema";
import { CultivosScene } from "../../scenes/cultivos.scene";

export const Route = createFileRoute("/cultivos/")({
  validateSearch: busquedaCatalogoSchema,
  component: RutaCultivos,
});

function RutaCultivos() {
  return <CultivosScene filtros={Route.useSearch()} />;
}
