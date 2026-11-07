import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Sin `globals` de Vitest, Testing Library no limpia sola entre tests.
afterEach(() => cleanup());

// jsdom no implementa scrollTo y el router lo llama al navegar (restaurar el scroll).
window.scrollTo = () => {};
