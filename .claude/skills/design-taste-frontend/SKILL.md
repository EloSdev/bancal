---
name: design-taste-frontend
description: >-
  Criterio de diseño anti-plantilla para la interfaz de Bancal (una app de
  herramienta, no una landing): el sujeto real en pantalla (el bancal a
  escala, los cultivos), un solo sistema (botones, tarjetas, radios,
  enlaces), bordes alineados, textos que nombran cosas, densidad de app,
  estados de carga / error / vacío diseñados, microinteracciones discretas y
  los detalles que pulen (radios concéntricos, números tabulares, zonas de
  toque). Usar al diseñar o construir cualquier pantalla o componente
  visual, al traducir docs/brief.md a interfaz, al pulir, y cuando algo
  "parece genérico", "de plantilla" o "hecho por IA". La revisión con ojos
  frescos la hace el agente design-reviewer con esta misma vara.
---

# Gusto para la interfaz de Bancal

Basada en **tasteskill 2.5.0** (Leonxlnx, MIT, ver `LICENSE`) y en
**make-interfaces-feel-better** de ECC (MIT, ver `LICENSE-ecc`), recortadas
y adaptadas. tasteskill está pensada para webs de empresa (una sección por
pantalla, fotografías, *shaders*); Bancal es una **herramienta**: se queda su
idea central —que se vea la cosa real, un solo sistema, nada de plantilla— y
se deja fuera todo lo de páginas comerciales.

**La vara**: una app que parece hecha para *este* huerto y por alguien con
oficio, no un panel genérico de componentes ni una pieza de arte. Quien abre
el editor entiende en dos segundos qué está viendo y qué puede hacer.

Orden de trabajo con las demás skills: `brief-grill` fija la dirección
(`docs/brief.md`) → `tailwind-design-system` la convierte en tokens `@theme`
→ **esta skill** guía cada pantalla → `tailwind-clases-limpias` mantiene el
código limpio → `design-reviewer` revisa con esta checklist (§9).

## 1. Reglas de la casa

Ganan a todo lo demás de esta skill.

1. **La cosa real manda.** Cada pantalla enseña el sujeto: el bancal
   dibujado **a escala** (120 × 90 cm se ve más ancho que alto), los cultivos
   con su icono y su nombre, el mes. Nada de ilustraciones de relleno,
   fotos de archivo de huertos, *heroes* decorativos ni "tarjetas de
   estadísticas" que no dicen nada.
2. **Un solo sistema.** Un par de botones (primario y secundario) más el de
   peligro, un estilo de tarjeta, una escala de radios, un aspecto de
   enlace, una escala de encabezados y dos familias tipográficas como
   mucho. Dos cajas anidadas como máximo.
3. **Bordes iguales.** Todo el contenido se alinea a un mismo contenedor y a
   sus columnas; nada se escapa por un lado ni provoca scroll horizontal.
4. **Textos que nombran cosas** (ver `ux-copy`): los títulos dicen qué hay
   («Mis bancales», «Tomate»), los botones son verbo + objeto («Crear
   bancal», «Quitar cultivo»), un dato se dice siempre con las mismas
   palabras. Nada de *lorem ipsum* ni cifras inventadas: los números salen de
   los datos.
5. **Movimiento discreto y con sentido.** Responder al puntero (hover, press)
   sí; nada que aparezca, se desvanezca o se desplace porque se hizo scroll,
   ni parallax, ni inclinaciones. Todo con `motion-safe:`. El **único
   momento** con protagonismo es el que pide el brief (el huerto creciendo
   en la temporada, T15).
6. **Nunca violeta ni lavanda** en el diseño propio (acento, fondo,
   degradado): es la firma del diseño genérico de IA. Un huerto tiene paleta
   de sobra.

## 2. Densidad de app, no de landing

- Sin "una sección por pantalla": el editor usa todo el hueco. La cuadrícula
  es la protagonista; paleta de cultivos y panel de avisos, a su lado en
  escritorio y debajo (o en una banda fija) en móvil.
- Jerarquía por tamaño, peso y espacio, no por cajas: no envuelvas cada
  bloque en una tarjeta.
- Espaciado de una escala (los tokens de Tailwind), con más aire entre
  grupos que dentro de un grupo.
- Listas (catálogo, bancales) escaneables: lo que distingue un elemento de
  otro (nombre, sol, dificultad, avisos) en la primera línea.

## 3. Estados: también son diseño

Cada vista con datos diseña **cuatro** estados, con el mismo sistema que el
contenido, no como texto suelto:

| Estado | Qué lleva |
|---|---|
| Cargando | Lo mínimo para no saltar: la estructura de la pantalla con un indicador discreto. Sin *spinners* gigantes. |
| Error | Qué ha pasado en palabras de persona y qué hacer («Reintentar»), con `role="alert"`. |
| Vacío | Una frase que explica y **la acción** que lo llena («Crear mi primer bancal»). Es la primera pantalla de quien llega: cuídala. |
| No encontrado | Dónde está y cómo volver («Ver el catálogo»). |

## 4. Compatibilidad y avisos

- Tres estados semánticos (favorable, desfavorable, neutro) con token de
  color propio, **icono de forma distinta** y texto. Prueba de fuego: en
  escala de grises se entiende igual.
- Un aviso es una recomendación, no un error del sistema: tono informativo,
  nunca bloquea ni grita (guía §3). El rojo es para lo desfavorable de
  verdad, no para decorar.
- La explicación está a un gesto (el panel de avisos o el detalle de la
  celda), no escondida en un *tooltip* que no llega con teclado.

## 5. Microinteracciones

- **Hover y press** en todo lo pulsable: cambio de fondo o sombra en hover;
  en press, `scale(0.97)` o hundimiento de 1 px, 100–150 ms.
- **Colocar un cultivo**: una respuesta corta en la celda (escala o
  aparición de 150–200 ms) que confirma la acción; quitarlo, más corto y
  más discreto que poner.
- **Transiciones con propiedades explícitas**, nunca `transition: all`
  (`transition-[transform,background-color]` en Tailwind). `will-change`
  solo si hay tirón en el primer fotograma, y nunca `all`.
- Transiciones CSS para cambios de estado (se pueden interrumpir);
  `@keyframes` solo para entradas puntuales y la animación de la temporada.
- Todo lo anterior bajo `motion-safe:`; con movimiento reducido, el estado
  final aparece sin animación y nada se queda oculto.

## 6. Detalles que pulen

- **Radios concéntricos**: radio exterior = radio interior + relleno (una
  tarjeta con `p-2` y una imagen `rounded-lg` dentro va `rounded-xl`).
- **Números**: `tabular-nums` en medidas, conteos de avisos, celdas y meses
  que cambian, para que no bailen.
- **Ajuste de texto**: `text-balance` en títulos cortos, `text-pretty` en
  descripciones y elementos de lista.
- **Bordes y sombras con motivo**: bordes para separar y para el foco;
  sombra suave y en capas solo para lo que flota (un diálogo, la paleta
  fija en móvil).
- **Zonas de toque**: 44 × 44 px como mínimo, también **las celdas de la
  cuadrícula en móvil** (si no caben, la cuadrícula hace scroll dentro de su
  contenedor, nunca la página).
- **Iconos** del mismo juego, mismo grosor de trazo, centrados ópticamente;
  decorativos con `aria-hidden`.
- Imágenes o ilustraciones con un contorno neutro sutil si se funden con el
  fondo (nunca teñido con la marca).

## 7. Tipografía y color

- La pareja del brief: una con carácter para títulos (y quizá para el
  nombre de los cultivos) y una muy legible para la interfaz. Texto de
  lectura a 16 px como mínimo.
- Paleta desde los tokens de `@theme`: superficie, tinta, tinta suave,
  acento y los tres de compatibilidad. Contraste AA (4,5:1 texto, 3:1
  componentes e iconos) medido en el navegador, no a ojo.

## 8. Nunca

- Un panel genérico de "dashboard" con métricas inventadas.
- Fotos de archivo o ilustraciones que no muestran *este* bancal ni *estos*
  cultivos.
- Tarjetas, filas o bloques que se animan al hacer scroll; *fade-in* al
  aparecer en pantalla; parallax; carruseles.
- Varios estilos de botón o de tarjeta conviviendo; tres o más tipografías.
- Texto que se disculpa o explica la interfaz («Haz clic aquí para…»).
- Violeta o lavanda en el diseño propio.

## 9. Checklist (la usa `design-reviewer`)

- [ ] **La cosa real**: cada pantalla muestra el bancal, los cultivos o el
      mes, a escala y sin relleno decorativo.
- [ ] **Un sistema**: un par de botones, un estilo de tarjeta, una escala
      de radios, un aspecto de enlace, una escala de encabezados.
- [ ] **Bordes**: todo en las líneas del contenedor; sin scroll horizontal a
      360 px.
- [ ] **Textos**: títulos que nombran, botones verbo + objeto, español,
      nada inventado.
- [ ] **Estados**: carga, error, vacío y no encontrado diseñados.
- [ ] **Compatibilidad**: color + icono + texto; se entiende en gris.
- [ ] **Movimiento**: hover y press en lo pulsable, nada ligado al scroll,
      `motion-safe:`, el momento del brief se ve claramente.
- [ ] **Detalles**: radios concéntricos, `tabular-nums`, `text-balance`,
      zonas de toque ≥ 44 px, sin `transition: all`.
- [ ] **El detalle memorable de `docs/brief.md`** se ve a simple vista, no
      "si te fijas".
- [ ] **Tus ojos**: ¿parece hecha para este huerto o una plantilla con otro
      nombre?
