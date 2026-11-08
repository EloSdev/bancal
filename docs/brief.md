# Brief: Bancal

Dirección visual de la app, fijada el 2026-11-07 con la skill `brief-grill`
(T2). La traducen a tokens `tailwind-design-system` (`@theme` en
`src/styles.css`) y a pantallas `design-taste-frontend`; la revisa
`design-reviewer`.

## Personalidad

**Cuaderno de campo: paciente, artesanal, preciso.** El cuaderno de alguien
con oficio que además calcula: papel, tinta y cotas a lápiz, con medidas
reales. Cálido para quien empieza, nunca infantil; preciso sin intimidar.

## Dirección visual

**Papel y tinta azul.** Una página de cuaderno: fondo de papel, texto a
grafito, y la pluma azul para lo que se puede hacer (acciones, enlaces,
foco). El verde y el rojo quedan reservados para la compatibilidad: un botón
nunca se confunde con «favorable».

- **Paleta** (valores de partida; los definitivos, medidos, en `@theme`):

  | Token | Uso | Valor |
  |---|---|---|
  | superficie | fondo de página (papel crema) | `#F4EEE2` |
  | superficie elevada | lo que flota (banda móvil, diálogos) | papel más claro, `#FBF8F1` |
  | tierra | interior del bancal | tinte tierra muy claro sobre el papel |
  | tinta | texto y trazos de iconos (grafito) | `#2A2925` |
  | tinta suave | texto secundario y cotas | grafito aclarado, AA sobre el papel |
  | lápiz | cuadrícula y separadores (decorativo, nunca texto) | `#B5A88C` |
  | marco | tablones del bancal | madera oscura a tinta, `#6E5A40` |
  | acento | acciones, enlaces, foco, sello (azul pluma) | `#1F4E8C` |
  | favorable | ✓ en círculo | verde hoja `#2F7A3B` |
  | desfavorable | ✕ en rombo | rojo tomate `#B3261E` |
  | neutro | – en cápsula | ocre `#8C7A55` |

  Los tres de compatibilidad: contraste ≥ 3:1 con el papel **y** con la
  tierra del bancal, y siempre con su icono de forma distinta y texto.
  Prueba de fuego: en escala de grises se entiende igual.

- **Tipografía:** **Fraunces** para títulos y nombres de cultivo (serif
  suave, con carácter de cuaderno) y **Public Sans** para la interfaz y el
  texto. Las medidas y meses, con `tabular-nums`.

- **El editor:** el bancal se **dibuja a tinta** dentro del cuaderno: marco
  de tablones con doble línea (vetas sugeridas en las esquinas), interior
  con un tinte tierra muy claro, cuadrícula de 30 cm a lápiz (tinta suave) y
  las cotas fuera del marco («├── 120 cm ──┤»), siempre **a escala**. Nada
  de texturas fotográficas.

## Cultivos en pantalla

- **Iconos SVG propios, de trazo a tinta**: ~24, trazo de 1,5 px en
  `currentColor`, como dibujados con estilográfica. Un mismo juego y grosor;
  decorativos con `aria-hidden` (el nombre va en texto).
- **Celda vacía:** solo el papel-tierra con la línea de la cuadrícula.
- **Celda ocupada:** icono + nombre corto del cultivo.
- **Celda con aviso:** marca en la esquina con forma propia por estado
  (✓ círculo favorable, ✕ rombo desfavorable, – cápsula neutra) y el detalle en
  el panel de avisos, alcanzable con teclado.

## Móvil

A 360 px la cuadrícula ocupa el ancho arriba; abajo, una **banda fija** (lo
único con sombra) con el contador de avisos («✕ 1 · ✓ 2», toca para
desplegar una hoja inferior con las explicaciones) y la **paleta de
cultivos en una fila desplazable**. Celdas de 44 px como mínimo: caben unas
7 columnas (210 cm); un bancal más ancho hace scroll **dentro de su marco**,
nunca la página. En escritorio, paleta y avisos a los lados de la
cuadrícula.

## Detalle memorable

**El huerto se dibuja a tinta mes a mes.** Cada estado de la planta es un
dibujo: semilla → brote → planta → cosecha (semilla y brote compartidos;
planta y cosecha propios de cada cultivo). Al deslizar el mes, el trazo
nuevo se dibuja con la pluma (`stroke-dashoffset`, ~400 ms). Es lo que se
ve en la demo de marzo a septiembre (T15). Con movimiento reducido aparece
el dibujo final, sin animación.

## Movimiento

**Sutil, con la temporada como único protagonista.**
- Hover y press en todo lo pulsable (100–150 ms; press `scale(0.97)`).
- Colocar un cultivo: el icono aparece con un trazo corto (~180 ms);
  quitarlo, más rápido y discreto.
- Cambio de pantalla con View Transitions, muy breve.
- Todo bajo `motion-safe:`; nada ligado al scroll.

## Tono de los textos

**Tú, cercano, como un vecino de huerto.** Frases cortas; el porqué en una
línea y qué hacer. Humor mínimo y nunca en errores. Los avisos aconsejan, no
regañan ni suenan a error del sistema.

- Aviso: «◆ Hinojo junto a tomate — El hinojo frena el crecimiento del
  tomate. Prueba a moverlo a otra esquina del bancal.» *(ejemplo de tono; el
  dato lo valida `revisor-datos` en T4)*
- Vacío: «Aún no tienes bancales.» + «Crear mi primer bancal».

## Portada y pie: «cuaderno pop» (T20, 2026-11-08)

Pedido por el usuario: la primera versión de la portada era «muy simple y
nada moderna». La portada sube el volumen con el lenguaje del lab de
maquetación (*Tueste*), traducido a Bancal:

- **Fotos reales** de huertos (Unsplash, licencia libre, créditos en el
  pie), en webp a 800 y 1600 px con `srcset`, enmarcadas con borde de 2 px
  en tinta y **sombra dura** desplazada (`shadow-pegatina`), sin difuminar.
- **Fraunces muy gruesa** (900) y grande en los titulares; pegatinas giradas
  en **girasol** (`#F2C14E`, solo fondo, texto en tinta); un **sello
  giratorio** sobre la foto de la cabecera.
- **Bloques a sangre**: una cinta de cultivos que desfila en tinta, un
  *bento* oscuro con lo que vigila la app (el bancal dibujado a tinta, el
  sol, la temporada, las tareas, los datos) y una invitación final en azul
  pluma. El pie, en tinta, para toda la app.
- **Botones pegatina en toda la app** (un solo sistema): borde de 2 px,
  sombra dura que crece al pasar el ratón y desaparece al pulsar («se
  aplasta»), todo el desplazamiento con `motion-safe:`.
- **El resto de pantallas** (2026-11-08, también a petición del usuario):
  titulares en Fraunces 900; tarjetas pegatina (`claseTarjeta` /
  `claseTarjetaPulsable` en `common/components/tarjeta.ts`) para cultivos,
  bancales, calendario, vecinos, formulario y avisos; **girasol** para lo
  que se está trabajando (filtros del catálogo, vista previa del bancal,
  temporada del editor); campos con borde de 2 px en tinta que se despegan
  con el foco; radios de 0,5 rem. La cuadrícula del editor sigue dibujada a
  tinta (marco de tablones, tierra y lápiz): es el sujeto, no se toca.
- Se mantiene: verde y rojo solo para la compatibilidad (por eso el acento
  nuevo es amarillo), Fraunces + Public Sans, el papel de fondo.

## Decidido por la IA (revísalo)

- Los valores hexadecimales de la paleta y los tokens «superficie elevada»,
  «tierra» y «tinta suave» (se ajustan midiendo contraste al crear `@theme`).
- Las formas de los iconos de compatibilidad (círculo, rombo, cápsula) y que el
  aviso de **sol insuficiente** use un triángulo ▲ con el color
  desfavorable.
- Semilla y brote compartidos entre cultivos (~50 dibujos en vez de ~96).
- View Transitions breve al cambiar de pantalla.
