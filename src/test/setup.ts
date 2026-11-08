import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Sin `globals` de Vitest, Testing Library no limpia sola entre tests.
afterEach(() => cleanup());

// jsdom no implementa scrollTo y el router lo llama al navegar (restaurar el scroll).
window.scrollTo = () => {};

// jsdom (31) tiene <dialog> con `open`, pero no showModal() ni close(). Lo justo
// para los tests: abrir, cerrar y avisar con «close». El foco atrapado, Esc y
// el fondo inerte del modal de verdad se comprueban en el navegador.
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.open = true;
};
// Ojo: aquí «close» llega en el acto; el navegador lo encola como tarea. El
// contenedor no depende del orden (onClose comprueba si aún hay qué borrar).
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  if (!this.open) return;
  this.open = false;
  this.dispatchEvent(new Event("close"));
};
