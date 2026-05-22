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
    color: "#D7BF9B",
    gradient: ["#A58A63", "#6F5B43"],
  },
  {
    id: "cuencos-gongs",
    title: "Sesiones de Cuencos y Gongs",
    subtitle: "Resonancia ancestral para sanar profundo",
    icon: "disc",
    sessionCount: 1,
    color: "#C28A46",
    gradient: ["#6E482C", "#352315"],
  },
  {
    id: "asmr-expansivos",
    title: "ASMR Expansivos",
    subtitle: "Sonidos íntimos que expanden la conciencia",
    icon: "headphones",
    sessionCount: 1,
    color: "#B88A55",
    gradient: ["#4B362A", "#221914"],
  },
  {
    id: "gran-despertar-podcast",
    title: "\"El Gran Despertar\" PodCast",
    subtitle: "Conversaciones que despiertan el alma",
    icon: "mic",
    sessionCount: 1,
    color: "#A97A43",
    gradient: ["#263344", "#141B26"],
  },
  {
    id: "consejo-del-dia",
    title: "Consejo del día",
    subtitle: "Una semilla de sabiduría para tu jornada",
    icon: "sun",
    sessionCount: 1,
    color: "#E0B882",
    gradient: ["#B08758", "#6E5138"],
  },
  {
    id: "pausas-meditativas",
    title: "Pausas Meditativas",
    subtitle: "Instantes de silencio en medio del día",
    icon: "pause-circle",
    sessionCount: 1,
    color: "#B18A4F",
    gradient: ["#626652", "#3F4337"],
  },
];
