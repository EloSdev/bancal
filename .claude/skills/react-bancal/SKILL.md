---
name: react-bancal
description: >-
  Cómo se escribe React en Bancal: arquitectura routes / scenes / pods / core
  / common, contenedores frente a componentes, hooks de datos con
  AbortController, estado derivado, TanStack Router (rutas de fichero,
  search params validados con Zod), TanStack Form + Zod y la unidad de
  extracción de Tailwind (el componente). Usar SIEMPRE al crear o cambiar
  ficheros .tsx o hooks en src/ (rutas, escenas, pods, layouts, common), al
  trabajar las tareas T1 y T9–T15 de docs/tareas.md, y al decidir dónde vive
  un estado o un dato.
---

# React en Bancal

Bancal sigue la arquitectura y las convenciones de `../lab-react` (mismo
curso, mismo stack). Esta skill las recoge y añade lo propio de Bancal.
**Prima el código claro e idiomático sobre el ingenioso**: cada componente y
cada hook se tiene que poder explicar (por qué esto es estado y aquello se
deriva, qué limpia un efecto).

Basada en parte en `react-patterns` de ECC (MIT, ver `LICENSE`), adaptada:
sin Server Components, sin TanStack Query ni Next.js.

## 1. Capas y nombres

```
src/
  main.tsx                     monta <RouterProvider router={router} />
  routes/                      SOLO navegación: leer params y search, renderizar una escena
  scenes/<x>.scene.tsx         componen una pantalla y deciden la navegación (onSaved → navigate)
  pods/<pod>/                  catalogo/, bancales/, editor/
    <x>.container.tsx          datos y estado: hooks, carga / error / no encontrado / contenido
    <x>.component.tsx          props → render, sin hooks de datos ni navegación
    index.ts                   lo único que se importa desde fuera
  core/<dominio>/              model.ts, <x>.schema.ts, api.ts, hooks.ts, lógica pura (+ .test.ts)
  core/router/router.ts        createRouter + declare module … Register
  layouts/app-layout.tsx       cabecera, <nav> y <Outlet />
  common/components/           LoadingMessage, ErrorMessage…
```

- **Los pods nunca se importan entre sí.** Si el editor necesita enlazar al
  catálogo, usa un `<Link>` tipado, no importa el componente.
- **Las escenas importan pods solo por su `index.ts`.**
- **`core/` es puro** salvo `hooks.ts` (y `api.ts`, que habla con
  `fetch`/`localStorage`). La lógica de dominio no importa React.
- Nombres de dominio **en español** (`Cultivo`, `Bancal`, `Plantacion`,
  `avisosBancal`), como en la guía §3. Ficheros en `kebab-case`.
- `check-estatico` (de `verify-task`) comprueba estas reglas.

## 2. Contenedor y componente

```tsx
// pods/bancales/bancal-list.container.tsx
export const BancalListContainer = () => {
  const { data: bancales, loading, error } = useBancales(); // hooks arriba, siempre
  if (loading) return <LoadingMessage />;
  if (error) return <ErrorMessage error={error} />;
  if (bancales.length === 0) return <BancalesVacio />;
  return <BancalList bancales={bancales} />;
};
```

- Todos los hooks **antes** de cualquier `return` temprano.
- El contenedor decide entre carga, error, vacío o no encontrado y
  contenido; el componente solo pinta lo que recibe.
- Un formulario no llama a la API ni navega: su contenedor guarda y después
  llama al `onSaved` de la escena, que navega.

## 3. Estado: dónde vive cada cosa

| Qué | Dónde |
|---|---|
| Filtros del catálogo, mes de la temporada | **URL** (*search params* validados) |
| Bancales y plantaciones | `localStorage`, siempre a través de la capa `api` |
| Cultivo elegido en la paleta, celda con el foco | `useState` en el contenedor del editor |
| Avisos, estado de cada planta, tareas del mes, conteos | **Derivados en el render** con las funciones de `core/` |

- **Lo derivado no se guarda**: nada de `useEffect(() => setAvisos(…))`. Se
  calcula al renderizar: `const avisos = avisosBancal(bancal, plantaciones, cultivos);`.
  Es la regla de la guía §3 («el estado de la planta se deriva, nunca se
  guarda») llevada a React.
- Nada de `useMemo` / `useCallback` sin una razón **medida** (la cuadrícula
  tiene como mucho unos cientos de celdas; recalcular es barato).
- **Nunca mutes el estado**: `map`, `filter`, *spread* y actualizaciones
  funcionales (`setPlantaciones((prev) => [...prev, nueva])`).
- `key` = el id estable (`cultivo.id`, `"fila-columna"` en una celda), nunca
  el índice.

## 4. Datos: la capa `api` y sus hooks

- `core/<dominio>/api.ts` es **asíncrona con latencia simulada**, para que la
  interfaz trate carga y error como con un backend (guía §4). Valida con Zod
  lo que lee (`crops.json` y `localStorage`); un `localStorage` corrupto se
  descarta y se avisa, no rompe la app.
- `core/<dominio>/hooks.ts`: `useX()` devuelve `{ data, loading, error }`.
  Cada efecto crea un `AbortController`, lo pasa a la `api`, devuelve
  `() => controller.abort()` como limpieza y no actualiza el estado si se
  abortó. Las dependencias del efecto son los parámetros (`[bancalId]`).
- `useEffect` + `fetch` está bien aquí: es el patrón del curso y no hay
  TanStack Query en el stack. No añadas librerías de datos.
- `<StrictMode>` se queda en `main.tsx`: en desarrollo los efectos se
  ejecutan dos veces y la primera petición sale como cancelada. Es normal.

## 5. TanStack Router

- Rutas de fichero en `src/routes/` con `createFileRoute`. Las rutas solo
  leen `Route.useParams()` / `Route.useSearch()` y renderizan una escena
  (`Number(bancalId)` si el id es numérico).
- `src/routeTree.gen.ts` lo genera el plugin al construir: **no se edita**
  (el hook `guardia-irreversible` lo bloquea).
- En `vite.config.ts`, `tanstackRouter({ target: "react" })` va **antes** de
  `react()`.
- **Search params validados con Zod** en la ruta, con valores por defecto y
  tolerantes a basura (`?sol=xyz` no rompe la página, guía §2):
  ```ts
  const busquedaCatalogo = z.object({
    q: z.string().catch(""),
    sol: z.enum(["pleno-sol", "semisombra", "sombra"]).optional().catch(undefined),
  });
  export const Route = createFileRoute("/cultivos/")({
    validateSearch: busquedaCatalogo,
    component: () => <CatalogoScene search={Route.useSearch()} />,
  });
  ```
- Cambiar un filtro = navegar: `navigate({ search: (prev) => ({ ...prev, sol }) })`.
  Así recargar o compartir la URL conserva el estado.
- Enlaces siempre tipados: `<Link to="/bancales/$bancalId" params={{ bancalId: String(id) }}>`.
  Nada de React Router.

## 6. Formularios (TanStack Form + Zod)

- El esquema Zod de `core/` se pasa directamente a los `validators` de
  `useForm` (`onChange` y `onSubmit`), sin adaptador. Un único esquema para
  alta y edición, con mensajes en español.
- Errores solo de campos tocados (enviar marca todos como tocados),
  enlazados con `aria-describedby` / `aria-invalid` (ver `frontend-a11y`).
- Números con `event.target.valueAsNumber` (`NaN` se pinta como vacío).
- Al enviar, `schema.parse(value)` devuelve los valores recortados y sin
  claves extra.
- Botón de enviar deshabilitado mientras dura la latencia simulada.

## 7. Estilos

- La unidad de extracción en React es el **componente**: si una lista de
  clases se repite, se crea un componente (`<Boton variante="primario">`), no
  un `@utility`. Los estilos base de elementos (`h1`, `button`, `input`,
  `:focus-visible`) van en `@layer base` de `src/styles.css`. Detalle en
  `tailwind-clases-limpias`.
- Colores solo con tokens de `@theme`; la compatibilidad nunca solo con
  color (icono y texto además).
- Lo que se mueve, con `motion-safe:`. En el editor, *container queries*
  (`@container`) para que la cuadrícula se adapte a su hueco, no a la
  ventana.

## 8. Antes de dar por hecho un cambio

- `npm test` y el build en verde (el hook Stop lo comprueba).
- Si toca interfaz, `verify-task` con el agente `verificador`.
- Si es un cambio grande de componentes, una pasada del agente
  `react-reviewer`.
