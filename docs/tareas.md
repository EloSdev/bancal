# Tareas: Bancal (MVP)

> Fuente: `docs/guia-proyecto.md` (§2 alcance, §3 dominio, §4 tecnología y
> calidad) y las bases del TFC (MVP de principio a fin, iteraciones, Git).
> Se construyen en orden y cada una se verifica antes de empezar la siguiente.
> Estado: ⬜ pendiente · 🔄 en curso · ✅ verificada · ❌ falla

**Cómo se comprueba** (la etiqueta al final de cada criterio):

- `test` — un test de Vitest con nombre concreto, que pasa.
- `build` — `npm run build` (vite build + tsc) sin errores.
- `nav` — navegador real (Playwright): snapshot, `evaluate`, teclado o captura.
- `leer` — leer un fichero y comprobar algo concreto.
- `datos` — contrastar el dato con una fuente de horticultura citada.

**Puertas comunes** (se comprueban en *todas* las tareas y no se repiten):
build sin errores · todos los tests pasan · sin errores en consola ·
sin scroll horizontal a 360 px · foco visible en todo lo interactivo ·
textos de interfaz en español · las tareas ✅ anteriores siguen pasando.

---

## Fase 0 · Cimientos

## T1 · Proyecto base — ✅
**Qué:** proyecto desde `../lab-react` (mismas versiones), más Vitest +
Testing Library + jsdom; layout con navegación y rutas vacías.
**Depende de:** —
**Criterios:**
- C1.1 `package.json` tiene `start`, `build` (`vite build && tsc --noEmit`), `typecheck`, `test` y `test:watch` — `leer` — guía §4
- C1.2 Un test de humo de `core/` y otro de componente (Testing Library) pasan con `npm test` — `test` — guía §4
- C1.3 Un solo test se lanza con `npx vitest run <ruta> -t "<nombre>"` — `test` — guía §4
- C1.4 `/` redirige a `/bancales`; una ruta inexistente muestra «Página no encontrada» — `nav` — guía §2
- C1.5 La cabecera enlaza a «Cultivos» y «Mis bancales» con `<nav>` y marca la ruta activa con `aria-current="page"` — `nav`
- C1.6 `<html lang="es">` y `<title>` propio — `leer` — guía §4
- C1.7 Repositorio git con un primer commit y el `.gitignore` en vigor (`node_modules/` y `dist/` sin seguimiento) — `leer` — bases (Git)
**Verificación:** 2026-11-07 · verificador: PASA. 4 tests, build (vite + tsc) y navegador en 360/768/1440 (`/`, `/bancales`, `/cultivos`, `/no-existe`): sin scroll horizontal, consola vacía, foco visible, `aria-current` correcto. `check-estatico` marcó `core/router/router.ts` por importar `@tanstack/react-router`: falso positivo del script (la skill react-bancal pone ahí el router). Pendiente para T2: zonas de toque de los enlaces de 22 px de alto (≥ 24).

## T2 · Dirección visual y tokens — ✅
**Qué:** `docs/brief.md` con la dirección visual de una *app* (no una
landing) y su traducción a `@theme`: paleta, fuentes, radios, estilos base.
**Depende de:** T1
**Criterios:**
- C2.1 `docs/brief.md` fija paleta, pareja de fuentes, tono y el «detalle memorable» del editor — `leer`
- C2.2 `@theme` define colores semánticos (superficie, tinta, acento) y **tres estados de compatibilidad** (favorable, desfavorable, neutra) — `leer` — guía §4
- C2.3 Los tres colores de compatibilidad tienen contraste ≥ 3:1 con la superficie y vienen siempre acompañados de un icono distinto — `nav` — guía §4 (no solo color)
- C2.4 Fuentes instaladas con `@fontsource-variable/*`; `getComputedStyle(h1).fontFamily` empieza por la de títulos — `nav`
- C2.5 Estilos base en `@layer base` (encabezados, botones, campos, `:focus-visible`) — `leer`
**Verificación:** 2026-11-07 · verificador: PASA (dos pasadas, antes y después de design-reviewer). 7 tests, build, check-estatico y lote de 4 rutas × 360/1440 sin problemas ni errores de consola. Compatibilidad medida: favorable 4,58, desfavorable 5,66 y neutra 3,61 sobre la superficie (3,19 la neutra sobre tierra, la más justa); tres formas distintas, legibles en gris a 20 y 16 px. h1 en «Fraunces Variable» con `"SOFT" 100`. design-reviewer: arreglados el radio que cambiaba con el foco, la pluma azul en la ruta activa, los pesos de los iconos, los radios propios y el favicon. Pendiente de T2 en T1 resuelto (enlaces de 44 px). La leyenda está provisionalmente en `/bancales` hasta T11/T14.

---

## Fase 1 · Dominio (`core/`, con TDD)

## T3 · Modelo y esquemas — ✅
**Qué:** tipos del dominio y esquemas Zod. Aquí se **confirman las reglas
marcadas *(propuesta)*** en la guía §3 y se anotan las decisiones en ella.
**Depende de:** T1
**Criterios:**
- C3.1 Tipos `Cultivo`, `Bancal`, `Plantacion`, `ZonaClimatica`, `Exposicion` — `build` — guía §3
- C3.2 `EstadoPlanta` y `Aviso` son *discriminated unions*; un `switch` sin todos los casos no compila (`never`) — `build` — guía §4
- C3.3 El esquema de cultivo acepta un cultivo válido y rechaza uno sin calendario o con un mes fuera de 1–12 — `test`
- C3.4 El esquema de bancal rechaza medidas < 30 cm o por encima del máximo acordado (300 cm) y horas de sol fuera de 0–24, con mensajes en español — `test` — guía §4
- C3.5 Las reglas *(propuesta)* de la guía §3 pasan a decisiones firmes en «Reglas del dominio» de `CLAUDE.md` (la guía es privada) — `leer`
**Verificación:** 2026-11-07 · verificador: PASA. 39 tests, build, check-estatico y lote sin cambios visuales. C3.2 demostrado en una copia: quitar un `@ts-expect-error` o añadir un estado sin tratar hace fallar `tsc` con el error de `never`. Decisiones del usuario: estado «terminada» tras la cosecha, lado 30–300 cm, ⌊·/30⌋, vecindad de 8, exposición ≥6 / 3–<6 / <3. Tras la verificación, a raíz de sus avisos y con el usuario: cm enteros, nombre ≤ 40 caracteres y «un aviso por pareja» pasan a Reglas del dominio (41 tests y `tsc` en verde); `test-primero` deja pasar `__fixtures__/`.

## T4 · Catálogo de cultivos (datos) — ✅
**Qué:** `public/crops.json` con ~24 cultivos de huerto urbano y sus fuentes.
**Depende de:** T3
**Criterios:**
- C4.1 Entre 20 y 30 cultivos, y todos pasan el esquema de T3 — `test`
- C4.2 Coherencia: ningún cultivo es a la vez compatible e incompatible con otro, y toda referencia apunta a un id existente — `test`
- C4.3 Simetría: si A declara a B incompatible, B declara a A incompatible (igual con compatibles) — `test`
- C4.4 Están los cultivos de la demo: tomate, albahaca e hinojo, con tomate–albahaca favorable y tomate–hinojo desfavorable — `test` — guía §2 (demo)
- C4.5 Cada cultivo cita al menos una fuente, listada en el README — `leer` + `datos` — guía §3
- C4.6 Muestreo: 5 cultivos al azar contrastados con su fuente (plantas por celda, sol, calendario) — `datos` — guía §3 (riesgo principal)
- C4.7 Cada cultivo tiene su ciclo (meses hasta la primera cosecha y meses de cosecha, en total ≤ 12; por zona desde T18), contrastado con fuente para los cultivos de la demo y la muestra — `test` + `datos` — decisión T4
**Verificación:** 2026-11-07 · verificador: PASA (dos pasadas). 56 tests, build, check-estatico y lote sin cambios visuales; `crops.json` (24 cultivos, 19 fuentes en el README) llega al build. revisor-datos, tres pasadas: C4.6 con muestra al azar (berenjena, capuchina, espinaca, judía verde, remolacha; random.org) → 14 correcciones (sobre todo cultivos de calor en zona atlántica y ventanas de interior), después 0 ❌ y plantas por celda 5/5; C4.7 (ciclos de la demo y la muestra) → 7 correcciones, después 0 ❌. Decisiones del usuario: siembra = entra en el bancal, solo cultivos de una celda, la lista de 24, fuentes divulgativas + método de cuadrados, y **ciclo por cultivo** (cambia el modelo de T3, criterio C4.7 nuevo y C7.1 reescrito). Pendiente para T7, en sus **Notas**: primer mes de cosecha e hinojo atlántico.

## T5 · Cuadrícula, vecindad y exposición — ✅
**Depende de:** T3
**Criterios:**
- C5.1 `dimensiones(120, 90)` → 4 columnas × 3 filas; `dimensiones(100, 50)` → 3 × 1 (redondeo hacia abajo) — `test` — guía §3
- C5.2 `vecinos()` devuelve 3 en una esquina, 5 en un borde y 8 en el centro, nunca fuera de la cuadrícula — `test` — guía §3
- C5.3 `exposicion(6)` → pleno sol, `exposicion(3)` → semisombra, `exposicion(2.9)` → sombra (límites incluidos) — `test` — guía §3
**Verificación:** 2026-11-07 · verificador: PASA. 72 tests (16 nuevos en `core/bancales/cuadricula.test.ts` y `exposicion.test.ts`), build (vite + tsc) y `check-estatico` sin fallos. C5.1 comprueba ⌊/30⌋ (fallaría con `round`/`ceil`); C5.2 compara la lista exacta de vecinos en esquina, borde y centro y recorre toda la cuadrícula 4 × 3 sin salirse; C5.3 fija los límites hacia arriba (6 y 3 h). Casos extra: 1 × 1, 10 × 10, 3 × 1, 0/5,9/24 h. Navegador no aplica (solo `core/`).

## T6 · Compatibilidad y avisos — ✅
**Depende de:** T4, T5
**Criterios:**
- C6.1 `compatibilidad(a, b)` da favorable / desfavorable / neutra y es simétrica — `test` — guía §3
- C6.2 `avisosBancal()` da un aviso de vecindad desfavorable **por pareja** (no dos), con texto que nombra ambos cultivos y el motivo — `test` — guía §3
- C6.3 Aviso de falta de sol si el cultivo pide más exposición que la del bancal — `test` — guía §3
- C6.4 Aviso de siembra fuera de temporada según la zona climática — `test` — guía §3
- C6.5 Escenario de la demo: 120 × 90 con tomates, albahaca e hinojo junto al tomate → aviso del hinojo; tras moverlo lejos → 0 avisos de vecindad — `test` — guía §2 (demo)
**Verificación:** 2026-11-07 · verificador: PASA. 109 tests (37 nuevos: `cultivos/compatibilidad`, `cultivos/ventana`, `bancales/avisos`), build (vite + tsc) y `check-estatico` sin fallos. Prueba de 11 mutantes (dos avisos por pareja, sin diagonales, límites de sol, ventana sin cruce de año, zona ignorada, compatibilidad asimétrica, texto sin motivo…): todos rompen algún test. Los tests usan `core/__fixtures__/`, no `crops.json`. El texto del aviso sale de `textoAviso()` aparte, sin cambiar el tipo `Aviso` de T3; los textos se pulirán con `ux-copy` en el editor. Ojo: en los fixtures la lechuga es neutra con el tomate (en el catálogo real es favorable).

## T7 · Temporada — ✅
**Depende de:** T4
**Criterios:**
- C7.1 `estadoPlanta(plantacion, cultivo, zona, mes)` recorre por sembrar → sembrada → creciendo → cosecha → terminada a lo largo del año, según el **ciclo** del cultivo contado desde el `mesSiembra` de la plantación — `test` — guía §3 + decisiones T3 y T4
- C7.2 Ventanas que cruzan el año (siembra en octubre, cosecha en marzo) dan el estado correcto en enero — `test`
- C7.3 El mes de siembra por defecto es el primero válido de la ventana de su zona — `test` — guía §3
- C7.4 `tareasDelMes()` lista qué sembrar y qué cosechar ese mes, sin duplicados — `test` — guía §2
- C7.5 El estado nunca se guarda: no aparece en el modelo persistido — `leer` — guía §3
**Verificación:** 2026-11-07 · verificador: PASA. 128 tests (19 nuevos en `core/bancales/temporada.test.ts`), build (vite + tsc) y `check-estatico` sin fallos; 14 mutantes (año cortado en diciembre, primer mes de cosecha desplazado, duplicados en tareas, ventana en vez de ciclo…) rompen todos algún test. Decidido con el usuario y anotado en «Reglas del dominio»: año que se repite (ajo de octubre creciendo en enero), primer mes de cosecha = `mesSiembra + mesesHastaCosecha` (tomate de mayo {2,2}: cosecha julio–agosto, fijado en test; resuelve la nota 1 de T4) y qué entra en las tareas del mes. `estadoPlanta` no recibe `zona` (el estado sale del ciclo). C7.5: `Plantacion` y los esquemas no tienen estado. La nota 2 de T4 (hinojo) resultó ser un desfase ciclo/ventana en 16 pares cultivo × zona: va a una tarea de datos antes de T14.

## T8 · Capa `api` y hooks — ✅
**Depende de:** T3, T4
**Criterios:**
- C8.1 `getCultivos` / `getCultivo` leen `crops.json` (comprobando `response.ok`) y validan con Zod — `test`
- C8.2 `getBancales` / `getBancal` / `saveBancal` / `deleteBancal` / `savePlantaciones` usan `localStorage` con latencia simulada — `test` (temporizadores falsos)
- C8.3 Un fallo de red o un JSON inválido llega como error tipado, no como excepción sin capturar — `test`
- C8.4 Los hooks devuelven `{ data, loading, error }`, cancelan con `AbortController` y no actualizan el estado tras desmontarse — `test`
- C8.5 Un `localStorage` corrupto no rompe la app: se descarta y se avisa — `test`
- C8.6 Encoger un bancal quita las plantaciones que quedan fuera de la cuadrícula nueva; `savePlantaciones` rechaza celdas fuera de la cuadrícula o repetidas — `test` — decisión T8
**Verificación:** 2026-11-07 · verificador: FALLA → PASA (2.ª vuelta); react-reviewer: bloquea → aviso. 1.ª vuelta: faltaba el test de latencia de `savePlantaciones` (mutante superviviente); el reviewer pidió `EstadoCarga` como unión discriminada, `recargar()`, que una copia fallida de lo descartado no atascara la app y decidir la coherencia plantaciones–cuadrícula. Arreglado todo; el usuario decidió encoger = quitar las de fuera con aviso (C8.6 nuevo, C12.6 para T12) y borrar la copia de lo descartado al cerrar el aviso (en «Reglas del dominio»). 2.ª vuelta: 202 tests, build (vite + tsc) y `check-estatico` sin fallos, sin avisos de `act()`; 26 de 28 mutantes mueren; el de filas/columnas traspuestas al encoger se tapó después con un test de rectángulo, el de `Object.hasOwn` es equivalente en la práctica. La app carga sin errores de consola (ningún componente usa aún los hooks). Pendiente para T11 (en sus **Notas**): `recargar` vuelve a «cargando» y el foco se perdería tras borrar.

## T18 · Ciclo y ventanas de cosecha coherentes (datos) — ✅
**Qué:** corregir el desfase que se encontró al cerrar T7. El ciclo es el mismo en todas las zonas y, en 16 pares cultivo × zona, su primer mes de cosecha cae fuera de la ventana de cosecha de la zona (hinojo atlántico, ajo de interior, haba, cebolla…).
**Orden:** va justo después de T8, aunque se llame T18. Se añadió al cerrar T7 y no se renumera para no romper las referencias a T9–T17.
**Depende de:** T4, T7
**Criterios:**
- C18.1 Antes de tocar datos, se decide con el usuario cómo resolverlo (ciclo por zona, o ajustar ciclos y ventanas) y queda escrito en «Reglas del dominio» de `CLAUDE.md` — `leer`
- C18.2 Test de coherencia del catálogo: para cada cultivo y zona, sembrando en el mes por defecto (C7.3), el primer mes de cosecha cae dentro de la ventana de cosecha de esa zona — `test`
- C18.3 El hinojo de la demo, sembrado en mayo en zona atlántica, sale «cosecha» en un mes de su ventana de cosecha atlántica — `test` — guía §2 (demo)
- C18.4 Cada ciclo o ventana que cambia se contrasta con su fuente (agente `revisor-datos`): 0 ❌ — `datos` — guía §3
- C18.5 El ciclo va en el calendario de cada zona (`calendario[zona].ciclo`, obligatorio, ≤ 12 meses); `estadoPlanta` y `tareasDelMes` usan el de la zona del bancal: el mismo cultivo sembrado el mismo mes avanza distinto en dos zonas — `test` — decisión T18
**Verificación:** 2026-11-07 · verificador: PASA CON HUECOS → PASA (le faltaba el informe íntegro de revisor-datos para C18.4). Decisión del usuario: **ciclo obligatorio por zona** (`calendario[zona].ciclo`; `estadoPlanta` y `tareasDelMes` reciben `zona`; textos de C4.7 y C7.1 ajustados, tests de T3/T4/T7 adaptados solo en forma). 208 tests, build (vite + tsc), `check-estatico` sin fallos; app y `crops.json` servidos sin errores. Datos en dos pasos: migración mecánica (C18.2 falló con exactamente los 16 desfases) y ciclos propuestos para esos 16 pares. revisor-datos: 19 datos → 11 ✅ · 7 ⚠️ · 1 ❌. Corregido el ❌ (ajo de interior: siembra 10–1, ciclo 8+1; lo de agosto eran ajetes). De los 7 ⚠️, el usuario aplicó 5 (rábano de interior 1+1 y cosecha 4–6; haba atlántica siembra 10–2; fresa de interior siembra 11–3; guisante de interior siembra 10–11 y 5+1; fresa atlántica cosecha 6–10); 2 se quedan con el aval del revisor (hinojo de interior, remolacha mediterránea). Fuente nueva `zaragoza-calendario-escolar`; README actualizado. Contrapruebas: C18.2 y C18.3 fallan con los datos antiguos; los mutantes que ignoran la zona rompen C18.5 y C18.2. Para T9/T14: el ciclo de 5 meses del hinojo atlántico cuenta desde la siembra directa; no llamarla «trasplante» en la interfaz.

---

## Fase 2 · Pantallas

## T9 · Catálogo — ✅
**Ruta:** `/cultivos?q=&sol=&temporada=&zona=`
**Depende de:** T2, T8
**Criterios:**
- C9.1 Lista de cultivos con nombre, sol y dificultad, que enlaza a su ficha — `nav` — guía §2
- C9.2 Búsqueda por nombre y filtros de sol y temporada (mes de siembra en la zona elegida, decisión T9) actualizan la URL; recargar mantiene el resultado — `nav` — guía §2
- C9.3 Parámetros inválidos (`?sol=xyz`) se ignoran sin romper la página (validación Zod de *search params*) — `nav` + `test`
- C9.4 Estados de carga, error y «sin resultados» visibles; el error usa `role="alert"` — `nav` + `test`
- C9.5 El número de resultados se anuncia con `aria-live` — `nav` — guía §4
**Verificación:** 2026-11-07 · verificador: FALLA → PASA → PASA (3 vueltas); react-reviewer: bloquea → aprobado; design-reviewer: 2 rondas aplicadas. Decisión del usuario: «temporada» = mes de siembra en la zona elegida, con `zona` en la URL (en «Reglas del dominio», que también fija `q` y `sol` exacto). 1.ª vuelta: el foco caía en `<body>` tras «Quitar filtros» y «Reintentar», y el separador «·» daba 2,03:1; el reviewer pidió navegar sobre `prev` (filtros desfasados), separar buscar/filtrar y quitar los `as`. Arreglado: foco a la búsqueda, un solo «Quitar filtros» en la línea del recuento, escena con `onBuscar`/`onFiltrar`/`onQuitarFiltros`, cola de ecos de la búsqueda (la URL va por detrás del texto). Diseño: regla de 12 meses a lápiz con la siembra en madera y una cota de pluma en el mes filtrado (`common/components/regla-meses.tsx`, reutilizable en T10/T15), orden alfabético, mensajes sin resultados concretos, error sin «HTTP», esqueleto de carga. Final: 246 tests, build (vite + tsc), `check-estatico` sin fallos; navegador a 360/1440 sin scroll horizontal ni errores de consola, contraste ≥ 5,68:1 en la regla, 10/10 paradas de Tab visibles, movimiento reducido respetado. Queda: ~20 px de más entre formulario y alerta en el estado de error (estético); foco al cambiar de ruta, en las Notas de T16; los iconos de cultivo del brief no tienen tarea todavía.

## T10 · Ficha de cultivo — ✅
**Ruta:** `/cultivos/$cultivoId`
**Depende de:** T9
**Criterios:**
- C10.1 Muestra plantas por celda, sol, riego, dificultad y familia — `nav` — guía §2
- C10.2 Calendario de siembra y cosecha de las tres zonas, legible sin color (texto o patrón) — `nav` — guía §4
- C10.3 Compatibles e incompatibles como enlaces a sus fichas — `nav`
- C10.4 Un id inexistente muestra «Cultivo no encontrado» con un enlace al catálogo — `nav`
**Verificación:** 2026-11-08 · verificador: FALLA (midió con el código cambiando: tests de TDD en rojo y foco en `<body>`) → PASA; react-reviewer: bloquea → arreglado; design-reviewer: 1 ronda aplicada. La ficha carga el catálogo entero (`useCultivos`) para dar nombre a los vecinos y no recargar de ficha a ficha. Foco: al `<h1>` (`tabIndex=-1`, `w-fit`) al llegar y al cambiar de cultivo; tras «Reintentar» espera en el envoltorio y pasa al `<h1>`; `role="status"` desde el principio. Diseño: «Se perjudican» antes que «Se ayudan», fila entera pulsable, una sola frase sin vecinos, siembra subrayada y cosecha rellena (`ReglaMeses` con `marca`; `descripcion` opcional solo con la ventana en texto visible), «Buscar «x»» en no encontrado, esqueleto con la forma de la ficha. Final: 256 tests, build (vite + tsc), `check-estatico` sin fallos; navegador a 360/1440 sin scroll horizontal ni errores, 15/15 paradas de Tab visibles, movimiento reducido respetado, T9 sin regresiones. Decidido con el usuario: la miga «Catálogo» no conserva los filtros (Atrás sí); los iconos de cultivo van a T19. Queda: contorno grande del envoltorio mientras recarga tras «Reintentar» (dura la latencia).

## T11 · Mis bancales — ✅
**Ruta:** `/bancales`
**Depende de:** T6, T8
**Criterios:**
- C11.1 Cada bancal muestra nombre, medidas, celdas, número de plantas y avisos pendientes — `nav` — guía §2
- C11.2 Sin bancales: estado vacío con un botón «Crear mi primer bancal» — `nav`
- C11.3 Borrar un bancal pide confirmación y el foco vuelve a un sitio lógico — `nav`
- C11.4 Si los datos guardados estaban dañados (C8.5), la lista lo avisa; al cerrar el aviso se borra la copia apartada — `nav` + `test` — decisión T8
**Verificación:** 2026-11-08 · verificador: FALLA (scroll horizontal a 360/768: la línea de medidas no tenía dónde partirse) → PASA; react-reviewer: bloquea → arreglado; design-reviewer: 1 ronda aplicada. Decisión del usuario (de la nota de T8): tras `deleteBancal` el contenedor quita el bancal de la lista que ya tiene (un `Set` de borrados), sin recargar; `useCarga` no cambia. C11.4 añadido en esta tarea: el aviso de datos dañados de C8.5 no tenía pantalla. «Plantas» se muestra como celdas plantadas («3 de 12 plantadas»). `core/`: `getBancalesDetalle`, `useBancalesDetalle` y `resumenBancal` con TDD. Borrar: `<dialog>` nativo con `showModal()` (foco inicial en «Conservar bancal», Escape devuelve el foco a «Borrar»), «Borrar bancal» con `aria-disabled` para no perder el foco si falla, foco al siguiente / anterior / «Crear mi primer bancal» y anuncio con los que quedan. Diseño: croquis a escala (marco doble, punto de tinta por celda plantada) en la lista, el vacío y el diálogo; rombo en los avisos; «Nuevo bancal» en la fila del título; `Alerta` común; `--shadow-hoja`. Rutas `/bancales/nuevo` y `/bancales/$bancalId` provisionales (T12, T13); la leyenda de compatibilidad sale de `/bancales` y vuelve en T14. Final: 272 tests, build (vite + tsc), `check-estatico` sin fallos; navegador a 360/768/1440 sin scroll horizontal ni errores, 12/12 paradas de Tab visibles, movimiento reducido respetado, T9/T10 sin regresiones. Queda: tras «Reintentar» el foco espera en el envoltorio y no pasa al `<h1>` (T10 sí): unificar en T16; a 768 una línea de medidas puede empezar por «·»; marcar en el croquis las celdas con aviso (T14).

## T12 · Alta y edición de bancal — ✅
**Rutas:** `/bancales/nuevo`, `/bancales/$bancalId/editar`
**Depende de:** T11
**Criterios:**
- C12.1 Formulario TanStack Form con el esquema de T3: nombre, ancho, largo, horas de sol y zona (atlántica por defecto) — `nav` + `test` — guía §3
- C12.2 Cada campo tiene `<label>`; los errores salen al tocar el campo o al enviar, enlazados con `aria-describedby` / `aria-invalid` — `nav` + `test` — guía §4
- C12.3 Vista previa en vivo de la cuadrícula resultante («4 × 3 celdas») — `nav`
- C12.4 Al guardar navega al editor del bancal; al editar, conserva las plantaciones que siguen cabiendo — `nav` + `test`
- C12.5 Botón de enviar deshabilitado durante la latencia simulada — `nav`
- C12.6 Si al encoger el bancal quedan plantaciones fuera, el formulario avisa de cuántas se quitarán antes de guardar — `nav` + `test` — decisión T8
**Verificación:** 2026-11-08 · verificador: PASA (1.ª vuelta, sobre el código ya revisado); react-reviewer: bloquea → arreglado; design-reviewer: 1 ronda aplicada (un Crítico). Formulario único (TanStack Form + `bancalSchema`) con `NuevoBancalContainer` / `EditarBancalContainer`; la escena navega al editor al guardar. Reviewer: salir durante la latencia aborta el guardado (`AbortController`, sin navegación fantasma); el aviso de plantaciones que se quitan se anuncia en la región de estado y va en el `aria-describedby` del botón; campos `required`; foco al primer error en `requestAnimationFrame`. Diseño: el aviso de C12.6 va encima del botón (a 360 quedaba debajo, fuera de pantalla); vista previa con el croquis grande, cotas a lápiz y punto hueco en lo que se quita; campo con error en tinta doble (`inset-ring`), no en rojo, y el error antes de la pista; foco al `<h1>` en Nuevo y Editar (`common/components/titulo-pagina.tsx`); mensaje propio cuando el navegador no deja escribir; enlace «Editar» en las tarjetas de `/bancales`, con «Editar · Borrar» en su línea. «Guardando…» con `aria-disabled` (no `disabled`) para no perder el foco. `core/`: `plantacionesFuera` con TDD. Final: 290 tests, build (vite + tsc), `check-estatico` sin fallos; navegador a 360/1440 sin scroll horizontal ni errores, 7/7 paradas de Tab visibles, movimiento reducido respetado, T9–T11 sin regresiones. Queda: el error de un campo sale al teclear (TanStack marca «tocado» con el primer cambio), no al salir del campo; «Bancal no encontrado» no toma el foco (T16); lector de pantalla real sin probar.

## T19 · Iconos de cultivo — ✅
**Qué:** el juego de iconos SVG propios del brief («Cultivos en pantalla»),
un dibujo por cultivo de **lo que se cosecha** (el fruto, la raíz o la mata
entera: es lo que se reconoce a 24 px), que el editor usa en las celdas. Los
dibujos por estado (semilla, brote, planta) del detalle memorable son de T15.
**Depende de:** T2, T4, T10
**Criterios:**
- C19.1 Cada cultivo de `public/crops.json` tiene su icono: mismo `viewBox`, trazo de 1,5 px en `currentColor`, sin rellenos de color — `test` + `leer` — brief
- C19.2 `IconoCultivo` es decorativo (`aria-hidden`, el nombre va en texto) y un id sin icono pinta uno genérico sin romper — `test` — brief
- C19.3 Junto al nombre en el catálogo (≈ 24 px) y junto al `<h1>` y a cada vecino en la ficha (≈ 48 / 24 px) — `nav` — brief
- C19.4 Los iconos se distinguen entre sí a 24 px y se entienden en gris (captura de los ~24 juntos) — `nav` + captura — brief
**Verificación:** 2026-11-08 · verificador: PASA (1.ª vuelta); react-reviewer: aviso → arreglado (semillas de la fresa a 1,5 y test de C19.1 que ahora prohíbe trazo, color, relleno y estilo propios en los hijos); design-reviewer: 1 ronda aplicada. `common/components/icono-cultivo.tsx`: 24 dibujos y una estaca genérica (no un brote, que se confundiría con el estado de T15); viewBox 24, trazo 1,5 en `currentColor` con `non-scaling-stroke` (mismo grosor a 24 y 48 px), sin rellenos ni círculos geométricos (todo a mano alzada). Redibujados tras la revisión y hojas de muestra: berenjena, judía, lechuga, tomate (achatado, sin gajos: con ellos se leía calabaza), hinojo, cebolla (capas, frente a los dientes del ajo), haba, albahaca, rúcula, capuchina, cilantro, caléndula (pétalos en lazo, no un sol), pimiento, cebollino. En el catálogo, junto al nombre (24 px); en la ficha, junto al `<h1>` (48 px, alineado con `-ml-2`) y en cada vecino (24 px, en tinta y no en el azul del enlace). Decisión anotada en T15: este juego es «lo que se cosecha»; faltan la planta de cada cultivo, la semilla y el brote. Final: 321 tests, build (vite + tsc), `check-estatico` sin fallos; navegador a 360/1440 sin scroll horizontal ni errores, 31/31 paradas de Tab visibles, nombres accesibles intactos, T9–T12 sin regresiones; capturas a 24 px reales en color y en gris (`.playwright-mcp/t19-iconos-24*.png`). Queda: a 24 px se parecen rábano/remolacha y pimiento/tomate; acelga y cilantro cuestan de reconocer.

## T13 · Editor: cuadrícula y colocación — ⬜
**Ruta:** `/bancales/$bancalId`
**Depende de:** T12, T19
**Criterios:**
- C13.1 La cuadrícula tiene tantas celdas como da `dimensiones()` y conserva la proporción del bancal (*container queries*) — `nav` — guía §2
- C13.2 Elegir un cultivo de la paleta y hacer clic o tocar una celda lo coloca; en una celda ocupada lo sustituye — `nav` — guía §2
- C13.3 Teclado: Tab entra en la cuadrícula, las flechas se mueven entre celdas (*roving tabindex*), Intro coloca y Supr quita — `nav` — guía §2, §4
- C13.4 Cada celda tiene un nombre accesible («Fila 2, columna 3: tomate») — `nav`
- C13.5 Las plantaciones se guardan y siguen ahí al recargar — `nav`
**Verificación:** —

## T14 · Editor: compatibilidades en vivo — ⬜
**Depende de:** T6, T13
**Criterios:**
- C14.1 Las celdas con vecindad desfavorable o favorable se marcan con color **e icono** — `nav` — guía §4
- C14.2 Panel de avisos que explica cada uno (quién, con quién y por qué); el sol y la temporada también aparecen — `nav` — guía §2
- C14.3 Los cambios en los avisos se anuncian con `aria-live="polite"` — `nav` — guía §4
- C14.4 Recorrido de la demo: hinojo junto a tomate → marcado y explicado; al moverlo → todo pasa a favorable o neutro — `nav` + captura — guía §2 (demo)
- C14.5 Los avisos nunca impiden colocar nada — `nav` — guía §3
**Verificación:** —

## T15 · Temporada — ⬜
**Ruta:** `/bancales/$bancalId?mes=5`
**Depende de:** T7, T14
**Criterios:**
- C15.1 Un deslizador de meses (enero–diciembre) actualiza `?mes=`; recargar mantiene el mes y un mes inválido usa el actual — `nav` + `test` — guía §2
- C15.2 Cada celda muestra el estado de su planta con icono y texto accesible — `nav` — guía §2, §4
- C15.3 El cambio de estado se anima con CSS y se desactiva con `prefers-reduced-motion` — `nav` — guía §4
- C15.4 La lista de tareas del mes se actualiza con el deslizador — `nav` — guía §2
- C15.5 Recorrido de la demo: de marzo a septiembre el huerto pasa de «por sembrar» a «cosecha» — `nav` + capturas — guía §2 (demo)
**Notas:** (de T19) los iconos de `common/components/icono-cultivo.tsx` dibujan **lo que se cosecha** (el fruto, la raíz o la mata entera), que es lo que se reconoce a 24 px: sirven de «cosecha». Para el detalle memorable del brief faltan la semilla y el brote compartidos y la **planta** propia de cada cultivo (24). Revisar el alcance con el usuario al empezar T15.
**Verificación:** —

---

## Fase 3 · Cierre

## T16 · Repaso de responsive y accesibilidad — ⬜
**Depende de:** T9–T15
**Criterios:**
- C16.1 Todas las rutas funcionan a 360, 768 y 1440 px (capturas) — `nav` — guía §4
- C16.2 El flujo completo de la demo se hace solo con teclado — `nav` — guía §4
- C16.3 Lighthouse Accesibilidad ≥ 95 en catálogo, editor y formulario — `nav` — guía §4
**Notas:** (de la verificación de T9) al cambiar de ruta el foco se queda en `<body>`; `frontend-a11y` §6 pide llevarlo al `<h1>` de la pantalla nueva. Afecta al layout de toda la app (T1), no a una pantalla.
**Verificación:** —

## T17 · README y demo — ⬜
**Depende de:** T16
**Criterios:**
- C17.1 El README explica cómo ejecutar, el mapa de rutas, las capturas, las fuentes de los datos y el registro del uso de IA — `leer` — guía §4
- C17.2 Guion de la demo (§2) ensayado de principio a fin sin errores en consola — `nav`
- C17.3 La lista de iteraciones pendientes está en el README — `leer` — bases (iteraciones)
**Verificación:** —

---

## Cobertura

| Requisito | Tareas |
|---|---|
| Catálogo con búsqueda y filtros en la URL | T9 |
| Ficha de cultivo | T10 |
| Mis bancales | T11 |
| Alta y edición de bancal | T12 |
| Editor (clic, toque, teclado) | T13 |
| Compatibilidades en vivo con explicación | T6, T14 |
| Temporada (mes en la URL) | T7, T18, T15 |
| Momento estrella de la demo | T4, T6, T14, T15, T17 |
| Conceptos del dominio (§3) | T3, T5, T6, T7 |
| Datos verificados con fuentes | T4, T18, T17 |
| Capa `api` con latencia, carga y error | T8, T9 |
| Build y tests sin errores | puertas comunes, T1 |
| Teclado, foco, etiquetas, `aria-live` | T12, T13, T14, T16 |
| Compatibilidad nunca solo por color | T2, T14 |
| Iconos de cultivo a tinta (brief) | T19, T13 |
| Responsive móvil → escritorio | puertas comunes, T16 |
| Interfaz en español, `lang="es"` | T1, puertas comunes |
| README completo | T17 |
| Git con commits frecuentes | T1 (un commit por tarea ✅) |

## Iteraciones (después del MVP, por prioridad)

Arrastrar y soltar con vista previa de compatibilidad · deshacer y rehacer ·
View Transitions · asistente «Mi primer huerto» · rotación por familia
botánica · PWA sin conexión · compartir e imprimir · tests end-to-end ·
cultivos que ocupan varias celdas (calabacín, calabaza, melón, alcachofa).
