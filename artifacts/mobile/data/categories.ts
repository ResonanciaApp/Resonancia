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
    title: "Sonidos Ancestrales",
    subtitle: "Cuencos, gongs y frecuencias sagradas",
    icon: "bowl-mix",
    iconFamily: "MaterialCommunityIcons",
    sessionCount: 4,
    color: "#E8C87A",
    gradient: ["#7A5520", "#3E2208"],
    primary: true,
  },
  {
    id: "meditaciones-guiadas",
    title: "Meditaciones Guiadas",
    subtitle: "Viajes interiores guiados por el sonido",
    icon: "eye",
    sessionCount: 3,
    color: "#C8B4E0",
    gradient: ["#4A3260", "#251633"],
    primary: true,
  },
  {
    id: "musica-sonidos",
    title: "Música y Sonidos",
    subtitle: "Atmósferas sonoras para meditar",
    icon: "music",
    sessionCount: 2,
    color: "#A8C4A8",
    gradient: ["#3A5438", "#1E2E1C"],
  },
  {
    id: "sabiduria-dia",
    title: "3 Minutos de Sabiduría",
    subtitle: "Sabiduría condensada en 3 minutos",
    icon: "sun",
    sessionCount: 1,
    color: "#F0CC82",
    gradient: ["#5E4A22", "#3A2E12"],
  },
  {
    id: "podcast",
    title: "PodCast",
    subtitle: "Conversaciones que despiertan el alma",
    icon: "mic",
    sessionCount: 1,
    color: "#8AAAD4",
    gradient: ["#243350", "#101A28"],
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
  "musica-sonidos": "#5FB36A",
  "sabiduria-dia": "#E0935A",
};

export const getCategoryTint = (categoryId: string, alpha = 0.2) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return undefined;
  const color = TINT_COLOR_OVERRIDE[categoryId] ?? cat.color;
  return hexToRgba(color, TINT_ALPHA_OVERRIDE[categoryId] ?? alpha);
};
