---
name: frontend-a11y
description: >-
  Patrones de accesibilidad en React para Bancal: formularios con etiquetas
  y errores enlazados, HTML semántico, ARIA solo cuando hace falta,
  navegación por teclado (la cuadrícula del editor con roving tabindex),
  gestión del foco, avisos anunciados con aria-live, compatibilidad nunca
  solo por color y movimiento reducido. Usar al crear o revisar formularios,
  la cuadrícula del editor, el panel de avisos, el deslizador de meses,
  diálogos de confirmación o cualquier elemento interactivo.
---

# Accesibilidad en Bancal

Basada en `frontend-a11y` de ECC (comunidad, MIT, ver `LICENSE`), adaptada a
las piezas de Bancal. La guía §4 fija el mínimo: **todo usable con teclado,
foco visible, etiquetas en los campos, avisos anunciados con `aria-live` y
la compatibilidad nunca comunicada solo con color.**

## 1. Formularios (alta y edición de bancal)

```tsx
<label htmlFor={id}>Ancho (cm)</label>
<input
  id={id}
  type="number"
  inputMode="numeric"
  aria-invalid={mostrarError}
  aria-describedby={mostrarError ? `${id}-error` : undefined}
/>
{mostrarError && <p id={`${id}-error`}>{error}</p>}
```

- Cada campo con `<label htmlFor>` (ids con `useId()`). Un `placeholder` no
  sustituye a la etiqueta.
- El error enlazado con `aria-describedby` y `aria-invalid`.
- Obligatorio: `required` y el asterisco con `aria-hidden="true"`.
- Unidades en la etiqueta («Ancho (cm)», «Horas de sol al día»).
- Al enviar con errores, el foco va al primer campo con error.

## 2. HTML semántico antes que ARIA

- Lo que se pulsa es un `<button type="button">`; lo que navega, un `<Link>`.
  Nunca `<div onClick>` (lo marca `check-estatico`).
- Un `<h1>` por pantalla, sin saltos de nivel. Las regiones (`<nav>`,
  `<main>`, `<aside>` del panel de avisos) con su encabezado o
  `aria-labelledby`.
- Listas reales (`<ul>`) para el catálogo, los bancales y los avisos.
- **ARIA mal puesto es peor que nada**: `aria-label` en un `<div>` sin rol no
  hace nada; `aria-hidden` en algo enfocable atrapa al usuario.

## 3. La cuadrícula del editor (T13)

Es la pieza más delicada. Patrón **grid con *roving tabindex***: una sola
celda está en el orden de tabulación (`tabIndex={0}`), las demás con
`tabIndex={-1}`, y las flechas mueven el foco.

```tsx
<div role="grid" aria-label={`Bancal ${bancal.nombre}, ${filas} filas por ${columnas} columnas`}>
  {filasDeCeldas.map((fila, f) => (
    <div role="row" key={`fila-${f}`}>
      {fila.map((celda) => (
        <div role="gridcell" key={celda.clave}>  {/* "f-c", nunca el índice */}
          <button
            type="button"
            tabIndex={celda.clave === activa ? 0 : -1}
            aria-label={`Fila ${celda.fila + 1}, columna ${celda.columna + 1}: ${celda.cultivo?.nombre ?? "vacía"}${celda.aviso ? `, ${celda.aviso}` : ""}`}
            onKeyDown={moverConFlechas}
            onClick={colocar}
          />
        </div>
      ))}
    </div>
  ))}
</div>
```

- La celda (`gridcell`) contiene un `<button>` nativo: así Intro y Espacio
  ya disparan el clic y no hay que reimplementarlos. No pongas
  `role="gridcell"` en el propio botón: le quitarías su semántica.
- Flechas: mueven la celda activa (sin salir de la cuadrícula) y llaman a
  `.focus()` sobre el botón de la nueva. Inicio / Fin: primera y última de la fila.
- Intro o Espacio: coloca el cultivo elegido. Supr o Retroceso: lo quita.
- Tab entra en la cuadrícula por la celda activa y sale al siguiente bloque
  (no recorre las celdas una a una).
- El **nombre accesible de la celda** dice todo lo que el color dice: el
  cultivo y, si lo hay, el aviso («desfavorable con hinojo»).
- La paleta de cultivos: un grupo de botones con `aria-pressed` en el
  elegido, o un `radiogroup`.

## 4. Compatibilidad: nunca solo color

Cada estado (favorable, desfavorable, neutro) lleva **color + icono +
texto**: el icono con forma distinta (✓, ✕, —) y el texto en el nombre
accesible o en el panel. Prueba de fuego: en escala de grises se distingue
igual. Los iconos decorativos, con `aria-hidden="true"`; el significado va
en texto.

## 5. Avisos que se anuncian (`aria-live`)

```tsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {resumenAvisos}
</div>
```

- La región **existe desde el principio** (vacía) y se cambia su texto; si
  se monta junto con el mensaje, muchos lectores no la anuncian.
- `polite` para los avisos del editor y el número de resultados del
  catálogo; `role="alert"` solo para errores de carga o de guardado.
- Anuncia un **resumen del cambio** («Hinojo: desfavorable con tomate» o
  «Sin avisos»), no la lista entera en cada tecla.
- El panel visible de avisos es aparte: una lista normal con la
  explicación de cada aviso.

## 6. Gestión del foco

- **Tras borrar un bancal**: el foco va al siguiente de la lista o, si no
  queda ninguno, al botón «Crear mi primer bancal». Nunca se pierde en
  `<body>`.
- **Diálogo de confirmación**: usa `<dialog>` nativo con `showModal()`
  (atrapa el foco y cierra con Escape). Al cerrar, el foco vuelve a quien lo
  abrió.
- **Al cambiar de ruta**: el foco al `<h1>` de la pantalla nueva
  (`tabIndex={-1}` y `.focus()` al montar) para que el lector anuncie dónde
  está.
- Foco **siempre visible**: estilo `:focus-visible` en `@layer base`;
  `outline-none` solo con un sustituto.

## 7. El deslizador de meses (T15)

`<input type="range" min={1} max={12}>` nativo, con `<label>` y
`aria-valuetext={nombreDelMes}` para que se anuncie «mayo» y no «5». Las
flechas ya funcionan de serie.

## 8. Movimiento

- En Tailwind, lo que se mueve va con `motion-safe:` (o se anula con
  `motion-reduce:`). Preferible en CSS antes que un hook de JS.
- La animación de crecimiento de la temporada no transmite información que
  no esté también en el texto del estado.

## 9. Lista antes de dar por hecho un componente interactivo

- [ ] Cada campo con `<label>`; errores con `aria-describedby` / `aria-invalid`
- [ ] Nada clicable que no sea `<button>` o `<Link>`
- [ ] Botones de solo icono con `aria-label`
- [ ] Recorrido completo con teclado, y el foco va a un sitio lógico tras cada acción
- [ ] Los cambios importantes se anuncian (`aria-live` / `role="alert"`)
- [ ] La compatibilidad se entiende sin color
- [ ] Lo animado respeta `prefers-reduced-motion`

Se comprueba de verdad en el navegador con `verify-task` (sondas de foco y
contraste, teclado) y en los tests con las aserciones de `react-testing` §7.
