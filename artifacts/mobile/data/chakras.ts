import type { GeometryId } from "@/data/geometries";

export type Chakra = {
  /** id de ruta y de geometría ("chakra-1" … "chakra-7"). */
  id: string;
  geometryId: GeometryId;
  /** Nombre sánscrito (Muladhara, Svadhisthana, …). */
  name: string;
  /** Nombre corporal / anatómico (Raíz, Sacro, Corazón…). */
  subtitle: string;
  /** Etiqueta Nivel 1 (themeTag) asociada en la DB. */
  tagLabel: string;
  /** Variantes de la etiqueta toleradas (typos existentes en la DB). */
  tagAliases: string[];
  /** Color tradicional del chakra (acento, glifo). */
  color: string;
  /** Degradado de 3 paradas para la pantalla de detalle. */
  gradient: [string, string, string];
  /** Color central del fondo radial de la pantalla (más luminoso). */
  radialCenter: string;
  /** Color exterior del fondo radial de la pantalla (más oscuro). */
  radialOuter: string;
  /** Descripción corta (2 líneas) en español neutro. */
  description: string;
  /** Elemento tradicional (Tierra, Agua, Fuego…). */
  element: string;
  /** Nombre del color tradicional. */
  colorName: string;
  /** Mantra semilla (bija). */
  mantra: string;
  /** Ubicación en el cuerpo. */
  location: string;
};

export const CHAKRAS: Chakra[] = [
  {
    id: "chakra-1",
    geometryId: "chakra-1",
    name: "Muladhara",
    subtitle: "Raíz",
    tagLabel: "Primer Chakra",
    tagAliases: [],
    color: "#C65860",
    gradient: ["#2A0808", "#6B1510", "#9A2018"],
    radialCenter: "#5B1015",
    radialOuter: "#470F13",
    description: "Raíz y seguridad. Sesiones para anclarte a la tierra y sentirte a salvo en tu cuerpo.",
    element: "Tierra",
    colorName: "Rojo",
    mantra: "LAM",
    location: "Base de la columna",
  },
  {
    id: "chakra-2",
    geometryId: "chakra-2",
    name: "Svadhisthana",
    subtitle: "Sacro",
    tagLabel: "Segundo Chakra",
    tagAliases: [],
    color: "#DE9363",
    gradient: ["#1A0A04", "#7A3008", "#B04A10"],
    radialCenter: "#5B2D10",
    radialOuter: "#47250F",
    description: "Emoción y creatividad. Sesiones para fluir con tus emociones y despertar tu energía vital.",
    element: "Agua",
    colorName: "Naranja",
    mantra: "VAM",
    location: "Bajo el ombligo",
  },
  {
    id: "chakra-3",
    geometryId: "chakra-3",
    name: "Manipura",
    subtitle: "Plexo Solar",
    tagLabel: "Tercer Chakra",
    tagAliases: [],
    color: "#dad4ec",
    gradient: ["#16120A", "#6E520E", "#B08020"],
    radialCenter: "#5B4810",
    radialOuter: "#47390F",
    description: "Poder personal. Sesiones para fortalecer tu voluntad, tu confianza y tu determinación.",
    element: "Fuego",
    colorName: "Amarillo",
    mantra: "RAM",
    location: "Plexo solar",
  },
  {
    id: "chakra-4",
    geometryId: "chakra-4",
    name: "Anahata",
    subtitle: "Corazón",
    tagLabel: "Cuarto Chakra",
    tagAliases: [],
    color: "#60A186",
    gradient: ["#060E0A", "#1A4A32", "#287A50"],
    radialCenter: "#105B3C",
    radialOuter: "#0F4730",
    description: "Amor y compasión. Sesiones para abrir el corazón y cultivar la aceptación.",
    element: "Aire",
    colorName: "Verde",
    mantra: "YAM",
    location: "Centro del pecho",
  },
  {
    id: "chakra-5",
    geometryId: "chakra-5",
    name: "Vishuddha",
    subtitle: "Garganta",
    tagLabel: "Quinto Chakra",
    tagAliases: [],
    color: "#5998BB",
    gradient: ["#06101A", "#162E6E", "#204A98"],
    radialCenter: "#10415B",
    radialOuter: "#0F3447",
    description: "Expresión y verdad. Sesiones para liberar tu voz y comunicar desde la autenticidad.",
    element: "Éter",
    colorName: "Azul",
    mantra: "HAM",
    location: "Garganta",
  },
  {
    id: "chakra-6",
    geometryId: "chakra-6",
    name: "Ajna",
    subtitle: "Tercer Ojo",
    tagLabel: "Sexto Chakra",
    // La DB tiene hoy la variante "Sexo Chakra"; se trata como "Sexto Chakra".
    tagAliases: ["Sexo Chakra"],
    color: "#6F68B6",
    gradient: ["#04060E", "#0E1640", "#161E58"],
    radialCenter: "#0E355C",
    radialOuter: "#100E48",
    description: "Intuición y visión. Sesiones para aquietar la mente y despertar la percepción interior.",
    element: "Mente",
    colorName: "Índigo",
    mantra: "OM",
    location: "Entrecejo",
  },
  {
    id: "chakra-7",
    geometryId: "chakra-7",
    name: "Sahasrara",
    subtitle: "Corona",
    tagLabel: "Séptimo Chakra",
    tagAliases: [],
    color: "#A776D6",
    gradient: ["#0C0614", "#3A1268", "#5E2488"],
    radialCenter: "#37105B",
    radialOuter: "#2C0F47",
    description: "Conexión y unidad. Sesiones para expandir la consciencia y unirte con el todo.",
    element: "Consciencia",
    colorName: "Violeta",
    mantra: "Silencio",
    location: "Coronilla",
  },
];

export function getChakraById(id?: string): Chakra | undefined {
  if (!id) return undefined;
  return CHAKRAS.find((c) => c.id === id);
}

/** ¿La etiqueta (themeTag) corresponde a este chakra? Tolerante a variantes de la DB. */
export function chakraMatchesTag(chakra: Chakra, tag: string): boolean {
  return tag === chakra.tagLabel || chakra.tagAliases.includes(tag);
}

const ALL_CHAKRA_TAGS = new Set<string>(
  CHAKRAS.flatMap((c) => [c.tagLabel, ...c.tagAliases]),
);

/** ¿La etiqueta es de un chakra? (para excluirlas de los carruseles genéricos). */
export function isChakraTag(tag: string): boolean {
  return ALL_CHAKRA_TAGS.has(tag);
}
