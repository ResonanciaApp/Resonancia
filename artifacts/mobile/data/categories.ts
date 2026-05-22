export type Category = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  sessionCount: number;
  color: string;
  gradient: [string, string];
  image: ReturnType<typeof require>;
};

export const CATEGORIES: Category[] = [
  {
    id: "meditaciones-guiadas",
    title: "Meditaciones Guiadas",
    subtitle: "Viajes interiores guiados por el sonido",
    icon: "wind",
    sessionCount: 1,
    color: "#C69B4F",
    gradient: ["rgba(60,36,21,0.55)", "rgba(24,17,12,0.92)"],
    image: require("@/assets/images/cat1-meditaciones.jpg"),
  },
  {
    id: "cuencos-gongs",
    title: "Sesiones de Cuencos y Gongs",
    subtitle: "Resonancia ancestral para sanar profundo",
    icon: "disc",
    sessionCount: 1,
    color: "#D4A853",
    gradient: ["rgba(58,32,16,0.55)", "rgba(24,17,12,0.92)"],
    image: require("@/assets/images/cat2-cuencos-gongs.jpg"),
  },
  {
    id: "asmr-expansivos",
    title: "ASMR Expansivos",
    subtitle: "Sonidos íntimos que expanden la conciencia",
    icon: "headphones",
    sessionCount: 1,
    color: "#A8D8E8",
    gradient: ["rgba(26,44,60,0.55)", "rgba(24,17,12,0.92)"],
    image: require("@/assets/images/cat3-asmr.jpg"),
  },
  {
    id: "gran-despertar-podcast",
    title: "\"El Gran Despertar\" PodCast",
    subtitle: "Conversaciones que despiertan el alma",
    icon: "mic",
    sessionCount: 1,
    color: "#C4B89A",
    gradient: ["rgba(42,30,16,0.55)", "rgba(24,17,12,0.92)"],
    image: require("@/assets/images/cat4-podcast.jpg"),
  },
  {
    id: "consejo-del-dia",
    title: "Consejo del día",
    subtitle: "Una semilla de sabiduría para tu jornada",
    icon: "sun",
    sessionCount: 1,
    color: "#F0C96E",
    gradient: ["rgba(42,30,0,0.55)", "rgba(24,17,12,0.92)"],
    image: require("@/assets/images/cat5-consejo.jpg"),
  },
  {
    id: "pausas-meditativas",
    title: "Pausas Meditativas",
    subtitle: "Instantes de silencio en medio del día",
    icon: "pause-circle",
    sessionCount: 1,
    color: "#7BB8D4",
    gradient: ["rgba(13,27,42,0.55)", "rgba(24,17,12,0.92)"],
    image: require("@/assets/images/cat6-pausas.jpg"),
  },
];
