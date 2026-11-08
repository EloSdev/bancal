// Tarjeta pegatina («cuaderno pop», docs/brief.md): borde de tinta y sombra
// dura. Como claseBoton, son clases y no un componente porque la tarjeta es
// a veces <li>, a veces <section> o <aside>, y lleva su propio relleno.

export const claseTarjeta = "rounded-tarjeta border-2 border-tinta bg-superficie-elevada shadow-pegatina";

/**
 * Una tarjeta entera que lleva a algún sitio (un enlace que la cubre con
 * after:inset-0): sube y la sombra crece al pasar el ratón o con el foco
 * del teclado en su enlace; al pulsar, se hunde.
 */
export const claseTarjetaPulsable = `${claseTarjeta} relative transition-[translate,box-shadow,background-color] duration-150 ease-pluma hover:shadow-pegatina-lg motion-safe:hover:-translate-0.5 has-[a:focus-visible]:shadow-pegatina-lg active:shadow-none motion-safe:active:translate-1`;
