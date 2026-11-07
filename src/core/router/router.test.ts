import { describe, expect, it } from "vitest";
import { router } from "./router";

describe("router", () => {
  it("C1.2 · registra las rutas base de la app", () => {
    const rutas = Object.keys(router.routesByPath);
    expect(rutas).toEqual(expect.arrayContaining(["/", "/cultivos", "/bancales"]));
  });
});
