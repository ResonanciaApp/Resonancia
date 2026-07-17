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
  /** Degradado de 3 paradas (oscuro→medio→casi negro) para la pantalla de detalle. */
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
    gradient: ["#4B0F0F", "#8B1E1E", "#0D0808"],
    description: "Raíz y seguridad. Sesiones para anclarte a la tierra y sentirte a salvo en tu cuerpo.",
  },
  {
    id: "chakra-2",
    geometryId: "chakra-2",
    name: "Svadhisthana",
    tagLabel: "Segundo Chakra",
    tagAliases: [],
    color: "#FF8C42",
    gradient: ["#7A2E0D", "#CC5A1A", "#0E0806"],
    description: "Emoción y creatividad. Sesiones para fluir con tus emociones y despertar tu energía vital.",
  },
  {
    id: "chakra-3",
    geometryId: "chakra-3",
    name: "Manipura",
    tagLabel: "Tercer Chakra",
    tagAliases: [],
    color: "#FFD24C",
    gradient: ["#7A5A00", "#D4A017", "#0D0B03"],
    description: "Poder personal. Sesiones para fortalecer tu voluntad, tu confianza y tu determinación.",
  },
  {
    id: "chakra-4",
    geometryId: "chakra-4",
    name: "Anahata",
    tagLabel: "Cuarto Chakra",
    tagAliases: [],
    color: "#49B88A",
    gradient: ["#0F3D2E", "#1E7A5A", "#05100C"],
    description: "Amor y compasión. Sesiones para abrir el corazón y cultivar la aceptación.",
  },
  {
    id: "chakra-5",
    geometryId: "chakra-5",
    name: "Vishuddha",
    tagLabel: "Quinto Chakra",
    tagAliases: [],
    color: "#3CA0D8",
    gradient: ["#0B2D4D", "#145D8C", "#040D16"],
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
    gradient: ["#1A1444", "#2E2680", "#07060F"],
    description: "Intuición y visión. Sesiones para aquietar la mente y despertar la percepción interior.",
  },
  {
    id: "chakra-7",
    geometryId: "chakra-7",
    name: "Sahasrara",
    tagLabel: "Séptimo Chakra",
    tagAliases: [],
    color: "#A855F7",
    gradient: ["#3B1456", "#6B2D91", "#0C0610"],
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
