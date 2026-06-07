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

export const GEOMETRIES: GeometryMeta[] = [
  { id: "flor-vida",    name: "Flor de la Vida",   color: "#D6A85B" },
  { id: "semilla-vida", name: "Semilla de la Vida", color: "#C9A24A" },
  { id: "vesica",       name: "Vesica Piscis",     color: "#8E9BD8" },
  { id: "metatron",     name: "Cubo de Metatrón",  color: "#BE9650" },
  { id: "merkaba",      name: "Merkaba",           color: "#9BA8E6" },
  { id: "sri-yantra",   name: "Sri Yantra",        color: "#D89BB5" },
  { id: "toroide",      name: "Toroide",           color: "#79C7C0" },
  { id: "mandala",      name: "Mandala",           color: "#E0B36A" },
  { id: "espiral",      name: "Espiral Áurea",     color: "#B6C2F0" },
  { id: "pentagrama",   name: "Pentagrama",        color: "#D6A85B" },
  { id: "hexagrama",    name: "Hexagrama",         color: "#8FD0C9" },
  { id: "triquetra",    name: "Triquetra",         color: "#C6A6E0" },
  { id: "arbol-vida",   name: "Árbol de la Vida",  color: "#B6C2F0" },
  { id: "fruto-vida",   name: "Fruto de la Vida",  color: "#E0B36A" },
  { id: "huevo-vida",   name: "Huevo de la Vida",  color: "#8FD0C9" },
  { id: "cubo-vida",    name: "Cubo de la Vida",   color: "#9BA8E6" },
  { id: "octagrama",    name: "Octagrama",         color: "#D6A85B" },
  { id: "eneagrama",    name: "Eneagrama",         color: "#C6A6E0" },
  { id: "nudo-celta",   name: "Nudo Celta",        color: "#79C7C0" },
  { id: "yin-yang",     name: "Yin-Yang",          color: "#EDE1D3" },
  { id: "circulos",     name: "Círculos Concéntricos", color: "#8E9BD8" },
  { id: "loto",         name: "Loto",              color: "#D89BB5" },
  { id: "cuadrado",     name: "Cuadrado",          color: "#BE9650" },
  { id: "circulo",      name: "Círculo",           color: "#C9A24A" },
  { id: "triangulo",    name: "Triángulo",         color: "#D6A85B" },
];

export function getGeometry(id: GeometryId): GeometryMeta | undefined {
  return GEOMETRIES.find((g) => g.id === id);
}
