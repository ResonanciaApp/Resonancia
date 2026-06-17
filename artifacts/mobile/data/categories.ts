export type Category = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconFamily?: "Feather" | "MaterialCommunityIcons";
  sessionCount: number;
  color: string;
  gradient: [string, string];
  primary?: boolean;
};

export const CATEGORIES: Category[] = [
  {
    id: "sonidos-ancestrales",
    title: "Ancestrales",
    subtitle: "Cuencos, gongs y frecuencias sagradas",
    icon: "bowl-mix",
    iconFamily: "MaterialCommunityIcons",
    sessionCount: 5,
    color: "#f4c993",
    gradient: ["#7A5520", "#3E2208"],
    primary: true,
  },
  {
    id: "meditaciones-guiadas",
    title: "Meditaciones",
    subtitle: "Viajes interiores guiados por el sonido",
    icon: "eye",
    sessionCount: 4,
    color: "#C8B4E0",
    gradient: ["#4A3260", "#251633"],
    primary: true,
  },
  {
    id: "musica-sonidos",
    title: "Música",
    subtitle: "Atmósferas sonoras para meditar",
    icon: "music",
    sessionCount: 9,
    color: "#A8C4A8",
    gradient: ["#3A5438", "#1E2E1C"],
    primary: true,
  },
  {
    id: "reflexiones",
    title: "Reflexiones",
    subtitle: "Contemplaciones y sabiduría para el alma",
    icon: "thought-bubble-outline",
    iconFamily: "MaterialCommunityIcons",
    sessionCount: 10,
    color: "#C4A4D4",
    gradient: ["#3A2248", "#1E1024"],
    primary: true,
  },
  {
    id: "podcast",
    title: "Sonidos",
    subtitle: "Frecuencias, naturaleza y atmósferas para transformar tu estado",
    icon: "waveform",
    iconFamily: "MaterialCommunityIcons",
    sessionCount: 0,
    color: "#8AAAD4",
    gradient: ["#243350", "#101A28"],
    primary: false,
  },
  {
    id: "mananas",
    title: "Mañanas",
    subtitle: "Rituales para comenzar el día con energía",
    icon: "sun",
    sessionCount: 0,
    color: "#f4c993",
    gradient: ["#5C4A10", "#2E2408"],
    primary: false,
  },
  {
    id: "noches",
    title: "Noches",
    subtitle: "Prepara tu cuerpo y mente para el descanso",
    icon: "moon",
    sessionCount: 0,
    color: "#4DB8A0",
    gradient: ["#1A4A42", "#0C2420"],
    primary: false,
  },
];

export const getPrimaryCategories = () => CATEGORIES.filter((c) => c.primary);
export const getSecondaryCategories = () => CATEGORIES.filter((c) => !c.primary);

const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Color de la categoría con opacidad baja, para tintar tarjetas de forma sutil.
// Algunas categorías tienen un color base muy apagado (casi gris), así que para
// el tinte del buscador usamos un color/opacidad propios para que sí se note.
const TINT_ALPHA_OVERRIDE: Record<string, number> = {
  "musica-sonidos": 0.24,
};
const TINT_COLOR_OVERRIDE: Record<string, string> = {
  "musica-sonidos": "#5B9E7A",
  "sonidos-ancestrales": "#C4956A",
};

export const getCategoryTint = (categoryId: string, alpha = 0.2) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return undefined;
  const color = TINT_COLOR_OVERRIDE[categoryId] ?? cat.color;
  return hexToRgba(color, TINT_ALPHA_OVERRIDE[categoryId] ?? alpha);
};

/** Snapshot remoto de una categoría (lo que devuelve GET /catalog). */
export type CatalogCategorySnapshot = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconFamily?: string | null;
  sessionCount: number;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  isPrimary: boolean;
};

/**
 * Hidrata CATEGORIES in-place con el snapshot del servidor (merge por id).
 * Las categorías no presentes en el bundle se ignoran. No reordena el array.
 */
export function applyCategoriesSnapshot(remote: CatalogCategorySnapshot[]): void {
  const byId = new Map(remote.map((c) => [c.id, c]));
  for (const local of CATEGORIES) {
    const r = byId.get(local.id);
    if (!r) continue;
    local.title = r.title;
    local.subtitle = r.subtitle;
    local.icon = r.icon;
    local.iconFamily = (r.iconFamily ?? undefined) as Category["iconFamily"];
    local.sessionCount = r.sessionCount;
    local.color = r.color;
    local.gradient = [r.gradientStart, r.gradientEnd];
    local.primary = r.isPrimary;
  }
}
