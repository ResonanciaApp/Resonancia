export type Session = {
  id: string;
  title: string;
  subtitle: string;
  categoryId: string;
  categoryLabel: string;
  duration: number;
  durationLabel: string;
  description: string;
  benefits: string[];
  instruments: string[];
  image: ReturnType<typeof require>;
  isFeatured?: boolean;
  isNew?: boolean;
  frequency?: string;
};

export const SESSIONS: Session[] = [
  {
    id: "1",
    title: "Adentro de uno mismo",
    subtitle: "Meditación Guiada",
    categoryId: "meditaciones-guiadas",
    categoryLabel: "Meditaciones Guiadas",
    duration: 30,
    durationLabel: "30 min",
    description:
      "Un viaje guiado hacia el centro de tu ser. El sonido de los cuencos te acompaña suavemente mientras te sumerges en las capas más profundas de tu interior, encontrando quietud y claridad.",
    benefits: ["Relajación profunda", "Claridad mental", "Conexión interior", "Paz duradera"],
    instruments: ["Cuencos tibetanos", "Campana", "Voz guía"],
    image: require("@/assets/images/cat1-meditaciones.jpg"),
    isFeatured: true,
  },
  {
    id: "2",
    title: "Para dormir bien",
    subtitle: "Baño de Cuencos y Gongs",
    categoryId: "cuencos-gongs",
    categoryLabel: "Sesiones de Cuencos y Gongs",
    duration: 45,
    durationLabel: "45 min",
    description:
      "Las frecuencias profundas de cuencos tibetanos y gong guían tu mente hacia el descanso más reparador. Cada vibración disuelve la tensión acumulada y prepara tu cuerpo para un sueño sagrado.",
    benefits: ["Sueño profundo", "Alivio del estrés", "Relajación total", "Descanso reparador"],
    instruments: ["Cuencos tibetanos martillados", "Gong Paiste", "Tingsha"],
    image: require("@/assets/images/cat2-cuencos-gongs.jpg"),
    isFeatured: true,
    frequency: "Delta 0.5–4 Hz",
  },
  {
    id: "3",
    title: "Descanz en ti",
    subtitle: "ASMR Expansivo",
    categoryId: "asmr-expansivos",
    categoryLabel: "ASMR Expansivos",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Sonidos íntimos y envolventes que disuelven los límites del cuerpo y la mente. Una experiencia ASMR diseñada para expandir tu percepción interior más allá de lo conocido.",
    benefits: ["Relajación profunda", "Expansión sensorial", "Presencia plena", "Calma instantánea"],
    instruments: ["Cuencos de cuarzo", "Campanas suaves", "Sonidos de la naturaleza"],
    image: require("@/assets/images/cat3-asmr.jpg"),
    frequency: "432 Hz",
    isNew: true,
  },
  {
    id: "4",
    title: "Dentro de uno",
    subtitle: "El Gran Despertar · Episodio 1",
    categoryId: "gran-despertar-podcast",
    categoryLabel: "\"El Gran Despertar\" PodCast",
    duration: 35,
    durationLabel: "35 min",
    description:
      "Una conversación profunda sobre el despertar de la conciencia y el camino hacia el autoconocimiento. Reflexiones que invitan a mirar adentro con honestidad y compasión.",
    benefits: ["Autoconocimiento", "Inspiración profunda", "Claridad de vida", "Perspectiva nueva"],
    instruments: ["Voz", "Cuenco tibetano de apertura", "Silencio consciente"],
    image: require("@/assets/images/cat4-podcast.jpg"),
    isNew: true,
  },
  {
    id: "5",
    title: "Más allá del sonido",
    subtitle: "Consejo del Día",
    categoryId: "consejo-del-dia",
    categoryLabel: "Consejo del día",
    duration: 5,
    durationLabel: "5 min",
    description:
      "Una pequeña semilla de sabiduría para plantar en tu jornada. El sonido del cuenco abre el espacio, y la reflexión que le sigue puede cambiar el rumbo de tu día.",
    benefits: ["Inspiración diaria", "Intención clara", "Perspectiva fresca", "Momento de pausa"],
    instruments: ["Cuenco tibetano", "Voz guía"],
    image: require("@/assets/images/cat5-consejo.jpg"),
    isFeatured: true,
  },
  {
    id: "6",
    title: "Investigando en la mente",
    subtitle: "Pausa Meditativa",
    categoryId: "pausas-meditativas",
    categoryLabel: "Pausas Meditativas",
    duration: 10,
    durationLabel: "10 min",
    description:
      "Una invitación a observar la mente desde adentro. El sonido crea el espacio; tú aportas la atención. Juntos exploran los movimientos del pensamiento y la quietud que subyace a todo.",
    benefits: ["Observación de la mente", "Presencia plena", "Insight interior", "Reset rápido"],
    instruments: ["Cuenco tibetano", "Silencio consciente", "Campanillas suaves"],
    image: require("@/assets/images/cat6-pausas.jpg"),
    isNew: true,
  },
];

export function getSessionsByCategory(categoryId: string): Session[] {
  return SESSIONS.filter((s) => s.categoryId === categoryId);
}

export function getFeaturedSessions(): Session[] {
  return SESSIONS.filter((s) => s.isFeatured);
}

export function getSessionById(id: string): Session | undefined {
  return SESSIONS.find((s) => s.id === id);
}

export function getSleepSessions(): Session[] {
  return SESSIONS.filter((s) => s.categoryId === "cuencos-gongs");
}

export function getShortSessions(): Session[] {
  return SESSIONS.filter((s) => s.duration <= 15);
}
