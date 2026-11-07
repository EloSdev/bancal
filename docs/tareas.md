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
- C4.7 Cada cultivo tiene su ciclo (meses hasta la primera cosecha y meses de cosecha, en total ≤ 12), contrastado con fuente para los cultivos de la demo y la muestra — `test` + `datos` — decisión T4
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

## T7 · Temporada — ⬜
**Depende de:** T4
**Criterios:**
- C7.1 `estadoPlanta(plantacion, cultivo, zona, mes)` recorre por sembrar → sembrada → creciendo → cosecha → terminada a lo largo del año, según el **ciclo** del cultivo contado desde el `mesSiembra` de la plantación — `test` — guía §3 + decisiones T3 y T4
- C7.2 Ventanas que cruzan el año (siembra en octubre, cosecha en marzo) dan el estado correcto en enero — `test`
- C7.3 El mes de siembra por defecto es el primero válido de la ventana de su zona — `test` — guía §3
- C7.4 `tareasDelMes()` lista qué sembrar y qué cosechar ese mes, sin duplicados — `test` — guía §2
- C7.5 El estado nunca se guarda: no aparece en el modelo persistido — `leer` — guía §3
**Notas:** (de la verificación de T4) 1) fijar con un test cuál es el primer mes de cosecha: con la lectura natural, tomate sembrado en mayo {2,2} → creciendo junio, cosecha julio–agosto, terminada desde septiembre. 2) El hinojo atlántico de la demo (mayo, {4,1}) se cosecha en septiembre, un mes antes de su ventana orientativa 10–12: decidir con el usuario si se ajusta el ciclo o la ventana antes de que lo muestre la ficha (T14).
**Verificación:** —

## T8 · Capa `api` y hooks — ⬜
**Depende de:** T3, T4
**Criterios:**
- C8.1 `getCultivos` / `getCultivo` leen `crops.json` (comprobando `response.ok`) y validan con Zod — `test`
- C8.2 `getBancales` / `getBancal` / `saveBancal` / `deleteBancal` / `savePlantaciones` usan `localStorage` con latencia simulada — `test` (temporizadores falsos)
- C8.3 Un fallo de red o un JSON inválido llega como error tipado, no como excepción sin capturar — `test`
- C8.4 Los hooks devuelven `{ data, loading, error }`, cancelan con `AbortController` y no actualizan el estado tras desmontarse — `test`
- C8.5 Un `localStorage` corrupto no rompe la app: se descarta y se avisa — `test`
**Verificación:** —

---

## Fase 2 · Pantallas

## T9 · Catálogo — ⬜
**Ruta:** `/cultivos?q=&sol=&temporada=`
**Depende de:** T2, T8
**Criterios:**
- C9.1 Lista de cultivos con nombre, sol y dificultad, que enlaza a su ficha — `nav` — guía §2
- C9.2 Búsqueda por nombre y filtros de sol y temporada actualizan la URL; recargar mantiene el resultado — `nav` — guía §2
- C9.3 Parámetros inválidos (`?sol=xyz`) se ignoran sin romper la página (validación Zod de *search params*) — `nav` + `test`
- C9.4 Estados de carga, error y «sin resultados» visibles; el error usa `role="alert"` — `nav` + `test`
- C9.5 El número de resultados se anuncia con `aria-live` — `nav` — guía §4
**Verificación:** —

## T10 · Ficha de cultivo — ⬜
**Ruta:** `/cultivos/$cultivoId`
**Depende de:** T9
**Criterios:**
- C10.1 Muestra plantas por celda, sol, riego, dificultad y familia — `nav` — guía §2
- C10.2 Calendario de siembra y cosecha de las tres zonas, legible sin color (texto o patrón) — `nav` — guía §4
- C10.3 Compatibles e incompatibles como enlaces a sus fichas — `nav`
- C10.4 Un id inexistente muestra «Cultivo no encontrado» con un enlace al catálogo — `nav`
**Verificación:** —

## T11 · Mis bancales — ⬜
**Ruta:** `/bancales`
**Depende de:** T6, T8
**Criterios:**
- C11.1 Cada bancal muestra nombre, medidas, celdas, número de plantas y avisos pendientes — `nav` — guía §2
- C11.2 Sin bancales: estado vacío con un botón «Crear mi primer bancal» — `nav`
- C11.3 Borrar un bancal pide confirmación y el foco vuelve a un sitio lógico — `nav`
**Verificación:** —

## T12 · Alta y edición de bancal — ⬜
**Rutas:** `/bancales/nuevo`, `/bancales/$bancalId/editar`
**Depende de:** T11
**Criterios:**
- C12.1 Formulario TanStack Form con el esquema de T3: nombre, ancho, largo, horas de sol y zona (atlántica por defecto) — `nav` + `test` — guía §3
- C12.2 Cada campo tiene `<label>`; los errores salen al tocar el campo o al enviar, enlazados con `aria-describedby` / `aria-invalid` — `nav` + `test` — guía §4
- C12.3 Vista previa en vivo de la cuadrícula resultante («4 × 3 celdas») — `nav`
- C12.4 Al guardar navega al editor del bancal; al editar, conserva las plantaciones que siguen cabiendo — `nav` + `test`
- C12.5 Botón de enviar deshabilitado durante la latencia simulada — `nav`
**Verificación:** —

## T13 · Editor: cuadrícula y colocación — ⬜
**Ruta:** `/bancales/$bancalId`
**Depende de:** T12
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
**Verificación:** —

---

## Fase 3 · Cierre

## T16 · Repaso de responsive y accesibilidad — ⬜
**Depende de:** T9–T15
**Criterios:**
- C16.1 Todas las rutas funcionan a 360, 768 y 1440 px (capturas) — `nav` — guía §4
- C16.2 El flujo completo de la demo se hace solo con teclado — `nav` — guía §4
- C16.3 Lighthouse Accesibilidad ≥ 95 en catálogo, editor y formulario — `nav` — guía §4
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
| Temporada (mes en la URL) | T7, T15 |
| Momento estrella de la demo | T4, T6, T14, T15, T17 |
| Conceptos del dominio (§3) | T3, T5, T6, T7 |
| Datos verificados con fuentes | T4, T17 |
| Capa `api` con latencia, carga y error | T8, T9 |
| Build y tests sin errores | puertas comunes, T1 |
| Teclado, foco, etiquetas, `aria-live` | T12, T13, T14, T16 |
| Compatibilidad nunca solo por color | T2, T14 |
| Responsive móvil → escritorio | puertas comunes, T16 |
| Interfaz en español, `lang="es"` | T1, puertas comunes |
| README completo | T17 |
| Git con commits frecuentes | T1 (un commit por tarea ✅) |

## Iteraciones (después del MVP, por prioridad)

Arrastrar y soltar con vista previa de compatibilidad · deshacer y rehacer ·
View Transitions · asistente «Mi primer huerto» · rotación por familia
botánica · PWA sin conexión · compartir e imprimir · tests end-to-end ·
cultivos que ocupan varias celdas (calabacín, calabaza, melón, alcachofa).
