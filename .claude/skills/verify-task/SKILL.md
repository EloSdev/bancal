---
name: verify-task
description: >-
  Verifica con pruebas que una tarea de Bancal (docs/tareas.md) está terminada
  de verdad y que no ha roto las anteriores: tests de Vitest, build (vite +
  tsc), comprobación estática, navegador real con el MCP de Playwright sobre
  el build de la SPA, y cada criterio C<n>.<m> con su evidencia. Devuelve
  PASA / PASA CON HUECOS / FALLA. Usar SIEMPRE al acabar cada tarea, y al
  acabar cualquier cambio en src/, public/ o estilos, antes de decir "hecho",
  aunque el usuario no lo pida; y cuando pida "verifica", "comprueba",
  "¿funciona?", "¿está bien?", "verify" o "¿se ha roto algo?". No es una
  crítica de diseño (eso es design-reviewer) ni una revisión de código (eso
  es react-reviewer): aquí solo cuentan puertas medibles.
---

# Verificar una tarea de Bancal

Bancal se construye en las tareas de `docs/tareas.md`, y cada una se verifica
al terminarla, antes de empezar la siguiente. Cuando no hay tarea (un cambio
suelto), el cambio es la tarea y lo prometido es lo que se pidió.

"Hecho" no es "el código parece correcto". **Hecho es que las puertas se han
ejecutado, se ha mirado el resultado y está escrito con su evidencia.** Un
test puede pasar porque no comprueba nada; un componente puede estar bien
escrito y la cuadrícula desbordar a 360 px; un aviso puede pintarse en rojo y
no anunciarse a un lector de pantalla.

Las rutas `scripts/…` son relativas a esta skill (`.claude/skills/verify-task/`).

## 0. Quién verifica: ojos frescos

Quien ha hecho el cambio tiende a ver lo que quería hacer, no lo que hay. Si
has hecho tú el cambio y tienes la herramienta **Agent**, lanza el subagente
**`verificador`** (no tiene herramientas de edición: no puede "arreglar"
durante la verificación). Pásale:

```text
Verifica la tarea <Tn · título> de docs/tareas.md siguiendo
.claude/skills/verify-task/SKILL.md (léelo entero).
- Criterios: los C<n>.* de la tarea (léelos en docs/tareas.md)
- Tareas ✅ de las que depende: <lista, o "ninguna">
- Ficheros tocados: <lista>
- Lo que se borró o se cambió en tests y por qué: <lista o "nada">
- Informe de revisor-datos, si la tarea tiene criterios `datos`: <pegado ÍNTEGRO, con sus tablas, nunca un resumen; si hubo varias pasadas, todas; o "no aplica">
Devuelve el informe de la sección 4.
```

Si ya eres un subagente o no tienes Agent, verificas tú, con la misma regla:
**durante la verificación no se arregla nada**. Primero el informe.

## 1. Alcance

Antes de ejecutar nada, deja claro:

- **Lo prometido**: los criterios `C<n>.<m>` de la tarea en `docs/tareas.md`,
  cada uno con su etiqueta (`test`, `build`, `nav`, `leer`, `datos`). Es la
  vara de medir de la puerta 6.
- **Lo ya verificado**: las tareas ✅, sobre todo las del *Depende de*. La
  tarea nueva no puede romperlas.
- **Lo que ha cambiado**: `git status` y `git diff` (también
  `git diff --cached`). Mira en especial:
  - **Tests tocados**: un `expect` borrado o relajado, un caso eliminado, un
    `toBe` que pasa a `toBeTruthy`, un *snapshot* regenerado sin motivo.
    Debilitar un test para ponerlo en verde es FALLA salvo justificación.
  - **Contenido o requisitos quitados**: borrar un aviso, un estado de carga
    o una ruta puede poner verde una puerta sin arreglar nada.
- **Si toca interfaz**: si la tarea tiene criterios `nav` o cambia algo en
  `src/pods`, `src/scenes`, `src/routes`, `src/common` o los estilos, la
  puerta 4 aplica. Una tarea solo de `core/` no necesita navegador.

## 2. Las puertas, en orden

Usa una carpeta temporal fuera del proyecto (el scratchpad) como `<tmp>`.

### Puerta 1 · Tests

```powershell
npm test
```

Pasa si sale con 0 y ningún test está en `skip`/`only`/`todo` nuevo. Anota
cuántos tests y ficheros. Para cada criterio con etiqueta `test`, localiza el
test que lo cubre y ejecútalo solo:

```powershell
npx vitest run <ruta-del-test> -t "<nombre del test>"
```

Comprueba que **existe** y que **pasa**, y lee su cuerpo: si no comprueba lo
que dice el criterio (un `expect` trivial, un mock que devuelve la respuesta
esperada), el criterio no tiene evidencia.

### Puerta 2 · Build

```powershell
npx vite build --outDir <tmp>/dist --emptyOutDir
npx tsc --noEmit
```

Por separado y en este orden: el plugin del router genera
`src/routeTree.gen.ts` durante `vite build` y `tsc` lo necesita. No uses
`npm run build -- --outDir …`: el argumento acabaría en `tsc`. Nunca
construyas en el `dist/` del proyecto. Pasa si ambos salen con 0 y sin
errores. Si falla, no sigas con el navegador: FALLA con la salida. Si no hay
`node_modules`, `npm install` primero y apúntalo.

### Puerta 3 · Comprobación estática

```powershell
node .claude/skills/verify-task/scripts/check-estatico.mjs .
```

Revisa Tailwind v4, `index.html` (`lang="es"`, viewport, título), tokens
(nada de colores a pelo fuera de `@theme`), `motion-safe:`, foco, capas
(pods que no se importan entre sí, pods solo por su `index.ts`, `core/` sin
React salvo `hooks.ts` y `core/router/`), `key` por índice, `react-router`, tests aislados o
desactivados y elementos con clic que no son botones. Cada `[FALLA]` cuenta.
Cada `[AVISO]` se mira y se decide; un falso positivo se justifica en el
informe, nunca se "arregla" el código para callar al script.

### Puerta 4 · Navegador real (si toca interfaz)

1. **Sirve el build** de la puerta 2, en segundo plano:
   `node .claude/skills/verify-task/scripts/servir.mjs <tmp>/dist`.
   Elige un puerto libre y hace *fallback* de SPA (las rutas profundas
   devuelven `index.html`). Apunta la URL y el `PID`. Al navegar, confirma que
   el `<title>` es el de Bancal.
2. **Herramientas**: MCP `playwright` (`browser_navigate`, `browser_snapshot`,
   `browser_click`, `browser_type`, `browser_fill_form`, `browser_press_key`,
   `browser_resize`, `browser_evaluate`, `browser_take_screenshot`,
   `browser_wait_for`, `browser_console_messages`, `browser_emulate_media`,
   `browser_run_code_unsafe` para el lote del paso 5).
   Si no está disponible, la puerta 4 queda **NO COMPROBADA** (nunca PASA).
3. **Estado de partida conocido**: los datos viven en `localStorage`. Antes
   de empezar, `browser_evaluate(() => localStorage.clear())` y recarga; si
   el criterio necesita bancales, créalos **por la interfaz** (así también se
   prueba el flujo) o siémbralos con `evaluate` y dilo en el informe.
4. **Modo demo (T22)**: por defecto la capa `api` responde al instante. Para
   comprobar estados de carga o de error, abre la app con `?lento` (400 ms por
   llamada) o `?fallo` (la primera llamada de cada operación falla); el modo
   dura la sesión. Tras navegar o guardar, espera con `browser_wait_for` a
   que desaparezca «Cargando…» o aparezca el contenido esperado; no midas un
   estado intermedio.
5. **Cada ruta que toca la tarea, en 360×800 y 1440×900** (y 768×1024 si
   hay rejillas que cambian de columnas), **en un solo lote**:
   ```powershell
   node .claude/skills/verify-task/scripts/preparar-lote.mjs <url> /ruta1 /ruta2 --anchos 360,1440
   ```
   y después `browser_run_code_unsafe({ filename: ".playwright-mcp/lote.js" })`.
   Para cada ruta × ancho pasa la sonda (`scripts/sonda-pagina.js`:
   desbordamiento, contraste medido de cada texto, encabezados, imágenes,
   interactivos sin nombre o de menos de 24 px), saca una captura a
   `.playwright-mcp/lote-<ruta>-<ancho>.png`, escucha consola, errores y
   respuestas ≥ 400, y repite con movimiento reducido (paso 9). Devuelve los
   problemas agrupados. La sonda no pasa por tu contexto: no la pegues en
   `browser_evaluate` salvo para medir un estado concreto tras interactuar.
   - **Mira las capturas** (Read de los `.png`). La sonda no ve un
     solapamiento, un texto cortado o una celda deformada; tus ojos sí. Las
     capturas van a `.playwright-mcp/` (git la ignora; el MCP de Playwright
     solo puede escribir dentro del proyecto, no en el scratchpad), salvo
     que se pidan para el README.
   - Si una pantalla necesita datos o una interacción previa (un bancal
     creado, un formulario abierto), prepárala a mano y pasa la sonda con
     `browser_evaluate` en ese estado; el lote solo navega a URLs.
   - **Enlace profundo**: navega directamente a la URL con sus *search
     params* (`/cultivos?sol=pleno`, `/bancales/1?mes=5`) y comprueba que
     el estado sale de la URL.
6. **Consola**: errores de JS, avisos de React (`key`, `act`, hidratación) o
   404 de recursos en `browser_console_messages` son FALLA. Un 404 de
   `favicon.ico` es solo un aviso.
7. **Teclado** (a 1440): recorre con Tab lo interactivo de la pantalla y, si
   la tarea lo pide, las flechas, Intro y Supr del editor. Tras cada tecla,
   **espera ~300 ms** (`browser_wait_for` con `time: 0.3`: los enlaces y
   botones tienen transiciones de color de 150 ms y medir antes da un color
   intermedio) y ejecuta `scripts/sonda-foco.js`: cada elemento enfocado
   debe tener `visible: true`. Comprueba también **adónde va el foco** tras abrir o
   cerrar algo, borrar o guardar.
8. **Anuncios**: si la tarea promete `aria-live`, lee el texto de la región
   antes y después de la acción (`browser_evaluate`) y apúntalo.
9. **Movimiento reducido**: el lote ya lo hace (`animacionesConReduce`
   tiene que estar vacío, `reducedMotionAlEmpezar` tiene que ser `false`) y
   deja la emulación quitada. Para un estado preparado a mano:
   `browser_emulate_media` con `reducedMotion: "reduce"`, recarga, sonda, y
   vuelve a quitar la emulación (el navegador es compartido).
10. **Contraste que la sonda no puede medir** (`revisarAMano`): míralo en la
    captura y dilo. Los iconos SVG sí los mide (`noTexto`, mínimo 3:1, el
    color de su primera figura contra el fondo efectivo; en el lote salen
    como `contrasteIcono`). Para la evidencia sin problemas, cita las cifras
    de `pantallas` del lote (textos e iconos revisados, lado menor mínimo de
    los interactivos).
11. **Tokens que no se usan no existen en el navegador**: Tailwind v4 solo
    emite las variables de `@theme` que alguna clase usa, así que
    `getComputedStyle(:root).getPropertyValue("--color-tierra")` puede salir
    vacío. Para medir contra un token sin usar, toma su valor de
    `src/styles.css`.

### Puerta 5 · Lighthouse (cuando un criterio lo pide)

```powershell
npx --yes lighthouse <url> --only-categories=accessibility --chrome-flags="--headless=new" --output=json --output-path=<tmp>/lh.json --quiet
```

Lee `categories.accessibility.score` del JSON. Si no se puede ejecutar: NO
COMPROBADA, con el motivo.

### Puerta 6 · Lo prometido, y sin trampas

- **Cada criterio, con su evidencia** según su etiqueta:
  - `test` → el nombre del test, que pasa, y una línea de qué comprueba.
  - `build` → el código de salida de la puerta 2.
  - `nav` → un valor de `browser_evaluate`, un texto del *snapshot* o lo que
    se ve en una captura. Ejemplo: "C5.1 4 × 3 celdas" →
    `document.querySelectorAll('[role=gridcell]').length` da 12.
  - `leer` → el fichero y la línea donde está.
  - `datos` → el informe del subagente `revisor-datos`, **íntegro** (las
    tablas dato → fuente → veredicto). El verificador no contrasta fuentes:
    si no te lo han pasado, o solo te han pasado un resumen, el criterio
    queda NO COMPROBADO. Si es un muestreo, la muestra la saca quien lanza
    al revisor con un comando reproducible
    (`(Get-Content public\crops.json -Raw | ConvertFrom-Json).id | Get-Random -Count 5`)
    y el comando y su resultado van a la línea **Verificación**.
  Lo que no tiene evidencia no está hecho.
- **Sin regresiones**: vuelve a comprobar los criterios de las tareas ✅ que
  la tarea nueva puede afectar (el mismo pod, los tokens, el layout, la capa
  `api`, el modelo). Los tests ya cubren las de `core/`; las de interfaz se
  repasan en el navegador. Si una tarea que pasaba ahora falla, la nueva
  **FALLA**, aunque sus criterios pasen.
- **Atajos que maquillan en vez de arreglar** (FALLA salvo justificación):
  tests debilitados (ver §1); `overflow-x-hidden` en `html`/`body` cuando la
  sonda marca `tapadoConOverflowHidden`; `outline-none` sin sustituto; un
  aviso que solo se distingue por el color; `@ts-ignore` o `as any` para
  callar a tsc; contenido requerido escondido con `hidden` sin alternativa.

### Limpieza (antes del informe)

1. `browser_emulate_media` con `reducedMotion: null`, `localStorage.clear()`
   y `browser_close`.
2. Para el servidor: `Stop-Process -Id <PID>`.
3. `.playwright-mcp/` es basura de la herramienta (está en `.gitignore`): no
   cuenta como cambio.

## 3. Veredicto

- **FALLA** si cualquier puerta ejecutada falla: un test, el build, un
  `[FALLA]` estático, un error de consola, scroll horizontal, contraste por
  debajo del mínimo, foco invisible, animación con movimiento reducido,
  regresión en una tarea anterior, criterio sin evidencia o atajo sin
  justificar.
- **PASA** solo si las puertas que aplican se han ejecutado y pasado.
- **PASA CON HUECOS** si lo ejecutado pasa pero algo quedó NO COMPROBADO
  (navegador no disponible, `datos` sin informe…): di qué y por qué. Nunca
  pongas ✅ a algo que no se ha ejecutado.

## 4. Informe

Siempre con esta forma:

```markdown
## Verificación · Bancal · <Tn título> — ✅ PASA | ⚠️ PASA CON HUECOS | ❌ FALLA

| Puerta | Resultado | Evidencia |
|---|---|---|
| 1 · Tests | ✅ | 42 tests en 9 ficheros; C6.5 «escenario de la demo» pasa |
| 2 · Build | ✅ | vite build 0 · tsc 0 |
| 3 · Estática | ✅ | 0 fallos, 1 aviso (justificado abajo) |
| 4 · Navegador 360 / 1440 | ✅ | scrollWidth = innerWidth; 0 fallos de contraste (63 textos) |
| 4 · Teclado y foco | ✅ | 14/14 con foco visible; tras borrar, el foco va a «Nuevo bancal» |
| 4 · Movimiento reducido | ✅ | 0 animaciones en marcha |
| 5 · Lighthouse | — | no lo pide ningún criterio |
| 6 · Lo prometido | ✅ | C14.1 … · C14.2 … · C14.3 región aria-live: «1 aviso: …» |
| 6 · Sin regresiones | ✅ | T12–T13: sus criterios siguen pasando |

### Qué hay que arreglar
- <qué> — <dónde (fichero:línea, ruta o selector)> — <evidencia>

### Avisos (mirar, no bloquean)
- …

### No comprobado
- <puerta o criterio> — <por qué>
```

## 5. Después del informe

Quien construye (no el verificador) actualiza `docs/tareas.md`: estado ✅ o
❌ y la línea **Verificación** con fecha, veredicto y un resumen de una
línea (`2026-11-08 · ✅ PASA · 42 tests, 0 fallos estáticos`). Una tarea ❌
no deja empezar la siguiente. Con la tarea ✅, se hace su commit.

Si eres el agente principal y el veredicto es FALLA: arregla lo que se
indica y **vuelve a verificar** desde la puerta que falló, con un
`verificador` nuevo. Si tras dos vueltas sigue fallando, para y cuéntale al
usuario qué queda y por qué. Al usuario dale el informe tal cual: con
evidencias, sin resumirlo en "todo bien".
