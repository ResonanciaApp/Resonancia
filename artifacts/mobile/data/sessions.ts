export type SoundTag = "Binaural" | "Música" | "Sonidos Naturaleza" | "Música Enteógena";
export type MeditationTag =
  | "No Duales"
  | "Visualizaciones"
  | "Mantras"
  | "Escaneo Corporal"
  | "Manifestación";

export type SabiduriaTag =
  | "Silencio Interior"
  | "Aceptación y flujo"
  | "Atención plena"
  | "Observo mi oscuridad"
  | "Condicionamiento y creencias";

export type PodcastTag =
  | "Espiritualidad"
  | "Salud y Bienestar"
  | "Disciplinas"
  | "Psicología Transpersonal"
  | "Enteógenos"
  | "Sobrenatural"
  | "Neurociencia";

export type AncestralTag =
  | "Cuencos Tibetanos"
  | "Cuencos de Cuarzo"
  | "Mix de Cuencos"
  | "Gongs"
  | "Cuencos y Gongs"
  | "Full Instrumentos";

import type { SleepTag, ThemeTag } from "@/data/tags";

export type SessionGuide = {
  name: string;
  country: string;
};

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
  audio?: ReturnType<typeof require>;
  isFeatured?: boolean;
  isNew?: boolean;
  frequency?: string;
  soundTag?: SoundTag;
  meditationTag?: MeditationTag;
  ancestralTag?: AncestralTag;
  sabiduriaTag?: SabiduriaTag;
  podcastTag?: PodcastTag;
  themeTag?: ThemeTag[];
  sleepTag?: SleepTag;
  guide?: SessionGuide;
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
    image: require("@/assets/images/sessions/session-1.jpg"),
    isFeatured: true,
    meditationTag: "Visualizaciones",
    guide: { name: "Sofía Ramírez", country: "Argentina" },
  },
  {
    id: "2",
    title: "Para dormir bien",
    subtitle: "Baño de Cuencos y Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonidos Ancestrales",
    ancestralTag: "Cuencos y Gongs" as const,
    sleepTag: "Sonidos Ancestrales" as const,
    duration: 45,
    durationLabel: "45 min",
    description:
      "Las frecuencias profundas de cuencos tibetanos y gong guían tu mente hacia el descanso más reparador. Cada vibración disuelve la tensión acumulada y prepara tu cuerpo para un sueño sagrado.",
    benefits: ["Sueño profundo", "Alivio del estrés", "Relajación total", "Descanso reparador"],
    instruments: ["Cuencos tibetanos martillados", "Gong Paiste", "Tingsha"],
    image: require("@/assets/images/sessions/session-2.jpg"),
    audio: require("@/assets/audio/sesion2_pad_mi_mayor.mp3"),
    isFeatured: true,
    frequency: "Delta 0.5–4 Hz",
  },
  {
    id: "3",
    title: "Descanz en ti",
    subtitle: "ASMR Expansivo",
    categoryId: "asmr-expansivos",
    sleepTag: "ASMR Expansivos" as const,
    categoryLabel: "ASMR Expansivos",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Sonidos íntimos y envolventes que disuelven los límites del cuerpo y la mente. Una experiencia ASMR diseñada para expandir tu percepción interior más allá de lo conocido.",
    benefits: ["Relajación profunda", "Expansión sensorial", "Presencia plena", "Calma instantánea"],
    instruments: ["Cuencos de cuarzo", "Campanas suaves", "Sonidos de la naturaleza"],
    image: require("@/assets/images/sessions/session-3.jpg"),
    frequency: "432 Hz",
    isNew: true,
  },
  {
    id: "4",
    title: "Dentro de uno",
    subtitle: "El Gran Despertar · Episodio 1",
    categoryId: "podcast",
    categoryLabel: "PodCast",
    podcastTag: "Espiritualidad" as const,
    duration: 35,
    durationLabel: "35 min",
    description:
      "Una conversación profunda sobre el despertar de la conciencia y el camino hacia el autoconocimiento. Reflexiones que invitan a mirar adentro con honestidad y compasión.",
    benefits: ["Autoconocimiento", "Inspiración profunda", "Claridad de vida", "Perspectiva nueva"],
    instruments: ["Voz", "Cuenco tibetano de apertura", "Silencio consciente"],
    image: require("@/assets/images/sessions/session-4.jpg"),
    isNew: true,
  },
  {
    id: "5",
    title: "Más allá del sonido",
    subtitle: "Consejo del Día",
    categoryId: "sabiduria-dia",
    categoryLabel: "3 Minutos de Sabiduría",
    sabiduriaTag: "Silencio Interior" as const,
    duration: 5,
    durationLabel: "5 min",
    description:
      "Una pequeña semilla de sabiduría para plantar en tu jornada. El sonido del cuenco abre el espacio, y la reflexión que le sigue puede cambiar el rumbo de tu día.",
    benefits: ["Inspiración diaria", "Intención clara", "Perspectiva fresca", "Momento de pausa"],
    instruments: ["Cuenco tibetano", "Voz guía"],
    image: require("@/assets/images/sessions/session-5.jpg"),
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
    image: require("@/assets/images/sessions/session-6.jpg"),
    isNew: true,
  },
  {
    id: "7",
    title: "Prueba",
    subtitle: "Meditación Guiada",
    categoryId: "meditaciones-guiadas",
    categoryLabel: "Meditaciones Guiadas",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Una sesión de meditación guiada para explorar tu mundo interior. Los sonidos de cuencos tibetanos te acompañan en un viaje de atención plena y presencia consciente.",
    benefits: ["Relajación profunda", "Presencia plena", "Claridad mental", "Paz interior"],
    instruments: ["Cuencos tibetanos", "Voz guía", "Campanilla"],
    image: require("@/assets/images/sessions/session-7.jpg"),
    isNew: true,
    meditationTag: "Escaneo Corporal",
  },

  // ── Sonidos Binaurales con Cuencos ────────────────────────────────────────
  {
    id: "8",
    title: "Ondas Delta para Dormir",
    subtitle: "Sonidos Binaurales con Cuencos",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonidos Ancestrales",
    ancestralTag: "Cuencos Tibetanos" as const,
    sleepTag: "Sonidos Binaurales" as const,
    duration: 45,
    durationLabel: "45 min",
    description:
      "Frecuencias binaurales delta entretejidas con el canto de cuencos tibetanos. Tu cerebro es guiado suavemente hacia el estado de sueño más profundo y reparador.",
    benefits: ["Sueño profundo", "Reducción del estrés", "Regeneración celular", "Paz mental"],
    instruments: ["Cuencos tibetanos", "Frecuencias binaurales delta"],
    image: require("@/assets/images/sessions/session-8.jpg"),
    frequency: "Delta 1–4 Hz",
    isNew: true,
  },
  {
    id: "9",
    title: "Theta Profundo con Cuencos",
    subtitle: "Sonidos Binaurales con Cuencos",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonidos Ancestrales",
    ancestralTag: "Cuencos de Cuarzo" as const,
    sleepTag: "Sonidos Binaurales" as const,
    duration: 30,
    durationLabel: "30 min",
    description:
      "El estado theta es el umbral entre el sueño y la vigilia. Los cuencos y las frecuencias binaurales te llevan a ese espacio liminal donde surgen los sueños lúcidos y la intuición.",
    benefits: ["Creatividad expandida", "Sueños lúcidos", "Intuición profunda", "Relajación total"],
    instruments: ["Cuencos de cuarzo", "Frecuencias binaurales theta"],
    image: require("@/assets/images/sessions/session-9.jpg"),
    frequency: "Theta 4–8 Hz",
    isNew: true,
  },
  {
    id: "10",
    title: "Sincronización Gamma 40Hz",
    subtitle: "Sonidos Binaurales con Cuencos",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonidos Ancestrales",
    ancestralTag: "Cuencos de Cuarzo" as const,
    sleepTag: "Sonidos Binaurales" as const,
    duration: 20,
    durationLabel: "20 min",
    description:
      "Las ondas gamma a 40Hz activan la lucidez y la integración neuronal. Combinadas con cuencos de alta frecuencia, esta sesión despierta tu claridad más elevada.",
    benefits: ["Claridad mental", "Foco profundo", "Integración neuronal", "Presencia total"],
    instruments: ["Cuencos de cuarzo soprano", "Frecuencias binaurales gamma"],
    image: require("@/assets/images/sessions/session-10.jpg"),
    frequency: "Gamma 40 Hz",
    isNew: true,
  },

  // ── Meditaciones ASMR ─────────────────────────────────────────────────────
  {
    id: "11",
    title: "Susurros del Cuenco Tibetano",
    subtitle: "Meditaciones ASMR",
    categoryId: "meditaciones-asmr",
    categoryLabel: "Meditaciones ASMR",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Los sonidos más suaves y cercanos del cuenco tibetano rozan tu conciencia como un susurro. Una experiencia íntima diseñada para disolver la tensión más profunda.",
    benefits: ["Hormigueo relajante", "Alivio del insomnio", "Reducción de ansiedad", "Presencia sensorial"],
    instruments: ["Cuenco tibetano pequeño", "Fricciones suaves", "Agua y cristal"],
    image: require("@/assets/images/sessions/session-11.jpg"),
    frequency: "432 Hz",
    sleepTag: "ASMR Expansivos",
    isNew: true,
  },
  {
    id: "12",
    title: "Fricciones que Sanan",
    subtitle: "Meditaciones ASMR",
    categoryId: "meditaciones-asmr",
    categoryLabel: "Meditaciones ASMR",
    duration: 15,
    durationLabel: "15 min",
    description:
      "El sonido continuo del baquetazo sobre el cuenco en movimiento circular hipnotiza los sentidos y lleva la mente a un estado de quietud profunda. Puro ASMR ancestral.",
    benefits: ["Calma instantánea", "Relajación muscular", "Mente quieta", "Desconexión del ruido"],
    instruments: ["Cuencos de bronce", "Baqueta de cuero", "Sonidos circulares"],
    image: require("@/assets/images/sessions/session-12.jpg"),
    sleepTag: "ASMR Expansivos",
    isNew: true,
  },
  {
    id: "13",
    title: "El Silencio que Habla",
    subtitle: "Meditaciones ASMR",
    categoryId: "meditaciones-asmr",
    categoryLabel: "Meditaciones ASMR",
    duration: 25,
    durationLabel: "25 min",
    description:
      "Entre los golpes suaves del cuenco, el silencio cobra vida. Esta sesión ASMR entrena la escucha profunda y el descanso en el espacio entre los sonidos.",
    benefits: ["Sensibilidad auditiva", "Presente profundo", "Silencio interior", "Relajación plena"],
    instruments: ["Cuencos tibetanos variados", "Tingsha", "Silencios conscientes"],
    image: require("@/assets/images/sessions/session-13.jpg"),
    frequency: "528 Hz",
    sleepTag: "ASMR Expansivos",
    isNew: true,
  },

  // ── Historias para Dormir ──────────────────────────────────────────────────
  {
    id: "14",
    title: "El Lago de Cristal",
    subtitle: "Historias para Dormir",
    categoryId: "historias-dormir",
    sleepTag: "Historias para Dormir" as const,
    categoryLabel: "Historias para Dormir",
    duration: 30,
    durationLabel: "30 min",
    description:
      "Una historia narrada con voz suave sobre un lago en las montañas donde el agua refleja las estrellas y cada ola trae consigo una capa de sueño más profundo.",
    benefits: ["Inducción al sueño", "Imágenes relajantes", "Mente quieta", "Sueño reparador"],
    instruments: ["Voz guía", "Cuencos suaves", "Sonidos de agua"],
    image: require("@/assets/images/sessions/session-14.jpg"),
    isNew: true,
  },
  {
    id: "15",
    title: "Camino entre Bosques",
    subtitle: "Historias para Dormir",
    categoryId: "historias-dormir",
    sleepTag: "Historias para Dormir" as const,
    categoryLabel: "Historias para Dormir",
    duration: 40,
    durationLabel: "40 min",
    description:
      "Caminas por un sendero entre árboles antiguos. El suelo es suave, el aire huele a tierra húmeda y resina. Los cuencos marcan cada paso hacia el sueño profundo.",
    benefits: ["Visualización guiada", "Desconexión digital", "Sueño natural", "Paz profunda"],
    instruments: ["Voz guía", "Cuencos de cuarzo", "Sonidos del bosque"],
    image: require("@/assets/images/sessions/session-15.jpg"),
    isNew: true,
  },
  {
    id: "16",
    title: "La Caverna del Sonido",
    subtitle: "Historias para Dormir",
    categoryId: "historias-dormir",
    sleepTag: "Historias para Dormir" as const,
    categoryLabel: "Historias para Dormir",
    duration: 35,
    durationLabel: "35 min",
    description:
      "En lo profundo de una montaña existe una caverna donde los sonidos duermen. Quien la visita en sueños despierta renovado, como si hubiera dormido toda una vida.",
    benefits: ["Sueño muy profundo", "Regeneración total", "Imágenes vívidas", "Despertar fresco"],
    instruments: ["Voz guía", "Gong tibetano", "Cuencos de bronce profundo"],
    image: require("@/assets/images/sessions/session-16.jpg"),
    frequency: "Delta 0.5–2 Hz",
    isNew: true,
  },

  // ── Historias Infantiles ───────────────────────────────────────────────────
  {
    id: "17",
    title: "El Cuenco Mágico",
    subtitle: "Historias Infantiles",
    categoryId: "historias-infantiles",
    sleepTag: "Historias Infantiles" as const,
    categoryLabel: "Historias Infantiles",
    duration: 15,
    durationLabel: "15 min",
    description:
      "Un cuenco especial que vive en el estante de una niña. Cada noche, cuando ella lo toca suavemente, el sonido pinta colores en el aire y la lleva a dormir entre estrellas.",
    benefits: ["Sueño infantil", "Imaginación activa", "Calma para niños", "Rituales de sueño"],
    instruments: ["Cuenco tibetano pequeño", "Voz narrativa suave", "Campanillas"],
    image: require("@/assets/images/sessions/session-17.jpg"),
    isNew: true,
  },
  {
    id: "18",
    title: "Viaje al Reino de los Sueños",
    subtitle: "Historias Infantiles",
    categoryId: "historias-infantiles",
    sleepTag: "Historias Infantiles" as const,
    categoryLabel: "Historias Infantiles",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Una nube suave lleva a los niños por el cielo nocturno. En cada estrella que tocan hay un sonido, y juntos forman la melodía que abre las puertas del reino de los sueños.",
    benefits: ["Transición al sueño", "Aventura imaginaria", "Descanso profundo", "Confianza y seguridad"],
    instruments: ["Cuencos de cuarzo", "Voz narrativa", "Campanas de viento"],
    image: require("@/assets/images/sessions/session-18.jpg"),
    isNew: true,
  },
  // ── Música y Sonidos ──────────────────────────────────────────────────────
  {
    id: "20",
    title: "Sonidos de la Naturaleza",
    subtitle: "Atmósfera Natural",
    categoryId: "musica-sonidos",
    categoryLabel: "Música y Sonidos",
    duration: 10,
    durationLabel: "10 min",
    description:
      "Un paisaje sonoro envuelto en el pad cálido de Mi mayor. Cierra los ojos y habita el momento presente.",
    benefits: ["Presencia plena", "Alivio de ansiedad", "Relajación instantánea", "Claridad mental"],
    instruments: ["Pad Mi mayor", "Atmósfera natural"],
    image: require("@/assets/images/sessions/session-20-musica-dark.jpg"),
    audio: require("@/assets/audio/sesion2_pad_mi_mayor.mp3"),
    isNew: true,
    soundTag: "Sonidos Naturaleza",
  },
  {
    id: "21",
    title: "Lluvia de Bosque",
    subtitle: "Sonidos Naturales",
    categoryId: "musica-sonidos",
    categoryLabel: "Música y Sonidos",
    duration: 15,
    durationLabel: "15 min",
    description:
      "El sonido suave de la lluvia cayendo sobre hojas de bosque antiguo. Una experiencia sonora que disuelve el ruido mental y devuelve la calma natural.",
    benefits: ["Relajación profunda", "Sueño suave", "Calma instantánea", "Presencia plena"],
    instruments: ["Lluvia", "Viento suave", "Naturaleza"],
    image: require("@/assets/images/sessions/session-3-musica-dark.jpg"),
    isNew: true,
    soundTag: "Sonidos Naturaleza",
  },
  {
    id: "22",
    title: "Orilla del Mar",
    subtitle: "Sonidos Naturales",
    categoryId: "musica-sonidos",
    categoryLabel: "Música y Sonidos",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Las olas llegando y retirándose sobre la arena. Cada ciclo del mar es un recordatorio de que todo pasa y todo vuelve. Suéltate al ritmo del océano.",
    benefits: ["Descanso mental", "Reducción del estrés", "Ritmo natural", "Sueño reparador"],
    instruments: ["Olas del mar", "Brisa marina", "Naturaleza costera"],
    image: require("@/assets/images/sessions/session-5-musica-dark.jpg"),
    isNew: true,
    soundTag: "Sonidos Naturaleza",
  },
  {
    id: "23",
    title: "Binaural Alpha 8Hz",
    subtitle: "Ondas Cerebrales",
    categoryId: "musica-sonidos",
    categoryLabel: "Música y Sonidos",
    duration: 30,
    durationLabel: "30 min",
    description:
      "Frecuencias binaurales en la banda Alpha (8–12 Hz). Ideal para estados de calma alerta, creatividad fluida y reducción de ansiedad. Usar con auriculares.",
    benefits: ["Estado alpha", "Creatividad", "Calma alerta", "Anti-estrés"],
    instruments: ["Frecuencias binaurales alpha", "Tono base suave"],
    image: require("@/assets/images/sessions/session-8-musica-dark.jpg"),
    isNew: true,
    frequency: "Alpha 8–12 Hz",
    soundTag: "Binaural",
  },
  {
    id: "24",
    title: "Binaural Theta Nocturno",
    subtitle: "Ondas Cerebrales",
    categoryId: "musica-sonidos",
    categoryLabel: "Música y Sonidos",
    duration: 45,
    durationLabel: "45 min",
    description:
      "Frecuencias theta (4–8 Hz) para inducir estados de meditación profunda y sueño lúcido. Una transición suave hacia el descanso más reparador de tu noche.",
    benefits: ["Meditación profunda", "Sueño lúcido", "Creatividad nocturna", "Descanso total"],
    instruments: ["Frecuencias binaurales theta", "Ambiente nocturno"],
    image: require("@/assets/images/sessions/session-9-musica-dark.jpg"),
    isNew: true,
    frequency: "Theta 4–8 Hz",
    soundTag: "Binaural",
  },
  {
    id: "25",
    title: "Música Ambient Dorada",
    subtitle: "Música Meditativa",
    categoryId: "musica-sonidos",
    categoryLabel: "Música y Sonidos",
    duration: 25,
    durationLabel: "25 min",
    description:
      "Capas de sintetizadores cálidos y cuencos de cuarzo crean una atmósfera dorada perfecta para meditar, leer o simplemente estar presente sin hacer nada.",
    benefits: ["Ambiente meditativo", "Foco suave", "Presencia sin esfuerzo", "Calma creativa"],
    instruments: ["Sintetizadores ambient", "Cuencos de cuarzo", "Pad armónico"],
    image: require("@/assets/images/sessions/session-6-musica-dark.jpg"),
    isNew: true,
    soundTag: "Música",
  },
  {
    id: "26",
    title: "Piano y Cuencos",
    subtitle: "Música Meditativa",
    categoryId: "musica-sonidos",
    categoryLabel: "Música y Sonidos",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Notas de piano minimalistas entretejidas con el resonar de cuencos tibetanos. Una composición para abrir el corazón y soltar lo que ya no se necesita llevar.",
    benefits: ["Apertura emocional", "Claridad interior", "Calma profunda", "Bienestar general"],
    instruments: ["Piano acústico", "Cuencos tibetanos", "Silencio consciente"],
    image: require("@/assets/images/sessions/session-7-musica-dark.jpg"),
    isNew: true,
    soundTag: "Música",
  },
  // ── Meditaciones Guiadas ─────────────────────────────────────────────────
  {
    id: "28",
    title: "Prueba 1",
    subtitle: "Meditación Guiada con Cuencos",
    categoryId: "meditaciones-guiadas",
    categoryLabel: "Meditaciones Guiadas",
    duration: 10,
    durationLabel: "10 min",
    description:
      "Una meditación guiada con la voz de Casa del Cuenco acompañada de un fondo de cuencos tibetanos. Permítete soltar, respirar y volver a ti.",
    benefits: ["Calma profunda", "Presencia plena", "Conexión interior", "Relajación"],
    instruments: ["Cuencos tibetanos", "Voz guiada"],
    image: require("@/assets/images/sessions/session-28.jpg"),
    isNew: true,
    meditationTag: "Visualizaciones",
  },

  {
    id: "27",
    title: "Riachuelo con Pájaros",
    subtitle: "Sonidos Naturales",
    categoryId: "musica-sonidos",
    categoryLabel: "Música y Sonidos",
    duration: 10,
    durationLabel: "10 min",
    description:
      "El suave murmullo de un riachuelo de montaña acompañado por el canto de los pájaros. Un refugio sonoro que devuelve a la mente su ritmo natural, disuelve la tensión y abre el corazón a la presencia.",
    benefits: ["Calma instantánea", "Conexión con la naturaleza", "Reducción del estrés", "Presencia plena"],
    instruments: ["Agua corriente", "Canto de pájaros", "Ambiente natural"],
    image: require("@/assets/images/sessions/session-27-musica-dark.jpg"),
    audio: require("@/assets/audio/riachuelo_pajaros.mp3"),
    isNew: true,
    soundTag: "Sonidos Naturaleza",
  },

  {
    id: "19",
    title: "La Tortuga y el Gong",
    subtitle: "Historias Infantiles",
    categoryId: "historias-infantiles",
    sleepTag: "Historias Infantiles" as const,
    categoryLabel: "Historias Infantiles",
    duration: 12,
    durationLabel: "12 min",
    description:
      "Una tortuga sabia que vive junto al mar tiene un gong muy antiguo. Cuando lo toca al atardecer, todos los animales del bosque se detienen, respiran y se preparan para dormir.",
    benefits: ["Ritual de sueño", "Calma profunda", "Respiración consciente", "Amor por la naturaleza"],
    instruments: ["Gong suave", "Voz narrativa", "Sonidos del mar"],
    image: require("@/assets/images/sessions/session-19.jpg"),
    isNew: true,
  },

  // ── Prueba Maestra 2 ───────────────────────────────────────────────────────
  {
    id: "30",
    title: "Prueba Maestra 2",
    subtitle: "Binaural",
    categoryId: "musica-sonidos",
    categoryLabel: "Música y Sonidos",
    duration: 20,
    durationLabel: "20 min",
    description: "Esta es una prueba maestra 2.",
    benefits: ["Energía matutina", "Claridad mental", "Activación suave", "Foco natural"],
    instruments: ["Binaural", "Sonido ambiente"],
    image: require("@/assets/images/sessions/session-2-musica-dark.jpg"),
    soundTag: "Binaural" as const,
    themeTag: ["Energiza tus mañanas"] as const,
    sleepTag: "ASMR Expansivos" as const,
    isNew: true,
  },

  // ── Prueba Maestra 1 ───────────────────────────────────────────────────────
  {
    id: "29",
    title: "Prueba Maestra 1",
    subtitle: "Cuencos Tibetanos",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonidos Ancestrales",
    duration: 20,
    durationLabel: "20 min",
    description: "Esta es una prueba maestra.",
    benefits: ["Relajación profunda", "Calma interior", "Vibración ancestral", "Presencia plena"],
    instruments: ["Cuencos Tibetanos"],
    image: require("@/assets/images/sessions/session-2.jpg"),
    ancestralTag: "Cuencos Tibetanos" as const,
    themeTag: ["Para la ansiedad"] as const,
    sleepTag: "Sonidos Binaurales" as const,
    isNew: true,
  },
];

export function getSessionsByCategory(categoryId: string): Session[] {
  return SESSIONS.filter((s) => s.categoryId === categoryId);
}

export function getSessionsBySleepTag(sleepTag: SleepTag): Session[] {
  return SESSIONS.filter((s) => s.sleepTag === sleepTag);
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
