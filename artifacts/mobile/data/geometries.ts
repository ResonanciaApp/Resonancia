/**
 * LIBRERÍA DE GEOMETRÍAS — sección "Geometrix"
 * ─────────────────────────────────────────────────────────────────
 * 102 geometrías en 3 categorías: Circulares · Rectilíneas · Combinaciones
 * Los datos SVG viven en data/glyph-strings.ts.
 * ─────────────────────────────────────────────────────────────────
 */

export type GeometryId =
  // ── Circulares (46) ───────────────────────────────────────────
  | "caleidoscopio"
  | "flor-vida"
  | "semilla-vida"
  | "vesica"
  | "metatron"
  | "toroide"
  | "mandala"
  | "triquetra"
  | "fruto-vida"
  | "huevo-vida"
  | "nudo-celta"
  | "yin-yang"
  | "circulos"
  | "loto"
  | "circulo"
  | "espiral-fibonacci"
  | "roseta-ocho"
  | "torus-infinito"
  | "c-asset-3" | "c-asset-5" | "c-asset-10" | "c-asset-11" | "c-asset-12" | "c-asset-24"
  // ── Rectilíneas (31) ──────────────────────────────────────────
  | "merkaba"
  | "cubo-vida"
  | "tetraedro"
  | "hexaedro"
  | "octaedro"
  | "icosaedro"
  | "dodecaedro"
  | "cuboctaedro"
  | "ivm"
  | "cuadrado"
  | "triangulo"
  | "r-1geometry"  | "r-1geometry2"
  | "r-2geometry"  | "r-2geometry2"
  | "r-3geometry"  | "r-3geometry2"
  | "r-4geometry"  | "r-4geometry2"
  | "r-asset-1"  | "r-asset-2"  | "r-asset-4"  | "r-asset-6"  | "r-asset-7"
  | "r-asset-9"  | "r-asset-17" | "r-asset-20" | "r-asset-21" | "r-asset-22"
  | "r-asset-26" | "r-asset-27"
  // ── Combinaciones (25) ────────────────────────────────────────
  | "arbol-vida"
  | "espiral"
  | "pentagrama"
  | "hexagrama"
  | "octagrama"
  | "eneagrama"
  | "sri-yantra"
  | "decagrama"
  | "cruz-solar"
  | "vector-equilibrium"
  | "metatron-expandido"
  | "hexagono-sagrado"
  | "estrella-12"
  | "estrella"
  | "estrella-tetraedrica"
  | "k-asset-8"  | "k-asset-13" | "k-asset-14" | "k-asset-15" | "k-asset-16"
  | "k-asset-18" | "k-asset-19" | "k-asset-23" | "k-asset-25" | "k-asset-28"
  // ── 7 Chakras (7) ────────────────────────────────────────────────
  | "chakra-1" | "chakra-2" | "chakra-3" | "chakra-4"
  | "chakra-5" | "chakra-6" | "chakra-7"
  ;

/**
 * Categoría a la que pertenece cada geometría. Sirve para el filtro del carrusel
 * en la pantalla Geometrix.
 */
export type GeometryCategory = "circulares" | "rectilineas" | "combinaciones" | "chakras";

/** Metadatos de cada categoría para los chips de filtro (en orden de aparición). */
export const GEOMETRY_CATEGORIES: { id: GeometryCategory; label: string }[] = [
  { id: "circulares",    label: "Circulares"   },
  { id: "rectilineas",   label: "Rectilíneas"  },
  { id: "combinaciones", label: "Combinaciones" },
  { id: "chakras",       label: "7 Chakras"    },
];

export interface GeometryMeta {
  id: GeometryId;
  name: string;
  category: GeometryCategory;
  color: string;
}

/**
 * Paleta compartida de colores. Es la MISMA (y en el MISMO orden) que la de
 * los ajustes personalizados por capa. El color por defecto de cada geometría
 * se asigna recorriendo esta paleta de forma cíclica (intercalado).
 */
export const PALETTE = [
  "#F9F9F9",
  "#EDE1D3",
  "#7FD1C0",
  "#7AA8E0",
  "#B69BE0",
  "#E0989B",
  "#9BD6A8",
] as const;

const GEOMETRY_DEFS: { id: GeometryId; name: string; category: GeometryCategory }[] = [
  // ── Circulares ─────────────────────────────────────────────────────────────
  { id: "caleidoscopio",     name: "Caleidoscopio",              category: "circulares" },
  { id: "flor-vida",         name: "Flor de la Vida",            category: "circulares" },
  { id: "semilla-vida",      name: "Semilla de la Vida",         category: "circulares" },
  { id: "vesica",            name: "Vesica Piscis",              category: "circulares" },
  { id: "metatron",          name: "Cubo de Metatrón",           category: "circulares" },
  { id: "toroide",           name: "Toroide",                    category: "circulares" },
  { id: "mandala",           name: "Mandala",                    category: "circulares" },
  { id: "triquetra",         name: "Triquetra",                  category: "circulares" },
  { id: "fruto-vida",        name: "Fruto de la Vida",           category: "circulares" },
  { id: "huevo-vida",        name: "Huevo de la Vida",           category: "circulares" },
  { id: "nudo-celta",        name: "Nudo Celta",                 category: "circulares" },
  { id: "yin-yang",          name: "Yin-Yang",                   category: "circulares" },
  { id: "circulos",          name: "Círculos Concéntricos",      category: "circulares" },
  { id: "loto",              name: "Loto",                       category: "circulares" },
  { id: "circulo",           name: "Círculo",                    category: "circulares" },
  { id: "espiral-fibonacci", name: "Espiral de Fibonacci",       category: "circulares" },
  { id: "roseta-ocho",       name: "Roseta de Ocho Pétalos",     category: "circulares" },
  { id: "torus-infinito",    name: "Torus Infinito",             category: "circulares" },
  { id: "c-asset-3",  name: "Circular A3",  category: "circulares" },
  { id: "c-asset-5",  name: "Circular A5",  category: "circulares" },
  { id: "c-asset-10", name: "Circular A10", category: "circulares" },
  { id: "c-asset-11", name: "Circular A11", category: "circulares" },
  { id: "c-asset-12", name: "Circular A12", category: "circulares" },
  { id: "c-asset-24", name: "Circular A24", category: "circulares" },
  // ── Rectilíneas ────────────────────────────────────────────────────────────
  { id: "merkaba",     name: "Merkaba",                     category: "rectilineas" },
  { id: "cubo-vida",   name: "Cubo de la Vida",             category: "rectilineas" },
  { id: "tetraedro",   name: "Tetraedro",                   category: "rectilineas" },
  { id: "hexaedro",    name: "Cubo (Hexaedro)",             category: "rectilineas" },
  { id: "octaedro",    name: "Octaedro",                    category: "rectilineas" },
  { id: "icosaedro",   name: "Icosaedro",                   category: "rectilineas" },
  { id: "dodecaedro",  name: "Dodecaedro",                  category: "rectilineas" },
  { id: "cuboctaedro", name: "Cuboctaedro",                 category: "rectilineas" },
  { id: "ivm",         name: "Lattice Isotrópica Vectorial",category: "rectilineas" },
  { id: "cuadrado",    name: "Cuadrado",                    category: "rectilineas" },
  { id: "triangulo",   name: "Triángulo",                   category: "rectilineas" },
  { id: "r-1geometry",  name: "Rectilínea 1a", category: "rectilineas" },
  { id: "r-1geometry2", name: "Rectilínea 1b", category: "rectilineas" },
  { id: "r-2geometry",  name: "Rectilínea 2a", category: "rectilineas" },
  { id: "r-2geometry2", name: "Rectilínea 2b", category: "rectilineas" },
  { id: "r-3geometry",  name: "Rectilínea 3a", category: "rectilineas" },
  { id: "r-3geometry2", name: "Rectilínea 3b", category: "rectilineas" },
  { id: "r-4geometry",  name: "Rectilínea 4a", category: "rectilineas" },
  { id: "r-4geometry2", name: "Rectilínea 4b", category: "rectilineas" },
  { id: "r-asset-1",  name: "Rectilínea A1",  category: "rectilineas" },
  { id: "r-asset-2",  name: "Rectilínea A2",  category: "rectilineas" },
  { id: "r-asset-4",  name: "Rectilínea A4",  category: "rectilineas" },
  { id: "r-asset-6",  name: "Rectilínea A6",  category: "rectilineas" },
  { id: "r-asset-7",  name: "Rectilínea A7",  category: "rectilineas" },
  { id: "r-asset-9",  name: "Rectilínea A9",  category: "rectilineas" },
  { id: "r-asset-17", name: "Rectilínea A17", category: "rectilineas" },
  { id: "r-asset-20", name: "Rectilínea A20", category: "rectilineas" },
  { id: "r-asset-21", name: "Rectilínea A21", category: "rectilineas" },
  { id: "r-asset-22", name: "Rectilínea A22", category: "rectilineas" },
  { id: "r-asset-26", name: "Rectilínea A26", category: "rectilineas" },
  { id: "r-asset-27", name: "Rectilínea A27", category: "rectilineas" },
  // ── Combinaciones ──────────────────────────────────────────────────────────
  { id: "arbol-vida",           name: "Árbol de la Vida",           category: "combinaciones" },
  { id: "espiral",              name: "Espiral Áurea",              category: "combinaciones" },
  { id: "pentagrama",           name: "Pentagrama",                 category: "combinaciones" },
  { id: "hexagrama",            name: "Hexagrama",                  category: "combinaciones" },
  { id: "octagrama",            name: "Octagrama",                  category: "combinaciones" },
  { id: "eneagrama",            name: "Eneagrama",                  category: "combinaciones" },
  { id: "sri-yantra",           name: "Sri Yantra",                 category: "combinaciones" },
  { id: "decagrama",            name: "Decagrama",                  category: "combinaciones" },
  { id: "cruz-solar",           name: "Cruz Solar",                 category: "combinaciones" },
  { id: "vector-equilibrium",   name: "Vector Equilibrium",         category: "combinaciones" },
  { id: "metatron-expandido",   name: "Cubo de Metatrón Expandido", category: "combinaciones" },
  { id: "hexagono-sagrado",     name: "Hexágono Sagrado",           category: "combinaciones" },
  { id: "estrella-12",          name: "Estrella de 12 Puntas",      category: "combinaciones" },
  { id: "estrella",             name: "Estrella",                   category: "combinaciones" },
  { id: "estrella-tetraedrica", name: "Estrella Tetraédrica",       category: "combinaciones" },
  { id: "k-asset-8",  name: "Combinación A8",  category: "combinaciones" },
  { id: "k-asset-13", name: "Combinación A13", category: "combinaciones" },
  { id: "k-asset-14", name: "Combinación A14", category: "combinaciones" },
  { id: "k-asset-15", name: "Combinación A15", category: "combinaciones" },
  { id: "k-asset-16", name: "Combinación A16", category: "combinaciones" },
  { id: "k-asset-18", name: "Combinación A18", category: "combinaciones" },
  { id: "k-asset-19", name: "Combinación A19", category: "combinaciones" },
  { id: "k-asset-23", name: "Combinación A23", category: "combinaciones" },
  { id: "k-asset-25", name: "Combinación A25", category: "combinaciones" },
  { id: "k-asset-28", name: "Combinación A28", category: "combinaciones" },
  // ── 7 Chakras ──────────────────────────────────────────────────────────────
  { id: "chakra-1", name: "Muladhara",     category: "chakras" },
  { id: "chakra-2", name: "Svadhisthana",  category: "chakras" },
  { id: "chakra-3", name: "Manipura",      category: "chakras" },
  { id: "chakra-4", name: "Anahata",       category: "chakras" },
  { id: "chakra-5", name: "Vishuddha",     category: "chakras" },
  { id: "chakra-6", name: "Ajna",          category: "chakras" },
  { id: "chakra-7", name: "Sahasrara",     category: "chakras" },
];

export const GEOMETRIES: GeometryMeta[] = GEOMETRY_DEFS.map((g, i) => ({
  ...g,
  color: PALETTE[i % PALETTE.length],
}));

export function getGeometry(id: GeometryId): GeometryMeta | undefined {
  return GEOMETRIES.find((g) => g.id === id);
}

/** Categoría de un id (base o de instancia). Default "circulares" si no se encuentra. */
export function categoryOf(id: string): GeometryCategory {
  return getGeometry(baseOf(id))?.category ?? "circulares";
}

/**
 * Separador de id de instancia. Una geometría duplicada usa el id
 * `${baseId}::${sufijoÚnico}` para poder existir varias veces (cada una con sus
 * propios ajustes) sin chocar con el original (que conserva el id base pelado).
 */
export const INSTANCE_SEP = "::";

/**
 * Devuelve el id base (tipo de geometría) a partir de un id de instancia.
 * Para un id base (sin separador) lo devuelve tal cual. Úsese siempre que haya
 * que mapear un id (de `active`, settings, etc.) a su `GeometryMeta`/glifo.
 */
export function baseOf(id: string): GeometryId {
  const i = id.indexOf(INSTANCE_SEP);
  return (i === -1 ? id : id.slice(0, i)) as GeometryId;
}
