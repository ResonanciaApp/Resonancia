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

/** Convierte una etiqueta temática en el slug usado por los carruseles y sus rutas. */
export function slugifyThemeTag(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
  | "ASMR Expansivos";

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
];

// ── Sonidos Tags ─────────────────────────────────────────────────────────────

export type SonidosCollectionTag =
  | "Todos los sonidos"
  | "Sonidos de naturaleza"
  | "Sonidos binaurales"
  | "Música de enfoque"
  | "Cantos medicinales"
  | "Sonidos de lluvia"
  | "Sonidos para Chakras";

export interface SonidosTagCard {
  id: string;
  label: SonidosCollectionTag;
  description: string;
  icon: string;
  accent: string;
}

export const SONIDOS_TAG_CARDS: SonidosTagCard[] = [
  {
    id: "todos-los-sonidos",
    label: "Todos los sonidos",
    description: "La colección completa de experiencias sonoras para explorar, concentrarte y volver al presente.",
    icon: "headphones",
    accent: "#BE9650",
  },
  {
    id: "sonidos-de-naturaleza",
    label: "Sonidos de naturaleza",
    description: "Paisajes de agua, bosque, viento y tierra para reconectar con el ritmo natural.",
    icon: "wind",
    accent: "#78A982",
  },
  {
    id: "sonidos-binaurales",
    label: "Sonidos binaurales",
    description: "Frecuencias inmersivas que acompañan estados de enfoque, descanso y expansión.",
    icon: "radio",
    accent: "#8AAAD4",
  },
  {
    id: "musica-de-enfoque",
    label: "Música de enfoque",
    description: "Atmósferas musicales creadas para sostener la atención y reducir distracciones.",
    icon: "target",
    accent: "#8F9FD1",
  },
  {
    id: "cantos-medicinales",
    label: "Cantos medicinales",
    description: "Voces, mantras y cantos de tradición que acompañan procesos de conexión interior.",
    icon: "mic",
    accent: "#C58E6B",
  },
  {
    id: "sonidos-de-lluvia",
    label: "Sonidos de lluvia",
    description: "Lluvia suave y constante para crear refugio, calma y continuidad.",
    icon: "cloud-rain",
    accent: "#6FA9C7",
  },
  {
    id: "sonidos-para-chakras",
    label: "Sonidos para Chakras",
    description: "Frecuencias y resonancias orientadas a equilibrar los centros energéticos.",
    icon: "aperture",
    accent: "#9B8BC8",
  },
];

// ── Descanso Tags ────────────────────────────────────────────────────────────

export type DescansoTag =
  | "Música para dormir"
  | "Meditaciones para dormir"
  | "Historias para dormir"
  | "Sonidos para dormir"
  | "Paisajes sonoros"
  | "Para niños"
  | "Sonidos de lluvia"
  | "Ruido";

export type LegacyDescansoTag =
  | "Relajaciones"
  | "Sueño profundo"
  | "Ruidos"
  | "Meditaciones"
  | "Historias para dormir"
  | "Historias infantiles"
  | "ASMR"
  | "Sonidos Binaurales"
  | "Sonidos Ambientales";

export interface DescansoTagCard {
  id: string;
  label: DescansoTag;
  description: string;
  icon: string;
  accent: string;
}

export const DESCANSO_TAG_CARDS: DescansoTagCard[] = [
  {
    id: "musica-para-dormir",
    label: "Música para dormir",
    description: "Música suave y frecuencias creadas para acompañar la transición hacia un descanso profundo.",
    icon: "music",
    accent: "#8AAAD4",
  },
  {
    id: "meditaciones-para-dormir",
    label: "Meditaciones para dormir",
    description: "Prácticas guiadas para soltar el día, aquietar la mente y conciliar el sueño.",
    icon: "eye",
    accent: "#9B8BC8",
  },
  {
    id: "historias-para-dormir",
    label: "Historias para dormir",
    description: "Relatos en voz baja con paisajes sonoros que acompañan la mente hacia un estado de calma total.",
    icon: "book-open",
    accent: "#D4B896",
  },
  {
    id: "sonidos-para-dormir",
    label: "Sonidos para dormir",
    description: "Texturas sonoras envolventes que ayudan a calmar el sistema nervioso antes de descansar.",
    icon: "headphones",
    accent: "#C8B4E0",
  },
  {
    id: "paisajes-sonoros",
    label: "Paisajes sonoros",
    description: "Ambientes naturales y espacios acústicos inmersivos para crear una atmósfera de descanso.",
    icon: "wind",
    accent: "#7AB8A8",
  },
  {
    id: "para-ninos",
    label: "Para niños",
    description: "Cuentos y experiencias tranquilas para acompañar a los más pequeños a la hora de dormir.",
    icon: "star",
    accent: "#D4C896",
  },
  {
    id: "sonidos-de-lluvia",
    label: "Sonidos de lluvia",
    description: "Lluvia suave y constante para enmascarar el entorno y favorecer un sueño continuo.",
    icon: "cloud-rain",
    accent: "#6FA9C7",
  },
  {
    id: "ruido",
    label: "Ruido",
    description: "Ruido blanco y otras frecuencias estables para reducir distracciones durante la noche.",
    icon: "volume-2",
    accent: "#7AB8A8",
  },
];
