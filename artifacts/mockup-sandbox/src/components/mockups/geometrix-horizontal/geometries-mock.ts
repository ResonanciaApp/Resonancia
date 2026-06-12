/**
 * Mock geometries data for horizontal Geometrix demo
 */
export const GEOMETRIES = [
  { id: "flor-vida", name: "Flor de la Vida" },
  { id: "semilla-vida", name: "Semilla de la Vida" },
  { id: "metatron", name: "Cubo de Metatr\u00f3n" },
  { id: "merkaba", name: "Merkaba" },
  { id: "sri-yantra", name: "Sri Yantra" },
  { id: "toroide", name: "Toroide" },
  { id: "vesica", name: "Vesica Piscis" },
  { id: "triquetra", name: "Triquetra" },
  { id: "more", name: "M\u00e1s" },
] as const;

export type GeometryId = (typeof GEOMETRIES)[number]["id"];

export const baseOf = (id: string): string => id.split("::")[0];

export const CATEGORIES = [
  { id: "all", label: "Todas", count: 128 },
  { id: "circulos", label: "C\u00edrculos", count: 24 },
  { id: "poligonos", label: "Pol\u00edgonos", count: 18 },
  { id: "flores", label: "Flores de la Vida", count: 16 },
  { id: "solidos", label: "S\u00f3lidos Sagrados", count: 14 },
  { id: "mandalas", label: "Mand\u00e1las", count: 20 },
  { id: "espirales", label: "Espirales", count: 12 },
  { id: "fractales", label: "Fractales", count: 8 },
  { id: "simbolos", label: "S\u00edmbolos", count: 16 },
];
