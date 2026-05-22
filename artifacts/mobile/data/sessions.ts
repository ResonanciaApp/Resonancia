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
    image: require("@/assets/images/meditation-person.png"),
    isFeatured: true,
  },
  {
    id: "2",
    title: "Para dormir bien",
    subtitle: "Baño de Cuencos Tibetanos",
    categoryId: "cuencos-tibetanos",
    categoryLabel: "Cuencos Tibetanos Martillados",
    duration: 45,
    durationLabel: "45 min",
    description:
      "Las frecuencias profundas de los cuencos tibetanos martillados guían tu mente hacia el descanso más reparador. Cada golpe suave disuelve la tensión acumulada y prepara tu cuerpo para un sueño sagrado.",
    benefits: ["Sueño profundo", "Alivio del estrés", "Relajación total", "Descanso reparador"],
    instruments: ["Cuencos tibetanos martillados", "Cuenco de agua", "Tingsha"],
    image: require("@/assets/images/tibetan-bowl.png"),
    isFeatured: true,
    frequency: "Delta 0.5–4 Hz",
  },
  {
    id: "3",
    title: "Descanso en ti",
    subtitle: "Sesión de Cuencos de Cuarzo",
    categoryId: "cuencos-cuarzo",
    categoryLabel: "Cuencos de Cuarzo",
    duration: 25,
    durationLabel: "25 min",
    description:
      "Las frecuencias cristalinas de los cuencos de cuarzo resuenan con las estructuras más sutiles de tu cuerpo. Descansa en tu propia naturaleza luminosa mientras el sonido limpia y armoniza tu campo energético.",
    benefits: ["Alineación energética", "Apertura del corazón", "Claridad profunda", "Resonancia celular"],
    instruments: ["Cuencos de cuarzo cristalino", "Campanas tingsha"],
    image: require("@/assets/images/crystal-bowls.png"),
    frequency: "432 Hz",
    isNew: true,
  },
  {
    id: "4",
    title: "Dentro de uno",
    subtitle: "Baño de Gong",
    categoryId: "gongs",
    categoryLabel: "Gongs",
    duration: 60,
    durationLabel: "60 min",
    description:
      "La vibración primordial del gong penetra cada célula de tu ser. Las ondas expansivas te llevan más allá de los límites del pensamiento ordinario hacia un espacio de pura presencia y reconocimiento interno.",
    benefits: ["Liberación emocional", "Reset del sistema nervioso", "Expansión de conciencia", "Sanación profunda"],
    instruments: ["Gong Paiste", "Cuencos tibetanos", "Chimes"],
    image: require("@/assets/images/8b.jpg"),
    isFeatured: true,
  },
  {
    id: "5",
    title: "Más allá del sonido",
    subtitle: "Fusión de Cuencos y Gong",
    categoryId: "cuencos-gongs",
    categoryLabel: "Cuencos y Gongs",
    duration: 40,
    durationLabel: "40 min",
    description:
      "Una experiencia sonora completa donde cuencos tibetanos, cuencos de cuarzo y gong se entrelazan en una sinfonía transformadora. El sonido te lleva más allá del sonido mismo, hacia el silencio que todo lo contiene.",
    benefits: ["Sanación integral", "Limpieza energética", "Liberación de bloqueos", "Renovación profunda"],
    instruments: ["Cuencos tibetanos", "Cuencos de cuarzo", "Gong Paiste", "Chimes", "Campana"],
    image: require("@/assets/images/hero-bowl.png"),
    isFeatured: true,
  },
  {
    id: "6",
    title: "Investigando en la mente",
    subtitle: "Reflexión Sonora",
    categoryId: "reflexiones",
    categoryLabel: "Reflexiones",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Una invitación a observar la mente desde adentro. El sonido crea el espacio; tú aportas la atención. Juntos exploran los movimientos del pensamiento, los patrones habituales y la quietud que subyace a todo.",
    benefits: ["Autoconocimiento", "Observación de la mente", "Presencia plena", "Insight interior"],
    instruments: ["Cuenco tibetano", "Silencio consciente", "Campanillas suaves"],
    image: require("@/assets/images/cosmic-bg.png"),
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
  return SESSIONS.filter((s) => s.categoryId === "cuencos-tibetanos");
}

export function getShortSessions(): Session[] {
  return SESSIONS.filter((s) => s.duration <= 30);
}
