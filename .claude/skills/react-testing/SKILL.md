---
name: react-testing
description: >-
  Tests de componentes, contenedores y hooks de Bancal con Vitest + Testing
  Library + jsdom: consultas por rol y etiqueta, userEvent, la capa api
  simulada en vez de mocks de red, latencia con temporizadores falsos,
  formularios de TanStack Form y qué se deja para el navegador real
  (verify-task). Usar al escribir o arreglar tests de .tsx o de hooks, y en
  los criterios `test` de las tareas de pantallas (T9–T15).
---

# Tests de React en Bancal

Basada en `react-testing` de ECC (MIT, ver `LICENSE`), adaptada al stack de
Bancal: **sin MSW ni axe** (serían dependencias nuevas; la guía §4 pide
justificar cada una) y con la capa `api` simulada que ya tiene el proyecto.

## 1. Principio

**Se prueba lo que el usuario ve y hace**, no la implementación:

- Renderiza con lo mismo que en producción (el router si el componente usa
  `<Link>` o `useNavigate`).
- Interactúa con consultas accesibles (rol, etiqueta) y `userEvent`.
- Comprueba lo visible y los efectos observables (se llamó a `onSaved`, se
  guardó en `localStorage`, se anunció en la región `aria-live`).

No se inspecciona el estado interno, ni qué hooks se llamaron, ni cuántas
veces se renderizó.

## 2. Herramientas

Vitest + `@testing-library/react` + `@testing-library/user-event` +
`@testing-library/jest-dom` (matchers como `toBeInTheDocument`) + jsdom.
Las tres de Testing Library son la "Testing Library" de la guía §4.

```powershell
npm test                                               # toda la batería, una vez
npx vitest run src/pods/editor/celda.test.tsx          # un fichero
npx vitest run src/pods/editor/celda.test.tsx -t "C13.3"   # un test
```

Los tests de componentes van junto al componente
(`bancal-form.component.tsx` → `bancal-form.component.test.tsx`), con el id
del criterio en el nombre, como en `tdd-core`.

## 3. Consultas, por este orden

1. `getByRole("button", { name: "Guardar bancal" })`, `getByLabelText("Ancho (cm)")`
2. `getByText`, `getByAltText`
3. `getByTestId` solo como último recurso, y justificado

Si un elemento no se encuentra por su rol y su nombre, **probablemente
tampoco lo encuentra un lector de pantalla**: arregla el componente, no el
test. Variantes: `getBy*` (debe estar), `queryBy*` (comprobar que no está),
`findBy*` (aparece tras algo asíncrono).

```tsx
const user = userEvent.setup();
render(<BancalForm onSubmit={onSubmit} />);
await user.type(screen.getByLabelText("Nombre"), "Balcón");
await user.click(screen.getByRole("button", { name: "Guardar bancal" }));
expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Balcón" }));
```

Siempre `await` en `userEvent`, un `userEvent.setup()` por test. Nunca
`setTimeout` + aserción: usa `findBy*` / `waitFor`.

## 4. Datos: la capa `api`, no la red

Los contenedores leen de `core/<dominio>/api.ts`. En los tests hay dos
caminos; elige el más cercano a producción que sea rápido:

- **La `api` real sobre jsdom**: `localStorage` existe en jsdom. Siémbralo
  en el test (o con una función de la `api`) y deja que el contenedor lo
  lea. `crops.json` se sirve con `vi.stubGlobal("fetch", …)` devolviendo un
  `new Response(JSON.stringify(cultivosDePrueba))`. La latencia se salta con
  `vi.useFakeTimers({ shouldAdvanceTime: true })` o
  `await vi.advanceTimersByTimeAsync(ms)`.
- **La `api` sustituida**: `vi.mock("@/core/bancales/api", …)` cuando el test
  trata de la interfaz (estados de carga, error) y no de la persistencia.
  Para el error: que la función rechace y comprobar el `role="alert"`.

`beforeEach`: `localStorage.clear()` y `vi.restoreAllMocks()`. Nada de
estado compartido entre tests.

## 5. Hooks

```tsx
const { result } = renderHook(() => useBancal(1));
expect(result.current.loading).toBe(true);
await waitFor(() => expect(result.current.loading).toBe(false));
expect(result.current.data?.nombre).toBe("Balcón");
```

Comprueba también la **limpieza**: desmontar a mitad de la carga
(`unmount()`) no produce avisos de `act` ni actualiza el estado.

## 6. Router y formularios

- Un componente que usa `<Link>` o `useNavigate` necesita router. Crea uno
  de memoria en un `src/test-utils.tsx` compartido
  (`createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/bancales/1"] }) })`)
  y renderiza `<RouterProvider router={router} />`. Para componentes
  presentacionales puros, mejor pasar los datos por props y no montar router.
- Formularios: escribe en los campos, envía y comprueba los mensajes en
  español y que `aria-invalid` cambia. Los errores se muestran solo tras
  tocar el campo o enviar.

## 7. Accesibilidad que sí se puede probar aquí

Sin axe, pero con aserciones concretas:

- El campo tiene nombre accesible: `getByLabelText` lo encuentra.
- El error está enlazado: `toHaveAccessibleDescription(/mínimo 30 cm/)`.
- La región de avisos se actualiza: `getByRole("status")` contiene el texto
  nuevo tras colocar el hinojo.
- Teclado en la cuadrícula: `await user.keyboard("{ArrowRight}{Enter}")` y
  comprobar `document.activeElement` y la celda colocada.

## 8. Qué NO se prueba en jsdom

jsdom no tiene motor de *layout* ni de animación: no hay rejilla real, ni
*container queries*, ni contraste, ni `prefers-reduced-motion`, ni Pointer
Events fieles, ni scroll. Todo eso es de `verify-task` en el navegador real
(Playwright). No intentes simularlo con aserciones sobre clases CSS.

## 9. Antipatrones

- `container.querySelector(…)` en vez de consultas accesibles.
- *Snapshots* de componentes: se aprueban sin mirar y prueban estructura,
  no comportamiento.
- Mockear React, o mockear los componentes hijos por defecto.
- Ignorar avisos de `act()`: suelen ser un efecto sin limpiar.
- `it.skip` / `it.only` olvidados (el `check-estatico` los marca como FALLA).
