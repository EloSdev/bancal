---
name: brief-grill
description: Entrevista al usuario — una pregunta cada vez, con opciones y recomendación — hasta tener la dirección visual de Bancal (una app, no una landing) y la deja en docs/brief.md. Usar en la tarea T2 de docs/tareas.md, cuando falte docs/brief.md, o cuando el usuario quiera replantear el aspecto de la app ("quiero cambiar el estilo", "no me convence cómo se ve").
origin: lemoncode
license: MIT (Lemoncode en LICENSE; la de grill-me, de Matt Pocock, en LICENSE-grill-me)
attribution:
  - source: mattpocock/skills — grill-me
    author: Matt Pocock
    url: https://github.com/mattpocock/skills
    license: MIT
    copyright: Copyright (c) 2026 Matt Pocock
    relationship: derived-from
    note: la entrevista rama a rama, el modo co-creación (preguntas con propuestas y pros/contras) y el tono que aprieta si las respuestas son flojas. Se cambia el PRD técnico por un brief de diseño
---

# Brief grill (Bancal)

Antes de tocar `@theme` o maquetar una pantalla, **entrevistas al usuario**
hasta tener claro **cómo se va a ver y a sentir Bancal**. Sin esto, la IA
hace la app de siempre: gris, con tarjetas y un acento violeta.

## 0. Lo que ya está decidido (no lo preguntes)

Lee antes `docs/guia-proyecto.md` y `docs/tareas.md`. Ya están fijados:
para quién (gente sin experiencia, balcón o huerto municipal), las
pantallas y rutas (§2), el momento estrella de la demo, el stack (React +
Tailwind v4) y los mínimos de accesibilidad (§4). Si una respuesta del
usuario los contradice, señálalo; no los vuelvas a preguntar.

## 1. Cómo preguntar

- **Una pregunta cada vez.** Nunca una lista.
- **Siempre con opciones** (2–4), cada una con su porqué, y **cuál
  recomiendas**. Ejemplo:
  > ¿Cómo se dibujan los cultivos en la cuadrícula?
  > A) Emoji del sistema — cero trabajo, pero cambian según el dispositivo y se ven "de chat".
  > B) Juego de iconos SVG propio, de trazo — coherente y nítido; hay que dibujar o elegir ~24.
  > C) Ilustraciones pequeñas a color — mucha personalidad; mucho trabajo y difícil a 44 px.
  > Recomiendo **B**: es lo que hace que no parezca una plantilla y aguanta tamaños pequeños.
- Al menos una opción **se sale del molde** de las apps de huerto que hay
  (no todo es "verde menta y tarjetas redondeadas"). Puede no ser la
  recomendada, pero tiene que estar sobre la mesa.
- Si dice «no sé» o «me da igual», **propón tú** y sigue. Si contesta muy por
  encima, aprieta con una pregunta más concreta.
- Si dice «suficiente» o «decide tú», cierra con lo que tengas y marca lo que
  has decidido tú.

## 2. Qué preguntar (en este orden)

1. **Personalidad**: tres adjetivos (¿cuaderno de campo artesanal?,
   ¿herramienta precisa de ingeniería?, ¿juguete amable?).
2. **Dirección visual** — la pregunta más importante. Propón **tres
   direcciones distintas de verdad** siguiendo `design-taste-frontend`,
   cada una con: paleta (superficie, tinta, acento y cómo encajan los tres
   colores de compatibilidad), pareja de fuentes y cómo se vería **el
   editor** (no una cabecera de landing). Nada de violeta.
3. **Los cultivos en pantalla**: emoji, iconos SVG o ilustraciones (ver el
   ejemplo de arriba); y cómo se ve una celda vacía, una ocupada y una con
   aviso.
4. **El bancal**: ¿madera vista desde arriba, plano técnico con cotas,
   papel cuadriculado…? Es lo que más se ve de la app.
5. **Móvil**: cómo se reparte el editor en 360 px (paleta en banda fija
   abajo, panel de avisos desplegable…) y qué pasa si la cuadrícula no cabe
   con celdas de 44 px.
6. **El detalle memorable**: una cosa por la que se recordará la app. La
   guía ya apunta al **huerto creciendo mes a mes**; propón dos o tres
   formas de hacerlo memorable (las plantas crecen en la celda, la luz
   cambia con la estación, una cosecha que "salta"…).
7. **Movimiento**: nada, sutil o protagonista solo en la temporada.
8. **Tono de los textos**: tú o usted, técnico o cercano, con o sin humor
   (los avisos explican; no deberían sonar a error de sistema).

## 3. Cerrar: `docs/brief.md`

```markdown
# Brief: Bancal

## Personalidad
## Dirección visual
- Paleta: superficie, tinta, tinta suave, acento; favorable / desfavorable / neutro
- Tipografía: títulos y texto (solo los nombres; se instalan con `@fontsource-variable`)
- El editor: cómo se ve el bancal y las celdas
## Cultivos en pantalla
## Móvil
## Detalle memorable
## Movimiento
## Tono de los textos
## Decidido por la IA (revísalo)
- …
```

Después, **enséñale al usuario el resumen en 5–6 líneas** y pregunta si
seguimos. Cuando diga que sí, el siguiente paso es el resto de T2: los
tokens en `@theme` con `tailwind-design-system`.
