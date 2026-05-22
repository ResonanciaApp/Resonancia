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
    icon: "feather",
    sessionCount: 1,
    color: "#C69B4F",
    gradient: ["#3C2415", "#24160F"],
  },
  {
    id: "cuencos-tibetanos",
    title: "Cuencos Tibetanos Martillados",
    subtitle: "Resonancia ancestral para sanar profundo",
    icon: "disc",
    sessionCount: 1,
    color: "#D4A853",
    gradient: ["#3A2010", "#24160F"],
  },
  {
    id: "cuencos-cuarzo",
    title: "Cuencos de Cuarzo",
    subtitle: "Frecuencias puras de cuarzo cristalino",
    icon: "sun",
    sessionCount: 1,
    color: "#A8D8E8",
    gradient: ["#1A2C3C", "#24160F"],
  },
  {
    id: "gongs",
    title: "Gongs",
    subtitle: "Vibración primordial que todo lo transforma",
    icon: "circle",
    sessionCount: 1,
    color: "#C4B89A",
    gradient: ["#2A1E10", "#24160F"],
  },
  {
    id: "cuencos-gongs",
    title: "Cuencos y Gongs",
    subtitle: "La unión de dos mundos sonoros",
    icon: "layers",
    sessionCount: 1,
    color: "#D4956A",
    gradient: ["#2A1508", "#24160F"],
  },
  {
    id: "reflexiones",
    title: "Reflexiones",
    subtitle: "Silencio sonoro para la mente inquieta",
    icon: "moon",
    sessionCount: 1,
    color: "#7BB8D4",
    gradient: ["#0D1B2A", "#24160F"],
  },
];
