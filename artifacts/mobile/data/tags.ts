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
    image: require("@/assets/images/tag-ansiedad.jpg"),
  },
  {
    id: "energiza-tus-mananas",
    label: "Energiza tus mañanas",
    description: "Despierta tu cuerpo y tu mente con sesiones que activan la energía positiva para empezar el día con fuerza.",
    image: require("@/assets/images/tag-energizar.jpg"),
  },
  {
    id: "foco-concentracion",
    label: "Foco y concentración",
    description: "Frecuencias y meditaciones que potencian la claridad mental, el enfoque sostenido y la productividad consciente.",
    image: require("@/assets/images/tag-foco.jpg"),
  },
  {
    id: "suelto-la-rabia",
    label: "Suelto la Rabia",
    description: "Un espacio seguro para procesar, liberar y transformar la rabia en energía de crecimiento y expansión.",
    image: require("@/assets/images/tag-rabia.jpg"),
  },
  {
    id: "crecimiento-personal",
    label: "Crecimiento personal",
    description: "Herramientas sonoras para expandir tu conciencia, sanar patrones y avanzar hacia la mejor versión de ti.",
    image: require("@/assets/images/tag-crecimiento.jpg"),
  },
  {
    id: "armonia-familiar",
    label: "Armonía familiar",
    description: "Meditaciones para fortalecer los lazos familiares, sanar vínculos y crear un hogar lleno de paz y amor.",
    image: require("@/assets/images/tag-armonia.jpg"),
  },
  {
    id: "respiracion-consciente",
    label: "Respiración consciente",
    description: "Guías de respiración para resetear el sistema nervioso, calmar la mente y volver al presente de forma inmediata.",
    image: require("@/assets/images/tag-respiracion.jpg"),
  },
  {
    id: "meditaciones-activas",
    label: "Meditaciones Activas",
    description: "Prácticas de meditación en movimiento que integran cuerpo y mente para un despertar completo y sostenido.",
    image: require("@/assets/images/tag-meditaciones-activas.jpg"),
  },
  {
    id: "astrologia",
    label: "Astrología",
    description: "Sesiones alineadas con los ciclos cósmicos y la energía planetaria para una práctica más profunda y conectada.",
    image: require("@/assets/images/tag-astrologia.jpg"),
  },
];

export const TAGS_PREVIEW_COUNT = 6;

// ── Sleep Tags ───────────────────────────────────────────────────────────────

export type SleepTag =
  | "Sonidos Binaurales"
  | "Sonidos Ancestrales"
  | "ASMR Expansivos"
  | "Historias para Dormir"
  | "Historias Infantiles";

export interface SleepTagCard {
  id: string;
  label: SleepTag;
  description: string;
  icon: string;
  accent: string;
}

export const SLEEP_TAG_CARDS: SleepTagCard[] = [
  {
    id: "sonidos-binaurales",
    label: "Sonidos Binaurales",
    description: "Frecuencias que sincronizan tu cerebro para el descanso más profundo. Usa auriculares para la experiencia completa.",
    icon: "radio",
    accent: "#8AAAD4",
  },
  {
    id: "sonidos-ancestrales",
    label: "Sonidos Ancestrales",
    description: "Cuencos tibetanos, gongs y cristales que llevan tu cuerpo al descanso a través de la vibración ancestral.",
    icon: "disc",
    accent: "#D4B896",
  },
  {
    id: "asmr-expansivos",
    label: "ASMR Expansivos",
    description: "Sonidos íntimos y envolventes que disuelven los límites del cuerpo y la mente, expandiendo tu percepción interior.",
    icon: "headphones",
    accent: "#C8B4E0",
  },
  {
    id: "historias-dormir",
    label: "Historias para Dormir",
    description: "Relatos narrados con voz suave para soltar el día, calmar la mente y entrar en un sueño profundo y reparador.",
    icon: "book",
    accent: "#A8C4B8",
  },
  {
    id: "historias-infantiles",
    label: "Historias Infantiles",
    description: "Para que los más pequeños duerman en paz y con amor. Historias que nutren la imaginación y el corazón.",
    icon: "star",
    accent: "#F0CC82",
  },
];
