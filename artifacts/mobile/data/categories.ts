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
    color: "#EDD9B8",
    gradient: ["#BF9B70", "#8A6E48"],
  },
  {
    id: "cuencos-gongs",
    title: "Sesiones de Cuencos y Gongs",
    subtitle: "Resonancia ancestral para sanar profundo",
    icon: "disc",
    sessionCount: 1,
    color: "#D4905A",
    gradient: ["#6B3D1C", "#3A1E0A"],
  },
  {
    id: "asmr-expansivos",
    title: "ASMR Expansivos",
    subtitle: "Sonidos íntimos que expanden la conciencia",
    icon: "headphones",
    sessionCount: 1,
    color: "#C89060",
    gradient: ["#47301E", "#241508"],
  },
  {
    id: "gran-despertar-podcast",
    title: "\"El Gran Despertar\" PodCast",
    subtitle: "Conversaciones que despiertan el alma",
    icon: "mic",
    sessionCount: 1,
    color: "#8AAAD4",
    gradient: ["#243350", "#131E33"],
  },
  {
    id: "consejo-del-dia",
    title: "Consejo del día",
    subtitle: "Una semilla de sabiduría para tu jornada",
    icon: "sun",
    sessionCount: 1,
    color: "#F0CC82",
    gradient: ["#C49A52", "#8A6C2A"],
  },
  {
    id: "pausas-meditativas",
    title: "Pausas Meditativas",
    subtitle: "Instantes de silencio en medio del día",
    icon: "pause-circle",
    sessionCount: 1,
    color: "#C8D4A8",
    gradient: ["#626B52", "#3C4230"],
  },
];
