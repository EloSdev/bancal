---
name: tdd-core
description: >-
  Ciclo rojo → verde → refactor para la lógica de dominio de Bancal en
  src/core/ (cuadrícula, vecindad, exposición, compatibilidad, avisos,
  estado de la planta, tareas del mes, esquemas Zod y la capa api), con las
  convenciones de tests del proyecto: test junto al módulo, nombre con el id
  del criterio, fixtures del escenario de la demo. Usar SIEMPRE antes de
  crear o cambiar cualquier función de src/core/ (el hook test-primero
  bloquea crear un módulo sin su test), al trabajar las tareas T3–T8 de
  docs/tareas.md, y cuando el usuario diga "TDD", "test primero" o "escribe
  los tests".
---

# TDD en `src/core/`

La guía (§4) lo dice claro: **el corazón de Bancal son funciones puras en
`core/` y se desarrollan con TDD**. Si `avisosBancal()` se equivoca, la demo
se equivoca, por muy bonita que sea la pantalla. Por eso el test va primero,
y el hook `test-primero` no deja crear un módulo nuevo de `core/` sin su
`.test.ts` al lado.

## 1. Antes de escribir nada

- Lee los criterios de la tarea en `docs/tareas.md`. Cada criterio `test`
  (`C5.2 vecinos() devuelve 3 en una esquina, 5 en un borde y 8 en el
  centro…`) se convierte en uno o varios casos.
- Haz la **lista de casos** antes de la primera línea: el normal, los
  límites (esquina, borde, 1 × 1, exactamente 6 h de sol, ventana que cruza
  el año) y los inválidos. Escríbela como `it.todo` si ayuda a no perderla;
  no puede quedar ningún `todo` al cerrar la tarea.
- Si un caso depende de una **regla de dominio no decidida** (las marcadas
  *(propuesta)* en la guía §3, o el estado de la planta tras la cosecha),
  **para y pregunta** al usuario. No inventes la regla en un test: un test
  fija una decisión. Cuando se decida, anótala en la sección «Reglas del
  dominio» de `CLAUDE.md` (la guía es privada y no se versiona).

## 2. El ciclo, caso a caso

1. **Rojo**: escribe **un** test. Crea el módulo con la firma y un cuerpo que
   no cumple (`throw new Error("sin implementar")` o un valor vacío), para
   que el fallo sea **de aserción**, no de import. Ejecútalo solo:
   ```powershell
   npx vitest run src/core/bancal/vecinos.test.ts -t "C5.2"
   ```
   Comprueba que falla **por el motivo correcto** (el valor esperado frente
   al obtenido). Un test que pasa sin código nuevo no prueba nada.
2. **Verde**: el mínimo código que lo pone en verde. Nada de adelantar casos
   que aún no tienen test.
3. **Refactor**: con todo en verde, limpia nombres y duplicados. Los tests no
   se tocan en este paso.
4. Siguiente caso. Al terminar, `npm test` entero.

**Nunca se debilita un test para ponerlo en verde.** Si un test estaba mal
(esperaba algo que contradice la guía), dilo, explica por qué y cámbialo
como un cambio aparte; el verificador revisa el `git diff` de los tests.

## 3. Convenciones de los tests

- **Dónde**: al lado del módulo. `src/core/bancal/vecinos.ts` →
  `src/core/bancal/vecinos.test.ts`.
- **Nombres en español y con el id del criterio**, para que `verify-task`
  los encuentre con `-t`:
  ```ts
  describe("vecinos", () => {
    it("C5.2 · una esquina tiene 3 vecinos", () => { … });
    it("C5.2 · el centro tiene 8 vecinos y ninguno fuera de la cuadrícula", () => { … });
  });
  ```
  Casos extra que no salen de un criterio: sin id, pero con el
  comportamiento en el nombre (`"una cuadrícula 1 × 1 no tiene vecinos"`).
- **Tablas** para muchos casos del mismo tipo:
  ```ts
  it.each([
    [6, "pleno-sol"], [3, "semisombra"], [2.9, "sombra"],
  ] as const)("C5.3 · %s h de sol → %s", (horas, esperada) => {
    expect(exposicion(horas)).toBe(esperada);
  });
  ```
- **Aserciones exactas**: `toBe` / `toEqual` con el valor esperado. Nada de
  `toBeTruthy()` o `length > 0` cuando se sabe el valor. Para los avisos,
  comprueba el **tipo**, los **cultivos implicados** y que el texto explica
  el motivo (`toMatch(/hinojo/)`), no la frase entera, que cambiará al pulir
  los textos.

## 4. Fixtures del dominio

- Viven en `src/core/__fixtures__/` y son **pequeñas y explícitas**: unos
  pocos cultivos de prueba (tomate, albahaca, hinojo y uno neutro) con solo
  los campos que importan, y el **bancal de la demo** (120 × 90 cm, pleno
  sol, zona atlántica).
- Los tests de lógica **no leen `public/crops.json`**: si mañana cambia un
  dato del catálogo, un test de vecindad no debería romperse. La excepción
  son los tests de coherencia del catálogo (T4), que existen precisamente
  para leerlo.
- El **escenario de la demo** (C6.5) es un test de primera: tomates,
  albahaca e hinojo junto al tomate → aviso del hinojo; se mueve → 0 avisos
  de vecindad. Si alguna vez falla, la demo está rota.

## 5. Funciones puras de verdad

- Nada de `Date.now()`, `new Date()`, `Math.random()`, `localStorage` ni
  `fetch` dentro de la lógica: el mes, la fecha o los datos entran como
  parámetros. Así el test es determinista.
- No mutes la entrada: devuelve estructuras nuevas.
- Tipos del dominio como *discriminated unions* (`EstadoPlanta`, `Aviso`).
  Cuando un `switch` los recorre, cierra con un caso `default` que asigne a
  `never`: si mañana se añade un tipo de aviso, no compila hasta tratarlo.
- La **capa `api`** (T8) no es pura, pero también va con test primero:
  `localStorage` existe en jsdom (límpialo en `beforeEach`), la latencia
  con `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()`, y `fetch` con
  `vi.stubGlobal("fetch", …)` devolviendo un `Response` real. Los hooks se
  prueban con `renderHook` (ver la skill `react-testing`).

## 6. Cerrar

- `npm test` en verde, sin `only`, `skip` ni `todo`.
- Cada criterio `test` de la tarea tiene al menos un `it` con su id.
- Después, `verify-task` con el agente `verificador`.
