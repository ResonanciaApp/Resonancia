/**
 * LIBRERÍA DE GEOMETRÍAS SAGRADAS — sección "Geometrix"
 * ─────────────────────────────────────────────────────────────────
 * Cada geometría se dibuja con SVG en components/SacredGlyph.tsx
 * (mismo id). El usuario las activa por capas para componer un fondo
 * animado. `color` define el tono de trazo de cada capa.
 * ─────────────────────────────────────────────────────────────────
 */

export type GeometryId =
  | "caleidoscopio"
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
  | "triangulo"
  | "tetraedro"
  | "hexaedro"
  | "octaedro"
  | "icosaedro"
  | "dodecaedro"
  | "cuboctaedro"
  | "espiral-fibonacci"
  | "decagrama"
  | "cruz-solar"
  | "roseta-ocho"
  | "vector-equilibrium"
  | "metatron-expandido"
  | "torus-infinito"
  | "ivm"
  | "estrella-tetraedrica"
  | "hexagono-sagrado"
  | "estrella-12"
  | "estrella"
  ;

/**
 * Categoría a la que pertenece cada geometría. Sirve para el filtro del carrusel
 * en la pantalla Geometrix: en lugar de mostrar las ~44 tiles de una sola pasada
 * (lo que bloquea el hilo JS al montar tantos objetos Reanimated), el carrusel
 * muestra solo la categoría activa (~9-20 tiles).
 */
export type GeometryCategory = "sagradas" | "poliedros" | "formas";

/** Metadatos de cada categoría para los chips de filtro (en orden de aparición). */
export const GEOMETRY_CATEGORIES: { id: GeometryCategory; label: string }[] = [
  { id: "sagradas", label: "Geometría Sagrada" },
  { id: "poliedros", label: "Poliedros 3D" },
  { id: "formas", label: "Formas y Estrellas" },
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

const GEOMETRY_DEFS: { id: GeometryId; name: string; category: GeometryCategory }[] = [
  { id: "caleidoscopio", name: "Caleidoscopio",         category: "formas"    },
  { id: "flor-vida",    name: "Flor de la Vida",        category: "sagradas"  },
  { id: "semilla-vida", name: "Semilla de la Vida",     category: "sagradas"  },
  { id: "vesica",       name: "Vesica Piscis",          category: "sagradas"  },
  { id: "metatron",     name: "Cubo de Metatrón",       category: "sagradas"  },
  { id: "merkaba",      name: "Merkaba",                category: "sagradas"  },
  { id: "sri-yantra",   name: "Sri Yantra",             category: "sagradas"  },
  { id: "toroide",      name: "Toroide",                category: "sagradas"  },
  { id: "mandala",      name: "Mandala",                category: "sagradas"  },
  { id: "espiral",      name: "Espiral Áurea",          category: "formas"    },
  { id: "pentagrama",   name: "Pentagrama",             category: "formas"    },
  { id: "hexagrama",    name: "Hexagrama",              category: "formas"    },
  { id: "triquetra",    name: "Triquetra",              category: "sagradas"  },
  { id: "arbol-vida",   name: "Árbol de la Vida",       category: "sagradas"  },
  { id: "fruto-vida",   name: "Fruto de la Vida",       category: "sagradas"  },
  { id: "huevo-vida",   name: "Huevo de la Vida",       category: "sagradas"  },
  { id: "cubo-vida",    name: "Cubo de la Vida",        category: "sagradas"  },
  { id: "octagrama",    name: "Octagrama",              category: "formas"    },
  { id: "eneagrama",    name: "Eneagrama",              category: "formas"    },
  { id: "nudo-celta",   name: "Nudo Celta",             category: "sagradas"  },
  { id: "yin-yang",     name: "Yin-Yang",               category: "sagradas"  },
  { id: "circulos",     name: "Círculos Concéntricos",  category: "formas"    },
  { id: "loto",         name: "Loto",                   category: "sagradas"  },
  { id: "cuadrado",             name: "Cuadrado",                     category: "formas"    },
  { id: "circulo",              name: "Círculo",                      category: "formas"    },
  { id: "triangulo",            name: "Triángulo",                    category: "formas"    },
  { id: "tetraedro",            name: "Tetraedro",                    category: "poliedros" },
  { id: "hexaedro",             name: "Cubo (Hexaedro)",              category: "poliedros" },
  { id: "octaedro",             name: "Octaedro",                     category: "poliedros" },
  { id: "icosaedro",            name: "Icosaedro",                    category: "poliedros" },
  { id: "dodecaedro",           name: "Dodecaedro",                   category: "poliedros" },
  { id: "cuboctaedro",          name: "Cuboctaedro",                  category: "poliedros" },
  { id: "espiral-fibonacci",    name: "Espiral de Fibonacci",         category: "formas"    },
  { id: "decagrama",            name: "Decagrama",                    category: "formas"    },
  { id: "cruz-solar",           name: "Cruz Solar",                   category: "sagradas"  },
  { id: "roseta-ocho",          name: "Roseta de Ocho Pétalos",       category: "formas"    },
  { id: "vector-equilibrium",   name: "Vector Equilibrium",           category: "poliedros" },
  { id: "metatron-expandido",   name: "Cubo de Metatrón Expandido",   category: "sagradas"  },
  { id: "torus-infinito",       name: "Torus Infinito",               category: "sagradas"  },
  { id: "ivm",                  name: "Lattice Isotrópica Vectorial", category: "poliedros" },
  { id: "estrella-tetraedrica", name: "Estrella Tetraédrica",         category: "poliedros" },
  { id: "hexagono-sagrado",     name: "Hexágono Sagrado",             category: "sagradas"  },
  { id: "estrella-12",          name: "Estrella de 12 Puntas",        category: "formas"    },
  { id: "estrella",             name: "Estrella",                     category: "formas"    },
];

export const GEOMETRIES: GeometryMeta[] = GEOMETRY_DEFS.map((g, i) => ({
  ...g,
  color: PALETTE[i % PALETTE.length],
}));

export function getGeometry(id: GeometryId): GeometryMeta | undefined {
  return GEOMETRIES.find((g) => g.id === id);
}

/** Categoría de un id (base o de instancia). Default "formas" si no se encuentra. */
export function categoryOf(id: string): GeometryCategory {
  return getGeometry(baseOf(id))?.category ?? "formas";
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
