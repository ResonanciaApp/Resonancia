export type Category = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  sessionCount: number;
  color: string;
  gradient: [string, string];
};

export const CATEGORIES: Category[] = [
  {
    id: "meditaciones-guiadas",
    title: "Meditaciones Guiadas",
    subtitle: "Viajes interiores guiados por el sonido",
    icon: "wind",
    sessionCount: 1,
    color: "#C69B4F",
    gradient: ["#3C2415", "#24160F"],
  },
  {
    id: "cuencos-gongs",
    title: "Sesiones de Cuencos y Gongs",
    subtitle: "Resonancia ancestral para sanar profundo",
    icon: "disc",
    sessionCount: 1,
    color: "#D4A853",
    gradient: ["#3A2010", "#24160F"],
  },
  {
    id: "asmr-expansivos",
    title: "ASMR Expansivos",
    subtitle: "Sonidos íntimos que expanden la conciencia",
    icon: "headphones",
    sessionCount: 1,
    color: "#A8D8E8",
    gradient: ["#1A2C3C", "#24160F"],
  },
  {
    id: "gran-despertar-podcast",
    title: "\"El Gran Despertar\" PodCast",
    subtitle: "Conversaciones que despiertan el alma",
    icon: "mic",
    sessionCount: 1,
    color: "#C4B89A",
    gradient: ["#2A1E10", "#24160F"],
  },
  {
    id: "consejo-del-dia",
    title: "Consejo del día",
    subtitle: "Una semilla de sabiduría para tu jornada",
    icon: "sun",
    sessionCount: 1,
    color: "#F0C96E",
    gradient: ["#2A1E00", "#24160F"],
  },
  {
    id: "pausas-meditativas",
    title: "Pausas Meditativas",
    subtitle: "Instantes de silencio en medio del día",
    icon: "pause-circle",
    sessionCount: 1,
    color: "#7BB8D4",
    gradient: ["#0D1B2A", "#24160F"],
  },
];
