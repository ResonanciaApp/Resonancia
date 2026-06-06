export type SoundTag = "Música Ambient" | "Música Enteógena" | "Música Tribal" | "Música Étnica";
export type MeditationTag =
  | "No Duales"
  | "Visualizaciones"
  | "Mantras"
  | "Escaneo Corporal"
  | "Manifestación"
  | "3 Minutos de Sabiduría";

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

export type SonidosTag = "Sonidos Binaurales" | "Sonidos Naturaleza" | "Sonidos Atmosféricos" | "Sonidos Hipnóticos";

export type AncestralTag =
  | "Cuencos Tibetanos"
  | "Cuencos de Cuarzo"
  | "Mix de Cuencos"
  | "Gongs"
  | "Cuencos y Gongs"
  | "Full Instrumentos"
  | "Vientos"
  | "Cantos"
  | "Percusión"
  | "Selva";

import type { SleepTag, ThemeTag } from "@/data/tags";

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
  image: import("react-native").ImageSourcePropType;
  audio?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  frequency?: string;
  soundTag?: SoundTag;
  meditationTag?: MeditationTag;
  ancestralTag?: AncestralTag;
  sabiduriaTag?: SabiduriaTag;
  podcastTag?: PodcastTag;
  sonidosTag?: SonidosTag;
  themeTag?: ThemeTag[];
  sleepTag?: SleepTag;
  /**
   * Etiqueta de voz mostrada en las cards. Controlada desde el panel admin.
   * - `undefined` → sesión bundleada (caption derivado de VOICE_MAP: "Guiada"/"Sin voz").
   * - `null` → sesión de DB sin etiqueta (caption vacío).
   * - `"Guiada" | "Sin voz"` → caption fijado por el admin.
   */
  voiceTag?: "Guiada" | "Sin voz" | null;
  /** Guiador de la meditación (ver data/guides.ts). Si se omite → Casa del Cuenco. */
  guideId?: string;
  /** Invitados del podcast (además del anfitrión fijo). instagram opcional → fila tappable. */
  guests?: { name: string; role: string; instagram?: string }[];
  /** ID del artista (de data/artists.ts). Solo para Música Ambient/Enteógena. Si se omite → Resonancia. */
  artistId?: string;
  /** URL de audio principal para sesiones subidas vía admin (no bundleadas). */
  audioUri?: string;
  /** URL de voz guía para sesiones subidas vía admin (no bundleadas). */
  voiceUri?: string;
};

export const SESSIONS: Session[] = [
  {
    id: "1",
    title: "Adentro de uno mismo",
    subtitle: "Meditación Guiada",
    categoryId: "meditaciones-guiadas",
    categoryLabel: "Meditaciones",
    duration: 30,
    durationLabel: "30 min",
    description:
      "Un viaje guiado hacia el centro de tu ser. El sonido de los cuencos te acompaña suavemente mientras te sumerges en las capas más profundas de tu interior, encontrando quietud y claridad.",
    benefits: ["Relajación profunda", "Claridad mental", "Conexión interior", "Paz duradera"],
    instruments: ["Cuencos tibetanos", "Campana", "Voz guía"],
    image: require("@/assets/images/sessions/session-1.jpg"),
    isFeatured: true,
    meditationTag: "Visualizaciones",
    guideId: "sofia-ramirez",
  },
  {
    id: "2",
    title: "Para dormir bien",
    subtitle: "Baño de Cuencos y Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Ancestrales",
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
    id: "5",
    title: "Más allá del sonido",
    subtitle: "Consejo del Día",
    categoryId: "meditaciones-guiadas",
    categoryLabel: "Meditaciones",
    meditationTag: "3 Minutos de Sabiduría" as const,
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
    id: "7",
    isPremium: true,
    title: "Prueba",
    subtitle: "Meditación Guiada",
    categoryId: "meditaciones-guiadas",
    categoryLabel: "Meditaciones",
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
  {
    id: "8",
    title: "Ondas Delta para Dormir",
    subtitle: "Sonidos Binaurales con Cuencos",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Ancestrales",
    ancestralTag: "Cuencos Tibetanos" as const,
    sleepTag: "Sonidos Binaurales" as const,
    duration: 45,
    durationLabel: "45 min",
    description:
      "Frecuencias binaurales delta entretejidas con el canto de cuencos tibetanos. Tu cerebro es guiado suavemente hacia el estado de sueño más profundo y reparador.",
    benefits: ["Sueño profundo", "Reducción del estrés", "Regeneración celular", "Paz mental"],
    instruments: ["Cuencos tibetanos", "Frecuencias binaurales delta"],
    image: require("@/assets/images/sessions/session-9.jpg"),
    frequency: "Delta 1–4 Hz",
    isNew: true,
  },
  {
    id: "9",
    title: "Theta Profundo con Cuencos",
    subtitle: "Sonidos Binaurales con Cuencos",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Ancestrales",
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
    isPremium: true,
    title: "Sincronización Gamma 40Hz",
    subtitle: "Sonidos Binaurales con Cuencos",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Ancestrales",
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
  {
    id: "20",
    title: "Sonidos de la Naturaleza",
    subtitle: "Atmósfera Natural",
    categoryId: "podcast",
    categoryLabel: "Sonidos",
    duration: 10,
    durationLabel: "10 min",
    description:
      "Un paisaje sonoro envuelto en el pad cálido de Mi mayor. Cierra los ojos y habita el momento presente.",
    benefits: ["Presencia plena", "Alivio de ansiedad", "Relajación instantánea", "Claridad mental"],
    instruments: ["Pad Mi mayor", "Atmósfera natural"],
    image: require("@/assets/images/sessions/session-20-musica-dark.jpg"),
    audio: require("@/assets/audio/sesion2_pad_mi_mayor.mp3"),
    isNew: true,
    sonidosTag: "Sonidos Naturaleza",
  },
  {
    id: "21",
    title: "Lluvia de Bosque",
    subtitle: "Sonidos Naturales",
    categoryId: "podcast",
    categoryLabel: "Sonidos",
    duration: 15,
    durationLabel: "15 min",
    description:
      "El sonido suave de la lluvia cayendo sobre hojas de bosque antiguo. Una experiencia sonora que disuelve el ruido mental y devuelve la calma natural.",
    benefits: ["Relajación profunda", "Sueño suave", "Calma instantánea", "Presencia plena"],
    instruments: ["Lluvia", "Viento suave", "Naturaleza"],
    image: require("@/assets/images/sessions/session-3-musica-dark.jpg"),
    isNew: true,
    sonidosTag: "Sonidos Naturaleza",
  },
  {
    id: "22",
    title: "Orilla del Mar",
    subtitle: "Sonidos Naturales",
    categoryId: "podcast",
    categoryLabel: "Sonidos",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Las olas llegando y retirándose sobre la arena. Cada ciclo del mar es un recordatorio de que todo pasa y todo vuelve. Suéltate al ritmo del océano.",
    benefits: ["Descanso mental", "Reducción del estrés", "Ritmo natural", "Sueño reparador"],
    instruments: ["Olas del mar", "Brisa marina", "Naturaleza costera"],
    image: require("@/assets/images/sessions/session-5-musica-dark.jpg"),
    isNew: true,
    sonidosTag: "Sonidos Naturaleza",
  },
  {
    id: "23",
    isPremium: true,
    title: "Binaural Alpha 8Hz",
    subtitle: "Ondas Cerebrales",
    categoryId: "musica-sonidos",
    categoryLabel: "Frecuencias",
    duration: 30,
    durationLabel: "30 min",
    description:
      "Frecuencias binaurales en la banda Alpha (8–12 Hz). Ideal para estados de calma alerta, creatividad fluida y reducción de ansiedad. Usar con auriculares.",
    benefits: ["Estado alpha", "Creatividad", "Calma alerta", "Anti-estrés"],
    instruments: ["Frecuencias binaurales alpha", "Tono base suave"],
    image: require("@/assets/images/sessions/session-8-musica-dark.jpg"),
    isNew: true,
    frequency: "Alpha 8–12 Hz",
    soundTag: "Música Ambient",
  },
  {
    id: "24",
    isPremium: true,
    title: "Binaural Theta Nocturno",
    subtitle: "Ondas Cerebrales",
    categoryId: "musica-sonidos",
    categoryLabel: "Frecuencias",
    duration: 45,
    durationLabel: "45 min",
    description:
      "Frecuencias theta (4–8 Hz) para inducir estados de meditación profunda y sueño lúcido. Una transición suave hacia el descanso más reparador de tu noche.",
    benefits: ["Meditación profunda", "Sueño lúcido", "Creatividad nocturna", "Descanso total"],
    instruments: ["Frecuencias binaurales theta", "Ambiente nocturno"],
    image: require("@/assets/images/sessions/session-9-musica-dark.jpg"),
    isNew: true,
    frequency: "Theta 4–8 Hz",
    soundTag: "Música Ambient",
  },
  {
    id: "25",
    isPremium: true,
    title: "Música Ambient Dorada",
    subtitle: "Música Meditativa",
    categoryId: "musica-sonidos",
    categoryLabel: "Frecuencias",
    duration: 25,
    durationLabel: "25 min",
    description:
      "Capas de sintetizadores cálidos y cuencos de cuarzo crean una atmósfera dorada perfecta para meditar, leer o simplemente estar presente sin hacer nada.",
    benefits: ["Ambiente meditativo", "Foco suave", "Presencia sin esfuerzo", "Calma creativa"],
    instruments: ["Sintetizadores ambient", "Cuencos de cuarzo", "Pad armónico"],
    image: require("@/assets/images/sessions/session-6-musica-dark.jpg"),
    isNew: true,
    soundTag: "Música Ambient",
    artistId: "lumen-sonora",
  },
  {
    id: "26",
    isPremium: true,
    title: "Piano y Cuencos",
    subtitle: "Música Meditativa",
    categoryId: "musica-sonidos",
    categoryLabel: "Frecuencias",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Notas de piano minimalistas entretejidas con el resonar de cuencos tibetanos. Una composición para abrir el corazón y soltar lo que ya no se necesita llevar.",
    benefits: ["Apertura emocional", "Claridad interior", "Calma profunda", "Bienestar general"],
    instruments: ["Piano acústico", "Cuencos tibetanos", "Silencio consciente"],
    image: require("@/assets/images/sessions/session-7-musica-dark.jpg"),
    isNew: true,
    soundTag: "Música Ambient",
    artistId: "raiz-profunda",
  },
  {
    id: "28",
    title: "Prueba 1",
    subtitle: "Meditación Guiada con Cuencos",
    categoryId: "meditaciones-guiadas",
    categoryLabel: "Meditaciones",
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
    isPremium: true,
    title: "Riachuelo con Pájaros",
    subtitle: "Sonidos Naturales",
    categoryId: "podcast",
    categoryLabel: "Sonidos",
    duration: 10,
    durationLabel: "10 min",
    description:
      "El suave murmullo de un riachuelo de montaña acompañado por el canto de los pájaros. Un refugio sonoro que devuelve a la mente su ritmo natural, disuelve la tensión y abre el corazón a la presencia.",
    benefits: ["Calma instantánea", "Conexión con la naturaleza", "Reducción del estrés", "Presencia plena"],
    instruments: ["Agua corriente", "Canto de pájaros", "Ambiente natural"],
    image: require("@/assets/images/sessions/session-27-musica-dark.jpg"),
    audio: require("@/assets/audio/riachuelo_pajaros.mp3"),
    isNew: true,
    sonidosTag: "Sonidos Naturaleza",
  },
  {
    id: "30",
    isPremium: true,
    title: "Prueba Maestra 2",
    subtitle: "Binaural",
    categoryId: "musica-sonidos",
    categoryLabel: "Frecuencias",
    duration: 20,
    durationLabel: "20 min",
    description: "Esta es una prueba maestra 2.",
    benefits: ["Energía matutina", "Claridad mental", "Activación suave", "Foco natural"],
    instruments: ["Binaural", "Sonido ambiente"],
    image: require("@/assets/images/sessions/session-20.jpg"),
    soundTag: "Música Ambient" as const,
    themeTag: ["Energiza tus mañanas"] as const,
    sleepTag: "ASMR Expansivos" as const,
    isNew: true,
  },
  {
    id: "29",
    title: "Prueba Maestra 1",
    subtitle: "Cuencos Tibetanos",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Ancestrales",
    duration: 20,
    durationLabel: "20 min",
    description: "Esta es una prueba maestra.",
    benefits: ["Relajación profunda", "Calma interior", "Vibración ancestral", "Presencia plena"],
    instruments: ["Cuencos Tibetanos"],
    image: require("@/assets/images/sessions/ancestral-instrumentos.jpg"),
    ancestralTag: "Cuencos Tibetanos" as const,
    themeTag: ["Para la ansiedad"] as const,
    sleepTag: "Sonidos Binaurales" as const,
    isNew: true,
  },
  {
    id: "31",
    isPremium: true,
    title: "Selva Enteógena",
    subtitle: "Música Enteógena",
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
    duration: 40,
    durationLabel: "40 min",
    description:
      "Una travesía sonora profunda inspirada en rituales amazónicos. Capas de percusión orgánica, drones y texturas enteógenas que disuelven la mente ordinaria y abren portales hacia lo invisible.",
    benefits: ["Expansión de consciencia", "Profundidad emocional", "Soltar el control", "Viaje interior"],
    instruments: ["Percusión ritual", "Drones", "Sintetizadores orgánicos"],
    image: require("@/assets/images/sessions/session-9-musica-dark.jpg"),
    soundTag: "Música Enteógena" as const,
    artistId: "lumen-sonora",
    isNew: true,
  },
  {
    id: "32",
    isPremium: true,
    title: "Cacao Ceremonial",
    subtitle: "Música Enteógena",
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
    duration: 50,
    durationLabel: "50 min",
    description:
      "Composición diseñada para ceremonias de cacao: apertura del corazón, sentir la gratitud y conectar con la tierra. Un viaje musical que acompaña desde la apertura hasta la integración.",
    benefits: ["Apertura del corazón", "Gratitud", "Conexión con la tierra", "Integración"],
    instruments: ["Tambor chamánico", "Flautas nativas", "Texturas ambientales"],
    image: require("@/assets/images/sessions/session-2-musica-dark.jpg"),
    soundTag: "Música Enteógena" as const,
    artistId: "raiz-profunda",
    isNew: true,
  },
  {
    id: "33",
    isPremium: true,
    title: "Cuencos del Alba",
    subtitle: "Música Étnica",
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
    duration: 30,
    durationLabel: "30 min",
    description:
      "Una composición musical que incorpora cuencos tibetanos, gongs y campanas ancestrales sobre una base ambient. Distinta a la práctica de cuencos: aquí los sonidos ancestrales son el lenguaje de una pieza musical continua.",
    benefits: ["Vibración profunda", "Limpieza energética", "Presencia plena", "Calma duradera"],
    instruments: ["Cuencos tibetanos", "Gongs de borde", "Campanas tingsha"],
    image: require("@/assets/images/sessions/session-20-musica-dark.jpg"),
    soundTag: "Música Étnica" as const,
    isNew: true,
  },
  {
    id: "34",
    isPremium: true,
    title: "Didgeridoo y Tambor",
    subtitle: "Música Étnica",
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
    duration: 25,
    durationLabel: "25 min",
    description:
      "El resonar del didgeridoo se entrelaza con el pulso del tambor chamánico para crear un campo sonoro primitivo y poderoso. Música que ancla el cuerpo en la tierra y aquieta la mente.",
    benefits: ["Conexión con la tierra", "Anclaje corporal", "Calma mental", "Vibración ancestral"],
    instruments: ["Didgeridoo", "Tambor chamánico", "Ambiente natural"],
    image: require("@/assets/images/sessions/session-27-musica-dark.jpg"),
    soundTag: "Música Étnica" as const,
    isNew: true,
  },
  {
    id: "35",
    isPremium: true,
    title: "Delta Profundo",
    subtitle: "Ondas Cerebrales",
    categoryId: "podcast",
    categoryLabel: "Sonidos",
    duration: 60,
    durationLabel: "60 min",
    description:
      "Frecuencias binaurales en la banda Delta (0.5–4 Hz) para inducir sueño profundo y regeneración celular. Usar con auriculares para la experiencia completa.",
    benefits: ["Sueño profundo", "Regeneración celular", "Descanso total", "Meditación profunda"],
    instruments: ["Frecuencias binaurales delta", "Ruido rosa suave"],
    image: require("@/assets/images/sessions/session-9.jpg"),
    sonidosTag: "Sonidos Binaurales" as const,
    isNew: true,
  },
  {
    id: "36",
    isPremium: true,
    title: "Gamma 40Hz — Claridad",
    subtitle: "Ondas Cerebrales",
    categoryId: "podcast",
    categoryLabel: "Sonidos",
    duration: 30,
    durationLabel: "30 min",
    description:
      "Frecuencias Gamma (40 Hz) asociadas a estados de alta cognición, claridad mental y percepción expandida. Ideal para sesiones de estudio profundo o meditación activa.",
    benefits: ["Claridad mental", "Cognición elevada", "Foco intenso", "Percepción expandida"],
    instruments: ["Frecuencias binaurales gamma", "Tono base suave"],
    image: require("@/assets/images/sessions/session-10.jpg"),
    sonidosTag: "Sonidos Binaurales" as const,
    isNew: true,
  },
  {
    id: "37",
    title: "Selva Tropical",
    subtitle: "Sonidos Naturales",
    categoryId: "podcast",
    categoryLabel: "Sonidos",
    duration: 45,
    durationLabel: "45 min",
    description:
      "La sinfonía viva de una selva tropical en su plenitud: aves exóticas, insectos nocturnos, lluvia suave sobre el dosel verde. Un refugio sonoro para salir del ruido mental.",
    benefits: ["Conexión con la naturaleza", "Calma instantánea", "Presencia plena", "Sueño suave"],
    instruments: ["Aves tropicales", "Insectos", "Lluvia de selva"],
    image: require("@/assets/images/sessions/session-1.jpg"),
    sonidosTag: "Sonidos Naturaleza" as const,
    isNew: true,
  },
  {
    id: "38",
    title: "Río de Montaña",
    subtitle: "Sonidos Naturales",
    categoryId: "podcast",
    categoryLabel: "Sonidos",
    duration: 30,
    durationLabel: "30 min",
    description:
      "El fluir constante de un río de montaña limpio y fresco. Cada gorgoteo del agua sobre las piedras ancla la mente al momento presente y disuelve la tensión acumulada.",
    benefits: ["Anclaje al presente", "Reducción del estrés", "Claridad mental", "Relajación natural"],
    instruments: ["Agua corriente", "Viento suave", "Naturaleza andina"],
    image: require("@/assets/images/sessions/session-2.jpg"),
    sonidosTag: "Sonidos Naturaleza" as const,
    isNew: true,
  },
  {
    id: "39",
    isPremium: true,
    title: "Tormenta Eléctrica",
    subtitle: "Atmósfera",
    categoryId: "podcast",
    categoryLabel: "Sonidos",
    duration: 50,
    durationLabel: "50 min",
    description:
      "El drama sonoro de una tormenta eléctrica lejana: truenos que reverberan, lluvia intensa y el silencio eléctrico entre relámpagos. Ideal para enfocarse o conciliar el sueño.",
    benefits: ["Concentración profunda", "Sueño reparador", "Presencia emocional", "Calma dramática"],
    instruments: ["Truenos", "Lluvia intensa", "Viento", "Silencio eléctrico"],
    image: require("@/assets/images/sessions/session-4.jpg"),
    sonidosTag: "Sonidos Atmosféricos" as const,
    isNew: true,
  },
  {
    id: "40",
    isPremium: true,
    title: "Espacio Profundo",
    subtitle: "Atmósfera",
    categoryId: "podcast",
    categoryLabel: "Sonidos",
    duration: 60,
    durationLabel: "60 min",
    description:
      "Drones atmosféricos inspirados en los sonidos captados por la NASA del espacio profundo. Una experiencia de vastedad y silencio que disuelve los límites del yo.",
    benefits: ["Expansión de consciencia", "Perspectiva cósmica", "Meditación profunda", "Silencio interior"],
    instruments: ["Drones espaciales", "Texturas electrónicas", "Ruido blanco filtrado"],
    image: require("@/assets/images/sessions/session-5.jpg"),
    sonidosTag: "Sonidos Atmosféricos" as const,
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

/**
 * Snapshot remoto de una sesión (lo que devuelve GET /catalog). No incluye los
 * assets bundleados (`image`, `audio`), que se resuelven localmente por id.
 */
export type CatalogSessionSnapshot = {
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
  isFeatured: boolean;
  isNew: boolean;
  isPremium: boolean;
  frequency?: string | null;
  soundTag?: string | null;
  meditationTag?: string | null;
  ancestralTag?: string | null;
  sabiduriaTag?: string | null;
  podcastTag?: string | null;
  sonidosTag?: string | null;
  themeTag?: string[] | null;
  sleepTag?: string | null;
  voiceTag?: string | null;
  guideId?: string | null;
  artistId?: string | null;
  guests?: { name: string; role: string; instagram?: string | null }[] | null;
  /** URL de imagen (para sesiones nuevas no bundleadas). */
  imageUrl?: string | null;
  /** Archivos de audio (para sesiones nuevas no bundleadas). */
  audioFiles?: { role: string; url?: string | null; name: string }[];
};

/** Convierte un objectPath de storage en URL absoluta cargable. */
function resolveObjectPath(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:/i.test(path)) return path;
  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const serving = path.startsWith("/objects/")
    ? path.replace(/^\/objects\//, "/api/storage/objects/")
    : path.startsWith("/")
      ? path
      : `/${path}`;
  return `${base}${serving}`;
}

/**
 * Hidrata SESSIONS in-place con el snapshot del servidor (merge por id),
 * conservando `image` y `audio` bundleados.
 * Sesiones del servidor que no existen en el bundle se insertan al final
 * del array con los assets resueltos desde Object Storage.
 */
export function applyCatalogSnapshot(remote: CatalogSessionSnapshot[]): void {
  const byId = new Map(remote.map((s) => [s.id, s]));

  // 1. Actualizar sesiones bundleadas in-place.
  for (const local of SESSIONS) {
    const r = byId.get(local.id);
    if (!r) continue;
    local.title = r.title;
    local.subtitle = r.subtitle;
    local.categoryId = r.categoryId;
    local.categoryLabel = r.categoryLabel;
    local.duration = r.duration;
    local.durationLabel = r.durationLabel;
    local.description = r.description;
    local.benefits = r.benefits;
    local.instruments = r.instruments;
    local.isFeatured = r.isFeatured;
    local.isNew = r.isNew;
    local.isPremium = r.isPremium;
    local.frequency = r.frequency ?? undefined;
    local.soundTag = (r.soundTag ?? undefined) as SoundTag | undefined;
    local.meditationTag = (r.meditationTag ?? undefined) as MeditationTag | undefined;
    local.ancestralTag = (r.ancestralTag ?? undefined) as AncestralTag | undefined;
    local.sabiduriaTag = (r.sabiduriaTag ?? undefined) as SabiduriaTag | undefined;
    local.podcastTag = (r.podcastTag ?? undefined) as PodcastTag | undefined;
    local.sonidosTag = (r.sonidosTag ?? undefined) as SonidosTag | undefined;
    local.themeTag = (r.themeTag ?? undefined) as ThemeTag[] | undefined;
    local.sleepTag = (r.sleepTag ?? undefined) as SleepTag | undefined;
    // Sesión bundleada: solo sobrescribir si el admin fijó una etiqueta explícita.
    // Si el remoto viene vacío (null), dejar `undefined` para conservar el fallback
    // legacy de VOICE_MAP (la DB no distingue "sin fijar" de "vacío explícito" para bundles).
    if (r.voiceTag != null) {
      local.voiceTag = r.voiceTag as "Guiada" | "Sin voz";
    }
    local.guideId = r.guideId ?? undefined;
    local.artistId = r.artistId ?? undefined;
    local.guests = r.guests
      ? r.guests.map((g) => ({
          name: g.name,
          role: g.role,
          instagram: g.instagram ?? undefined,
        }))
      : undefined;
    // Si ya tenía audioUri del ciclo previo, no pisar.
    if (!local.audioUri && r.audioFiles?.length) {
      const main = r.audioFiles.find((a) => a.role === "main" || a.role === "base") ?? r.audioFiles[0];
      local.audioUri = resolveObjectPath(main.url);
      const voice = r.audioFiles.find((a) => a.role === "voice");
      if (voice) local.voiceUri = resolveObjectPath(voice.url);
    }
  }

  // 2. Insertar sesiones nuevas (subidas vía admin) que no están en el bundle.
  for (const r of remote) {
    if (SESSIONS.some((s) => s.id === r.id)) continue;
    const main = r.audioFiles?.find((a) => a.role === "main" || a.role === "base") ?? r.audioFiles?.[0];
    const voice = r.audioFiles?.find((a) => a.role === "voice");
    const image: import("react-native").ImageSourcePropType = r.imageUrl
      ? { uri: resolveObjectPath(r.imageUrl) }
      : require("@/assets/images/sessions/session-2.jpg");
    SESSIONS.push({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      categoryId: r.categoryId,
      categoryLabel: r.categoryLabel,
      duration: r.duration,
      durationLabel: r.durationLabel,
      description: r.description,
      benefits: r.benefits,
      instruments: r.instruments,
      image,
      isFeatured: r.isFeatured,
      isNew: r.isNew,
      isPremium: r.isPremium,
      frequency: r.frequency ?? undefined,
      soundTag: (r.soundTag ?? undefined) as SoundTag | undefined,
      meditationTag: (r.meditationTag ?? undefined) as MeditationTag | undefined,
      ancestralTag: (r.ancestralTag ?? undefined) as AncestralTag | undefined,
      sabiduriaTag: (r.sabiduriaTag ?? undefined) as SabiduriaTag | undefined,
      podcastTag: (r.podcastTag ?? undefined) as PodcastTag | undefined,
      sonidosTag: (r.sonidosTag ?? undefined) as SonidosTag | undefined,
      themeTag: (r.themeTag ?? undefined) as ThemeTag[] | undefined,
      sleepTag: (r.sleepTag ?? undefined) as SleepTag | undefined,
      voiceTag: (r.voiceTag ?? null) as "Guiada" | "Sin voz" | null,
      guideId: r.guideId ?? undefined,
      artistId: r.artistId ?? undefined,
      audioUri: main ? resolveObjectPath(main.url) : undefined,
      voiceUri: voice ? resolveObjectPath(voice.url) : undefined,
    });
  }
}
