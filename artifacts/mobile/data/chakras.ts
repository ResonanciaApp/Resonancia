import type { GeometryId } from "@/data/geometries";

export type Chakra = {
  /** id de ruta y de geometría ("chakra-1" … "chakra-7"). */
  id: string;
  geometryId: GeometryId;
  /** Nombre sánscrito (Muladhara, Svadhisthana, …). */
  name: string;
  /** Etiqueta Nivel 1 (themeTag) asociada en la DB. */
  tagLabel: string;
  /** Variantes de la etiqueta toleradas (typos existentes en la DB). */
  tagAliases: string[];
  /** Color tradicional del chakra (acento, glifo). */
  color: string;
  /** Degradado de 3 paradas para la pantalla de detalle. */
  gradient: [string, string, string];
  /** Descripción corta (2 líneas) en español neutro. */
  description: string;
};

export const CHAKRAS: Chakra[] = [
  {
    id: "chakra-1",
    geometryId: "chakra-1",
    name: "Muladhara",
    tagLabel: "Primer Chakra",
    tagAliases: [],
    color: "#E63946",
    gradient: ["#2A0808", "#6B1510", "#9A2018"],
    description: "Raíz y seguridad. Sesiones para anclarte a la tierra y sentirte a salvo en tu cuerpo.",
  },
  {
    id: "chakra-2",
    geometryId: "chakra-2",
    name: "Svadhisthana",
    tagLabel: "Segundo Chakra",
    tagAliases: [],
    color: "#FF8C42",
    gradient: ["#1A0A04", "#7A3008", "#B04A10"],
    description: "Emoción y creatividad. Sesiones para fluir con tus emociones y despertar tu energía vital.",
  },
  {
    id: "chakra-3",
    geometryId: "chakra-3",
    name: "Manipura",
    tagLabel: "Tercer Chakra",
    tagAliases: [],
    color: "#FFD24C",
    gradient: ["#16120A", "#6E520E", "#B08020"],
    description: "Poder personal. Sesiones para fortalecer tu voluntad, tu confianza y tu determinación.",
  },
  {
    id: "chakra-4",
    geometryId: "chakra-4",
    name: "Anahata",
    tagLabel: "Cuarto Chakra",
    tagAliases: [],
    color: "#49B88A",
    gradient: ["#060E0A", "#1A4A32", "#287A50"],
    description: "Amor y compasión. Sesiones para abrir el corazón y cultivar la aceptación.",
  },
  {
    id: "chakra-5",
    geometryId: "chakra-5",
    name: "Vishuddha",
    tagLabel: "Quinto Chakra",
    tagAliases: [],
    color: "#3CA0D8",
    gradient: ["#06101A", "#162E6E", "#204A98"],
    description: "Expresión y verdad. Sesiones para liberar tu voz y comunicar desde la autenticidad.",
  },
  {
    id: "chakra-6",
    geometryId: "chakra-6",
    name: "Ajna",
    tagLabel: "Sexto Chakra",
    // La DB tiene hoy la variante "Sexo Chakra"; se trata como "Sexto Chakra".
    tagAliases: ["Sexo Chakra"],
    color: "#5A4FCF",
    gradient: ["#04060E", "#0E1640", "#161E58"],
    description: "Intuición y visión. Sesiones para aquietar la mente y despertar la percepción interior.",
  },
  {
    id: "chakra-7",
    geometryId: "chakra-7",
    name: "Sahasrara",
    tagLabel: "Séptimo Chakra",
    tagAliases: [],
    color: "#A855F7",
    gradient: ["#0C0614", "#3A1268", "#5E2488"],
    description: "Conexión y unidad. Sesiones para expandir la consciencia y unirte con el todo.",
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
