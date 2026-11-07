---
name: plan-tasks
description: >-
  Mantiene el plan de Bancal en docs/tareas.md: tareas pequeñas y ordenadas,
  cada una con criterios comprobables y su etiqueta de cómo se comprueban
  (test, build, nav, leer, datos), dependencias y tabla de cobertura. Es el
  plan que se construye tarea a tarea y se verifica con verify-task. Usar
  cuando haya que añadir, partir o reordenar tareas, al pasar del MVP a una
  iteración (arrastrar y soltar, deshacer…), o cuando el usuario pida
  "divide esto en tareas", "haz el plan", "¿por dónde sigo?" o "qué falta
  por hacer".
---

# Plan de tareas (Bancal)

Bancal se construye en **tareas pequeñas que se verifican una a una**
(`verify-task`) antes de pasar a la siguiente. Esta skill mantiene ese plan:
qué tareas, en qué orden y, sobre todo, **cómo se sabrá que cada una está
terminada**. Un criterio que no se puede comprobar no sirve: si no se puede
medir, `verify-task` no puede decir PASA ni FALLA.

## 1. Qué lees

- `docs/tareas.md`: el plan vigente. **No lo rehagas**: añade o ajusta
  tareas y respeta las ✅ (si una ✅ cambia de alcance, vuelve a ⬜ y dilo).
- `docs/guia-proyecto.md`: alcance (§2), dominio (§3), stack y calidad (§4).
  Es la fuente de los requisitos.
- `docs/brief.md` cuando exista: la dirección visual, el móvil y el detalle
  memorable también son requisitos.

## 2. Cómo dividir

- **Una tarea = una pieza que se puede comprobar sola**: una función de
  dominio con sus tests, la capa `api`, una pantalla, una interacción del
  editor. Si no se puede verificar sin hacer otra cosa antes, va después o
  se junta.
- **Tamaño**: de 3 a 8 criterios. Con más, pártela; con menos, quizá se
  junta con la de al lado.
- **Orden**, de lo que otros necesitan a lo que necesita a otros:
  1. Cimientos: proyecto base, dirección visual y tokens.
  2. Dominio en `core/` con TDD (modelo → datos → funciones puras → `api`).
  3. Pantallas, en el orden del flujo de la demo.
  4. Cierre: repaso de responsive y accesibilidad, README y demo.
  Una iteración nueva (arrastrar y soltar, deshacer…) va en su propia fase,
  con el mismo orden: primero su lógica en `core/`, luego la interfaz.
- **Dependencias explícitas** (`Depende de: T6, T13`): así `verify-task`
  sabe qué tareas anteriores tiene que repasar.

## 3. Cómo escribir un criterio

Cada criterio es **una cosa observable**, lleva **cómo se comprueba** y
**de dónde sale**:

| ❌ No vale | ✅ Vale |
|---|---|
| La vecindad funciona | `vecinos()` devuelve 3 en una esquina, 5 en un borde y 8 en el centro — `test` — guía §3 |
| El catálogo filtra bien | Los filtros de sol y temporada actualizan la URL; recargar mantiene el resultado — `nav` — guía §2 |
| Es accesible | Tab entra en la cuadrícula, las flechas mueven el foco, Intro coloca y Supr quita — `nav` — guía §4 |
| Los datos son buenos | 5 cultivos al azar contrastados con su fuente — `datos` — guía §3 |
| Queda bonito | (no es un criterio: va al `design-reviewer`) |

Etiquetas (las mismas de la cabecera de `docs/tareas.md`):

- `test` — un test de Vitest; su nombre llevará el id del criterio
  (`it("C5.2 · …")`, ver `tdd-core`).
- `build` — `vite build` + `tsc` sin errores.
- `nav` — navegador real con Playwright: `evaluate`, *snapshot*, teclado o
  captura.
- `leer` — un fichero y algo concreto en él.
- `datos` — contraste con fuentes, lo hace el agente `revisor-datos`.

**No repitas lo común.** Las *puertas comunes* de la cabecera (build y
tests en verde, sin errores de consola, sin scroll horizontal a 360 px,
foco visible, español, sin regresiones) se comprueban en todas las tareas.
En cada tarea solo va lo propio.

## 4. Forma de cada tarea

```markdown
## T9 · Catálogo — ⬜
**Ruta:** `/cultivos?q=&sol=&temporada=`
**Depende de:** T2, T8
**Criterios:**
- C9.1 … — `nav` — guía §2
- C9.3 Parámetros inválidos se ignoran sin romper la página — `nav` + `test`
**Verificación:** —
```

- Estados: ⬜ pendiente · 🔄 en curso · ✅ verificada · ❌ falla.
- La línea **Verificación** la rellena quien construye cuando `verify-task`
  da su veredicto: `2026-11-08 · ✅ PASA · 42 tests, 0 fallos estáticos`. El
  verificador no edita ficheros.
- Con la tarea ✅, su commit.

## 5. Cobertura e iteraciones

- La tabla **Cobertura** del final relaciona cada requisito (cada fila de
  la guía §2, los conceptos de §3, cada criterio de calidad de §4, el
  detalle memorable del brief) con sus tareas. Si una fila queda vacía,
  falta una tarea.
- La lista **Iteraciones** guarda lo que viene después del MVP, por
  prioridad. Pasar una iteración al plan = crear su fase con tareas y
  criterios.

## 6. Cerrar

Enséñale al usuario los títulos de las tareas nuevas o cambiadas (con
cuántos criterios tiene cada una) y la cobertura afectada, y pregunta si
arrancamos o quiere mover algo. No se construye nada hasta que diga que sí.
