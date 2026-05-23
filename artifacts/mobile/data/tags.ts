export type ThemeTag =
  | "Para la ansiedad"
  | "Energiza tus mañanas"
  | "Foco y concentración"
  | "Suelto la Rabia"
  | "Crecimiento personal"
  | "Armonía familiar"
  | "Respiración consciente"
  | "Meditaciones Activas"
  | "Astrología";

export interface TagCard {
  id: string;
  label: ThemeTag;
  description: string;
  image: number;
}

export const TAG_CARDS: TagCard[] = [
  {
    id: "para-la-ansiedad",
    label: "Para la ansiedad",
    description: "Sesiones diseñadas para calmar el sistema nervioso y recuperar la paz interior cuando la ansiedad toma el control.",
    image: require("@/assets/images/tag-ansiedad.png"),
  },
  {
    id: "energiza-tus-mananas",
    label: "Energiza tus mañanas",
    description: "Despierta tu cuerpo y tu mente con sesiones que activan la energía positiva para empezar el día con fuerza.",
    image: require("@/assets/images/tag-energizar.png"),
  },
  {
    id: "foco-concentracion",
    label: "Foco y concentración",
    description: "Frecuencias y meditaciones que potencian la claridad mental, el enfoque sostenido y la productividad consciente.",
    image: require("@/assets/images/tag-foco.png"),
  },
  {
    id: "suelto-la-rabia",
    label: "Suelto la Rabia",
    description: "Un espacio seguro para procesar, liberar y transformar la rabia en energía de crecimiento y expansión.",
    image: require("@/assets/images/tag-rabia.png"),
  },
  {
    id: "crecimiento-personal",
    label: "Crecimiento personal",
    description: "Herramientas sonoras para expandir tu conciencia, sanar patrones y avanzar hacia la mejor versión de ti.",
    image: require("@/assets/images/tag-crecimiento.png"),
  },
  {
    id: "armonia-familiar",
    label: "Armonía familiar",
    description: "Meditaciones para fortalecer los lazos familiares, sanar vínculos y crear un hogar lleno de paz y amor.",
    image: require("@/assets/images/tag-armonia.png"),
  },
  {
    id: "respiracion-consciente",
    label: "Respiración consciente",
    description: "Guías de respiración para resetear el sistema nervioso, calmar la mente y volver al presente de forma inmediata.",
    image: require("@/assets/images/tag-respiracion.png"),
  },
  {
    id: "meditaciones-activas",
    label: "Meditaciones Activas",
    description: "Prácticas de meditación en movimiento que integran cuerpo y mente para un despertar completo y sostenido.",
    image: require("@/assets/images/tag-meditaciones-activas.png"),
  },
  {
    id: "astrologia",
    label: "Astrología",
    description: "Sesiones alineadas con los ciclos cósmicos y la energía planetaria para una práctica más profunda y conectada.",
    image: require("@/assets/images/tag-astrologia.png"),
  },
];

export const TAGS_PREVIEW_COUNT = 6;
