import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { configurarModoDemo } from "../core/comun/api";
import { vaciarCache } from "../core/comun/cache";

// Los tests prueban la app con el servidor lento del modo demo (T22): así los
// estados de carga se pueden ver y comprobar (con temporizadores falsos).
beforeEach(() => configurarModoDemo({ lento: true, fallo: false }));

// Sin `globals` de Vitest, Testing Library no limpia sola entre tests.
// La caché de datos (T21) tampoco: cada test empieza sin nada leído.
afterEach(() => {
  cleanup();
  vaciarCache();
});

// jsdom no implementa scrollTo y el router lo llama al navegar (restaurar el scroll).
window.scrollTo = () => {};
// Ni scrollIntoView (el editor lo usa para que la banda fija no tape la celda con el foco).
Element.prototype.scrollIntoView = () => {};

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
