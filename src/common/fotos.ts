// Fotos reales de la portada (Unsplash, licencia libre). Cada una está en
// public/img/portada/<id>-800.webp y -1600.webp. La portada las pinta y el pie
// cita a sus autores: por eso viven en common/ y no dentro del pod.

export interface Foto {
  id: string;
  alt: string;
  autor: string;
  /** Página de la foto en Unsplash. */
  enlace: string;
  /** Proporción de la imagen descargada (ancho × alto a 800 px). */
  ancho: number;
  alto: number;
}

export const FOTOS = {
  bancal: {
    id: "bancal-lechugas",
    alt: "Bancal elevado de madera con lechugas verdes y moradas, cebollino en flor y plantones en macetas",
    autor: "Markus Spiske",
    enlace: "https://unsplash.com/photos/lettuce-and-chives-in-garden-bed-bk11wZwb9F4",
    ancho: 800,
    alto: 533,
  },
  semillero: {
    id: "brotes",
    alt: "Bandeja de semillero dividida en celdas cuadradas, con brotes recién nacidos en cada una",
    autor: "Markus Spiske",
    enlace: "https://unsplash.com/photos/selective-focus-photo-of-plant-spouts-vrbZVyX2k4I",
    ancho: 800,
    alto: 533,
  },
  plantar: {
    id: "plantar-bancal",
    alt: "Manos plantando con una pala pequeña en un bancal de madera mientras otra mano riega con una regadera verde",
    autor: "Jonathan Kemper",
    enlace: "https://unsplash.com/photos/person-planting-seedlings-in-raised-bed-VTXw4_5SsNA",
    ancho: 800,
    alto: 1200,
  },
  cosecha: {
    id: "cosecha-tomates",
    alt: "Caja de madera llena de cosecha: tomates de colores, cebollas, fresas, pimientos y hierbas",
    autor: "Zoe Richardson",
    enlace: "https://unsplash.com/photos/harvest-basket-with-tomatoes-and-vegetables-hmoDcZnB7uw",
    ancho: 800,
    alto: 533,
  },
  riego: {
    id: "regar",
    alt: "Chorro de una regadera cayendo en gotas sobre plantas jóvenes de hoja verde",
    autor: "Markus Spiske",
    enlace: "https://unsplash.com/photos/person-watering-plant-sFydXGrt5OA",
    ancho: 800,
    alto: 1200,
  },
} satisfies Record<string, Foto>;

export const fuenteFoto = (foto: Foto, ancho: 800 | 1600) => `/img/portada/${foto.id}-${ancho}.webp`;
