import { createRootRoute } from "@tanstack/react-router";
import { AppLayout } from "../layouts/app-layout";
import { NotFound } from "../common/components/not-found";

export const Route = createRootRoute({
  component: AppLayout,
  notFoundComponent: NotFound,
});
