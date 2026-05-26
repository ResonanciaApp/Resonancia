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
    color: "#A8843A",
    gradient: ["#2E2210", "#181208"],
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
