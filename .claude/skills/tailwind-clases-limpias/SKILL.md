---
name: tailwind-clases-limpias
description: Reglas de Lemoncode para escribir Tailwind CSS v4 sin "churros" de clases en los componentes React de Bancal — tokens en @theme, extraer a componente (y cuándo a @utility), estilos base en @layer base, orden de clases y comprobación final. Usar siempre que se escriba o revise className en un .tsx o el CSS de src/.
origin: lemoncode
license: MIT (ver LICENSE de esta carpeta)
attribution:
  - source: wshobson/agents — tailwind-design-system
    author: Seth Hobson
    url: https://github.com/wshobson/agents/tree/main/plugins/frontend-mobile-development/skills/tailwind-design-system
    license: MIT
    copyright: Copyright (c) 2024 Seth Hobson
    relationship: inspired-by
    note: la jerarquía de tokens (marca → semántico → componente) y el uso de @theme con OKLCH
---

# Tailwind v4 sin churros (React)

Tailwind es declarativo y la IA lo escribe bien, pero tiende a dos vicios:
**mezclar la versión 3 con la 4** y **amontonar clases** hasta que no se lee.
Esta skill fija las reglas para evitar las dos cosas en Bancal. Complementa a
`tailwind-design-system` (el *cómo* de v4); aquí va el *cuánto*.
`check-estatico` (de `verify-task`) comprueba lo mecánico.

## 1. Es Tailwind v4, no v3

| ❌ v3 (no usar) | ✅ v4 |
|---|---|
| `tailwind.config.js` | `@theme { … }` en `src/styles.css` |
| `@tailwind base; @tailwind components; …` | `@import "tailwindcss";` |
| `postcss.config.js` + `autoprefixer` | plugin `@tailwindcss/vite` en `vite.config.ts` |
| `darkMode: 'class'` | `@custom-variant dark (&:where(.dark, .dark *));` |
| `bg-opacity-50` | `bg-black/50` |
| `flex-shrink-0`, `flex-grow` | `shrink-0`, `grow` |
| `shadow-sm` / `rounded-sm` como "pequeño" | en v4 `shadow-xs` / `rounded-xs` son los pequeños |

## 2. Primero los tokens, luego las clases

Todo color, fuente, radio o sombra con significado va a `@theme` con nombre
**semántico**, y en el JSX solo se usa ese nombre.

```css
@theme {
  --color-superficie: oklch(97% 0.01 95);
  --color-tinta: oklch(25% 0.02 140);
  --color-favorable: oklch(55% 0.14 145);
  --color-desfavorable: oklch(52% 0.19 28);
  --font-titulos: "…", serif;
}
```

```tsx
// ✅
<h1 className="font-titulos text-tinta">…</h1>
// ❌ valores mágicos
<h1 className="font-['Fraunces'] text-[#2b3a2a]">…</h1>
```

Valores arbitrarios (`[…]`) solo para casos de **una vez** que no son parte
del sistema. Un color, una sombra o un brillo **nunca** es "de una vez": va a
`@theme`, aunque se use en un solo sitio. Esto vale también fuera de
`className`: `fill`, `stroke` y `style={{…}}` usan `currentColor` o
`var(--color-…)`, no el hex.

## 3. Límite de clases y cuándo extraer

- **Más de ~12 utilidades en un elemento** → algo sobra o hay que extraer.
- **La misma lista de clases repetida 2+ veces** → extraer. Nunca copiar y
  pegar.
- **Cómo extraer**, por orden de preferencia:
  1. **Componente React**: el sitio natural. `<Boton variante="primario">`,
     `<Chip>`, `<Celda>`. Las clases viven una vez dentro del componente;
     las variantes, con un objeto de clases por variante (sin librerías
     nuevas tipo `cva` o `clsx` salvo que se justifique).
  2. **`.map`** si son elementos iguales con distinto dato.
  3. **`@utility`** para un patrón pequeño y transversal sin marcado propio
     (`@utility anillo-foco { … }`).
- **`@layer base`** con `@apply` para los estilos por defecto de elementos
  (`h1`–`h3`, `button`, `input`, `a`, `:focus-visible`), como en
  `lab-react`. **No** uses `@layer components` + `@apply` para "limpiar" un
  componente: en React, eso es un componente.

## 4. Estados con variantes, no con JS ni clases duplicadas

- Padre–hijo: `group` / `group-hover:`; hermanos: `peer`.
- Estado del dato: atributos `data-*` / `aria-*` y su variante
  (`data-[compat=desfavorable]:border-desfavorable`,
  `aria-[current=page]:font-semibold`, `aria-pressed:bg-acento`). Mejor que
  concatenar clases con ternarios en el `className`.
- Contenedor: `@container` + `@sm:`… en el editor, para que la cuadrícula se
  adapte a su caja y no a la ventana.
- **`hover:` no existe en móvil** (en v4 va dentro de `@media (hover: hover)`).
  Todo efecto de hover lleva su pareja con `focus-visible:` (teclado) y
  `active:` (dedo).
- Transiciones con propiedades explícitas (`transition-colors`,
  `transition-[transform,background-color]`); nunca `transition-all`.
- Lo que se mueve, con `motion-safe:`.

## 5. Orden de las clases

1. Layout y posición (`relative`, `grid`, `flex`, `col-span-2`)
2. Caja (`size-*`, `w-*`, `p-*`, `gap-*`)
3. Tipografía (`font-*`, `text-*`, `leading-*`)
4. Color y fondo (`bg-*`, `text-<color>`, `border-*`)
5. Efectos (`shadow-*`, `rounded-*`, `opacity-*`, `transition-*`)
6. Variantes de estado (`hover:`, `focus-visible:`, `data-*:`, `aria-*:`)
7. Responsive y contenedor al final (`md:`, `@sm:`, `dark:`)

Si el proyecto tiene Prettier, `prettier-plugin-tailwindcss` ordena solo.

## 6. Accesibilidad mínima

- Botones de solo icono: `aria-label`.
- **Zona para pulsar**: 24 px como mínimo en todo lo interactivo (la sonda
  de `verify-task` lo mide) y **44 px** en lo que se toca con el dedo a
  menudo: celdas de la cuadrícula en móvil, botones de la paleta.
- Foco visible siempre (estilo `:focus-visible` en `@layer base`); nunca
  `outline-none` sin sustituto.
- Contraste AA del texto contra su fondo real (cuidado con `text-tinta/60`).
- La compatibilidad nunca solo con color.
- **Un solo `aria-current="page"`** por pantalla (la navegación). Para el
  elemento activo de otra lista, `aria-current="true"` o `aria-pressed`.
- **`sr-only` dentro de un contenedor con scroll** (`overflow-auto`): el
  contenedor necesita `relative`, o el `sr-only` se escapa y estira la
  página.

## 7. Comprobación antes de dar por terminado

- [ ] Sin `tailwind.config.*` ni `@tailwind`.
- [ ] Ningún color en hex/rgb/oklch dentro de clases, `style` o SVG: todo
      sale de `@theme`.
- [ ] Ningún elemento pasa de ~12 utilidades sin motivo.
- [ ] Ninguna lista de clases repetida: extraída a componente, `.map` o
      `@utility`.
- [ ] Clases en el orden de la sección 5.
- [ ] Cada `hover:` tiene su pareja `focus-visible:` y `active:`; ningún
      `transition-all`.
- [ ] Zonas para pulsar ≥ 24 px (≥ 44 px en celdas y paleta en móvil).
- [ ] `check-estatico` sin `[FALLA]` de tokens, movimiento o foco.
