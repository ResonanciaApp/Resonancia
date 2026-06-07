/**
 * LIBRERÍA DE GEOMETRÍAS SAGRADAS — sección "Geometrix"
 * ─────────────────────────────────────────────────────────────────
 * Cada geometría se dibuja con SVG en components/SacredGlyph.tsx
 * (mismo id). El usuario las activa por capas para componer un fondo
 * animado. `color` define el tono de trazo de cada capa.
 * ─────────────────────────────────────────────────────────────────
 */

export type GeometryId =
  | "flor-vida"
  | "semilla-vida"
  | "vesica"
  | "metatron"
  | "merkaba"
  | "sri-yantra"
  | "toroide"
  | "mandala"
  | "espiral"
  | "pentagrama"
  | "hexagrama"
  | "triquetra"
  | "arbol-vida"
  | "fruto-vida"
  | "huevo-vida"
  | "cubo-vida"
  | "octagrama"
  | "eneagrama"
  | "nudo-celta"
  | "yin-yang"
  | "circulos"
  | "loto"
  | "cuadrado"
  | "circulo"
  | "triangulo";

export interface GeometryMeta {
  id: GeometryId;
  name: string;
  color: string;
}

/**
 * Paleta compartida de colores. Es la MISMA (y en el MISMO orden) que la de
 * los ajustes personalizados por capa. El color por defecto de cada geometría
 * se asigna recorriendo esta paleta de forma cíclica (intercalado), por lo que
 * los tabs del grid van rotando los colores con la lógica de la paleta.
 */
export const PALETTE = [
  "#BE9650",
  "#EDE1D3",
  "#7FD1C0",
  "#7AA8E0",
  "#B69BE0",
  "#E0989B",
  "#9BD6A8",
] as const;

const GEOMETRY_DEFS: { id: GeometryId; name: string }[] = [
  { id: "flor-vida",    name: "Flor de la Vida" },
  { id: "semilla-vida", name: "Semilla de la Vida" },
  { id: "vesica",       name: "Vesica Piscis" },
  { id: "metatron",     name: "Cubo de Metatrón" },
  { id: "merkaba",      name: "Merkaba" },
  { id: "sri-yantra",   name: "Sri Yantra" },
  { id: "toroide",      name: "Toroide" },
  { id: "mandala",      name: "Mandala" },
  { id: "espiral",      name: "Espiral Áurea" },
  { id: "pentagrama",   name: "Pentagrama" },
  { id: "hexagrama",    name: "Hexagrama" },
  { id: "triquetra",    name: "Triquetra" },
  { id: "arbol-vida",   name: "Árbol de la Vida" },
  { id: "fruto-vida",   name: "Fruto de la Vida" },
  { id: "huevo-vida",   name: "Huevo de la Vida" },
  { id: "cubo-vida",    name: "Cubo de la Vida" },
  { id: "octagrama",    name: "Octagrama" },
  { id: "eneagrama",    name: "Eneagrama" },
  { id: "nudo-celta",   name: "Nudo Celta" },
  { id: "yin-yang",     name: "Yin-Yang" },
  { id: "circulos",     name: "Círculos Concéntricos" },
  { id: "loto",         name: "Loto" },
  { id: "cuadrado",     name: "Cuadrado" },
  { id: "circulo",      name: "Círculo" },
  { id: "triangulo",    name: "Triángulo" },
];

export const GEOMETRIES: GeometryMeta[] = GEOMETRY_DEFS.map((g, i) => ({
  ...g,
  color: PALETTE[i % PALETTE.length],
}));

export function getGeometry(id: GeometryId): GeometryMeta | undefined {
  return GEOMETRIES.find((g) => g.id === id);
}
