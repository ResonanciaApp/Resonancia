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
    title: "Sonoterapia",
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
    color: "#f4c993",
    gradient: ["#7A5520", "#3E2208"],
    primary: true,
  },
  {
    id: "musica-sonidos",
    title: "Música",
    subtitle: "Atmósferas sonoras para meditar",
    icon: "music",
    sessionCount: 19,
    color: "#f4c993",
    gradient: ["#7A5520", "#3E2208"],
    primary: true,
  },
  {
    id: "ambientales",
    title: "Ambientales",
    subtitle: "Sonidos de la naturaleza y el mundo",
    icon: "leaf",
    iconFamily: "MaterialCommunityIcons",
    sessionCount: 0,
    color: "#78A982",
    gradient: ["#274A34", "#12251A"],
    primary: true,
  },
  {
    id: "descanso",
    title: "Dormir",
    subtitle: "Sonidos y relatos para acompañar tu noche",
    icon: "moon",
    sessionCount: 30,
    color: "#8AAAD4",
    gradient: ["#1A3A5C", "#0C1E30"],
    primary: true,
  },
  {
    id: "historias",
    title: "Historias",
    subtitle: "Relatos que acompañan, inspiran y transforman",
    icon: "book-open-page-variant",
    iconFamily: "MaterialCommunityIcons",
    sessionCount: 0,
    color: "#D5A4E8",
    gradient: ["#4A2A5A", "#24142D"],
    primary: true,
  },
  {
    id: "charlas",
    title: "Charlas",
    subtitle: "Conversaciones para abrir nuevas perspectivas",
    icon: "message-text-outline",
    iconFamily: "MaterialCommunityIcons",
    sessionCount: 0,
    color: "#F0B17A",
    gradient: ["#5A3422", "#2D1910"],
    primary: true,
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
const TINT_ALPHA_OVERRIDE: Record<string, number> = {};
const TINT_COLOR_OVERRIDE: Record<string, string> = {
  "sonidos-ancestrales": "#C4956A",
  "meditaciones-guiadas": "#C4956A",
  "musica-sonidos": "#C4956A",
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
