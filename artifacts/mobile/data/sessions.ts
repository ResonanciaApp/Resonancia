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

import {
  DESCANSO_TAG_CARDS,
  SONIDOS_TAG_CARDS,
  type DescansoTag,
  type LegacyDescansoTag,
  type SleepTag,
  type SonidosCollectionTag,
  type ThemeTag,
} from "@/data/tags";

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
  /** Destacada dentro de su propia pantalla de categoría ("Destacados de [categoría]"). */
  isFeaturedCategory?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  /** Visible en catálogo, pero sin audio final. El reproductor muestra el aviso y deshabilita Play. */
  isPlaceholder?: boolean;
  skipDetail?: boolean;
  /** Al tocar la card: reproduce al instante y solo aparece el miniplayer (sin abrir pantallas). */
  skipMiniPlayer?: boolean;
  /** Loop infinito a nivel sesión (complementa LOOP_SESSIONS para bundles). */
  isLoop?: boolean;
  frequency?: string;
  soundTag?: SoundTag;
  meditationTag?: MeditationTag;
  ancestralTag?: AncestralTag;
  sabiduriaTag?: SabiduriaTag;
  podcastTag?: PodcastTag;
  sonidosTag?: SonidosTag;
  sonidosTags?: SonidosCollectionTag[];
  themeTag?: ThemeTag[];
  /** Etiquetas Nivel 2 (Temas): vinculan la sesión a los bloques de "Explorar todo". */
  temaTag?: string[];
  sleepTag?: SleepTag;
  /** @deprecated Compatibilidad con sesiones bundleadas anteriores. */
  descansoTag?: LegacyDescansoTag;
  descansoTags?: DescansoTag[];
  /**
   * Etiqueta de voz mostrada en las cards. Controlada desde el panel admin.
   * - `undefined` → sesión bundleada (caption derivado de VOICE_MAP: "Guiada"/"Sin voz").
   * - `null` → sesión de DB sin etiqueta (caption vacío).
   * - `"Guiada" | "Sin voz"` → caption fijado por el admin.
   */
  voiceTag?: "Guiada" | "Sin voz" | null;
  /** Guiador de la meditación (ver data/guides.ts). Si se omite → Casa del Cuenco. */
  guideId?: string;
  /** Múltiples guiadores (hasta 4). Tiene prioridad sobre guideId si se define. */
  guideIds?: string[];
  /** Invitados del podcast (además del anfitrión fijo). instagram opcional → fila tappable. */
  guests?: { name: string; role: string; instagram?: string }[];
  /** ID del artista (de data/artists.ts). Solo para Música Ambient/Enteógena. Si se omite → Resonancia. */
  artistId?: string;
  /** URL de audio principal para sesiones subidas vía admin (no bundleadas). */
  audioUri?: string;
  /** URL de voz guía para sesiones subidas vía admin (no bundleadas). */
  voiceUri?: string;
  /** Descripción corta mostrada en el reproductor (campo admin opcional). */
  playerDescription?: string;
  /** Fecha de creación ISO (solo sesiones de DB; para ordenar "Nuevas sesiones"). */
  createdAt?: string;
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
    meditationTag: "Visualizaciones",
    guideId: "sofia-ramirez",
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
    categoryLabel: "Sonoterapia",
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
    categoryLabel: "Sonoterapia",
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
    id: "20",
    title: "Sonidos de la Naturaleza",
    subtitle: "Atmósfera Natural",
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
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
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
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
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
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
    isFeatured: true,
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
    image: require("@/assets/images/sessions/session-66.jpg"),
    isNew: true,
    meditationTag: "Visualizaciones",
  },
  {
    id: "27",
    isPremium: true,
    title: "Riachuelo con Pájaros",
    subtitle: "Sonidos Naturales",
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
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
    categoryLabel: "Sonoterapia",
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
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
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
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
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
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
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
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
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
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
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
    categoryId: "musica-sonidos",
    categoryLabel: "Música",
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

  // ── Descanso — Relajaciones ──────────────────────────────────────────────
  {
    id: "41",
    title: "Soltar el día",
    subtitle: "Relajación",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Relajaciones" as const,
    duration: 20,
    durationLabel: "20 min",
    description: "Una relajación muscular progresiva que libera la tensión acumulada desde los pies hasta la cabeza, preparando el cuerpo para el descanso.",
    benefits: ["Liberación de tensión", "Relajación muscular", "Calma nerviosa", "Preparación para el sueño"],
    instruments: ["Voz guía", "Cuencos suaves", "Música de fondo"],
    image: require("@/assets/images/sessions/session-6.jpg"),
  },
  {
    id: "42",
    title: "Brisa nocturna",
    subtitle: "Relajación",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Relajaciones" as const,
    duration: 15,
    durationLabel: "15 min",
    description: "Deja que una brisa imaginaria recorra tu cuerpo disolviendo cada punto de tensión. Una práctica de relajación profunda con respiración consciente.",
    benefits: ["Respiración profunda", "Relajación instantánea", "Alivio del estrés", "Paz interior"],
    instruments: ["Voz guía", "Sonidos de brisa", "Cuencos de cristal"],
    image: require("@/assets/images/sessions/session-7.jpg"),
  },
  {
    id: "43",
    title: "Rendición total",
    subtitle: "Relajación",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Relajaciones" as const,
    duration: 25,
    durationLabel: "25 min",
    description: "Permítete rendirte por completo al descanso. Una guía de relajación profunda que invita a soltar el control y confiar en el cuerpo.",
    benefits: ["Rendición consciente", "Relajación total", "Reducción de ansiedad", "Sueño reparador"],
    instruments: ["Voz guía", "Drones suaves", "Campana tibetana"],
    image: require("@/assets/images/sessions/session-8.jpg"),
  },
  {
    id: "44",
    title: "Cuerpo de agua",
    subtitle: "Relajación",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Relajaciones" as const,
    duration: 18,
    durationLabel: "18 min",
    description: "Visualiza tu cuerpo convirtiéndose en agua tranquila. Una relajación profunda que disuelve los límites físicos y lleva la mente a la calma absoluta.",
    benefits: ["Disolución del estrés", "Relajación profunda", "Visualización guiada", "Calma mental"],
    instruments: ["Voz guía", "Sonidos de agua", "Cuencos tibetanos"],
    image: require("@/assets/images/sessions/session-9.jpg"),
  },
  {
    id: "45",
    title: "Noche estrellada",
    subtitle: "Relajación",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Relajaciones" as const,
    duration: 22,
    durationLabel: "22 min",
    description: "Bajo un cielo infinito de estrellas, la mente encuentra su quietud natural. Una relajación guiada con imágenes de la noche serena.",
    benefits: ["Expansión mental", "Relajación profunda", "Perspectiva cósmica", "Paz nocturna"],
    instruments: ["Voz guía", "Texturas espaciales", "Cuencos suaves"],
    image: require("@/assets/images/sessions/session-10.jpg"),
  },

  // ── Descanso — Sueño profundo ────────────────────────────────────────────
  {
    id: "46",
    title: "Delta profundo",
    subtitle: "Sueño profundo",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Sueño profundo" as const,
    duration: 45,
    durationLabel: "45 min",
    description: "Frecuencias delta de 1-4 Hz diseñadas para llevar el cerebro al estado de sueño más profundo y reparador. Ideal para noches de descanso total.",
    benefits: ["Sueño profundo", "Regeneración celular", "Descanso máximo", "Recuperación física"],
    instruments: ["Frecuencias delta", "Ruido rosa", "Drones suaves"],
    image: require("@/assets/images/sessions/session-11.jpg"),
  },
  {
    id: "47",
    title: "Umbral del sueño",
    subtitle: "Sueño profundo",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Sueño profundo" as const,
    duration: 30,
    durationLabel: "30 min",
    description: "Una transición suave desde la vigilia hasta el sueño profundo, guiando la mente a través del umbral hipnagógico con sonidos graduales.",
    benefits: ["Inicio del sueño", "Transición suave", "Relajación progresiva", "Descanso reparador"],
    instruments: ["Cuencos tibetanos", "Frecuencias theta", "Voz guía suave"],
    image: require("@/assets/images/sessions/session-12.jpg"),
  },
  {
    id: "48",
    title: "Mar sin orillas",
    subtitle: "Sueño profundo",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Sueño profundo" as const,
    duration: 60,
    durationLabel: "60 min",
    description: "El sonido continuo del océano profundo acompaña la mente hacia las capas más oscuras y tranquilas del sueño. Una inmersión total en el descanso.",
    benefits: ["Sueño sin interrupciones", "Calma profunda", "Reducción del ruido mental", "Descanso oceánico"],
    instruments: ["Olas del océano", "Frecuencias delta", "Ruido blanco suave"],
    image: require("@/assets/images/sessions/session-13.jpg"),
  },
  {
    id: "49",
    title: "Cueva de cristal",
    subtitle: "Sueño profundo",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Sueño profundo" as const,
    duration: 40,
    durationLabel: "40 min",
    description: "El resonar de los cuencos de cuarzo en un espacio interior imaginario lleva el sistema nervioso al reposo más completo y profundo.",
    benefits: ["Resonancia profunda", "Sueño reparador", "Desconexión mental", "Calma absoluta"],
    instruments: ["Cuencos de cuarzo", "Reverberación espacial", "Drones graves"],
    image: require("@/assets/images/sessions/session-14.jpg"),
  },
  {
    id: "50",
    title: "Noche sin pensamientos",
    subtitle: "Sueño profundo",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Sueño profundo" as const,
    duration: 50,
    durationLabel: "50 min",
    description: "Diseñada específicamente para quienes luchan contra la mente activa al dormir. Frecuencias y guía que disuelven el flujo de pensamientos nocturnos.",
    benefits: ["Silencio mental", "Descanso profundo", "Liberación de preocupaciones", "Inicio rápido del sueño"],
    instruments: ["Frecuencias delta", "Voz guía", "Cuencos tibetanos"],
    image: require("@/assets/images/sessions/session-15.jpg"),
  },

  // ── Descanso — Ruidos ────────────────────────────────────────────────────
  {
    id: "51",
    title: "Lluvia en el bosque",
    subtitle: "Ruidos",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Ruidos" as const,
    duration: 60,
    durationLabel: "60 min",
    description: "El sonido continuo de la lluvia sobre las hojas del bosque crea un manto sonoro perfecto para enmascarar el entorno y facilitar el sueño.",
    benefits: ["Enmascaramiento de ruido", "Relajación natural", "Ambiente acogedor", "Sueño continuo"],
    instruments: ["Lluvia", "Bosque", "Truenos lejanos"],
    image: require("@/assets/images/sessions/session-16.jpg"),
  },
  {
    id: "52",
    title: "Ruido blanco puro",
    subtitle: "Ruidos",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Ruidos" as const,
    duration: 60,
    durationLabel: "60 min",
    description: "Ruido blanco puro de alta calidad que bloquea las distracciones sonoras del entorno y crea el ambiente ideal para el sueño o la concentración.",
    benefits: ["Bloqueo de ruido", "Concentración", "Sueño sin interrupciones", "Ambiente neutro"],
    instruments: ["Ruido blanco"],
    image: require("@/assets/images/sessions/session-17.jpg"),
  },
  {
    id: "53",
    title: "Olas del Pacífico",
    subtitle: "Ruidos",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Ruidos" as const,
    duration: 60,
    durationLabel: "60 min",
    description: "El ritmo hipnótico de las olas del océano Pacífico rompiendo suavemente en la orilla. Un sonido ancestral que sincroniza la respiración con el mar.",
    benefits: ["Ritmo natural", "Relajación instantánea", "Respiración sincronizada", "Sueño profundo"],
    instruments: ["Olas del océano", "Brisa marina"],
    image: require("@/assets/images/sessions/session-18.jpg"),
  },
  {
    id: "54",
    title: "Arroyo en la montaña",
    subtitle: "Ruidos",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Ruidos" as const,
    duration: 45,
    durationLabel: "45 min",
    description: "El fluir constante de un arroyo de montaña entre piedras crea un ruido rosa natural que calma el sistema nervioso y facilita el descanso.",
    benefits: ["Ruido rosa natural", "Calma nerviosa", "Ambiente natural", "Sueño tranquilo"],
    instruments: ["Arroyo", "Pájaros lejanos", "Viento suave"],
    image: require("@/assets/images/sessions/session-19.jpg"),
  },
  {
    id: "55",
    title: "Ventilador nocturno",
    subtitle: "Ruidos",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Ruidos" as const,
    duration: 60,
    durationLabel: "60 min",
    description: "El zumbido constante y familiar de un ventilador de techo. Un ruido de fondo reconfortante que muchas personas asocian con el sueño tranquilo.",
    benefits: ["Ambiente familiar", "Enmascaramiento suave", "Sueño continuo", "Temperatura sonora"],
    instruments: ["Ventilador", "Ruido de fondo suave"],
    image: require("@/assets/images/sessions/session-20.jpg"),
  },

  // ── Descanso — Meditaciones ──────────────────────────────────────────────
  {
    id: "56",
    title: "Escaneo para dormir",
    subtitle: "Meditación",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Meditaciones" as const,
    duration: 20,
    durationLabel: "20 min",
    description: "Un escaneo corporal completo diseñado para el momento de acostarse. Recorre cada parte del cuerpo soltando tensión y preparando el sistema para el sueño.",
    benefits: ["Relajación corporal", "Sueño reparador", "Consciencia somática", "Preparación para dormir"],
    instruments: ["Voz guía", "Música suave", "Cuencos tibetanos"],
    image: require("@/assets/images/sessions/session-21.jpg"),
  },
  {
    id: "57",
    title: "Respiración 4-7-8",
    subtitle: "Meditación",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Meditaciones" as const,
    duration: 10,
    durationLabel: "10 min",
    description: "La técnica de respiración 4-7-8 del Dr. Andrew Weil, guiada con sonidos de cuencos. Activa el sistema nervioso parasimpático en minutos.",
    benefits: ["Activación parasimpática", "Reducción de ansiedad", "Inicio rápido del sueño", "Regulación nerviosa"],
    instruments: ["Voz guía", "Cuencos tibetanos"],
    image: require("@/assets/images/sessions/session-22.jpg"),
  },
  {
    id: "58",
    title: "Gratitud nocturna",
    subtitle: "Meditación",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Meditaciones" as const,
    duration: 15,
    durationLabel: "15 min",
    description: "Cierra el día con una meditación de gratitud que transforma las preocupaciones en reconocimiento y lleva el corazón a la paz antes de dormir.",
    benefits: ["Gratitud consciente", "Paz nocturna", "Cierre del día", "Bienestar emocional"],
    instruments: ["Voz guía", "Cuencos suaves", "Música de fondo"],
    image: require("@/assets/images/sessions/session-23.jpg"),
  },
  {
    id: "59",
    title: "Yoga Nidra",
    subtitle: "Meditación",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Meditaciones" as const,
    duration: 35,
    durationLabel: "35 min",
    description: "Una sesión completa de Yoga Nidra, el sueño yóguico consciente. Guía el cuerpo al borde del sueño mientras la mente permanece en una consciencia suave.",
    benefits: ["Estado hipnagógico", "Descanso profundo", "Consciencia expandida", "Sueño consciente"],
    instruments: ["Voz guía", "Cuencos tibetanos", "Frecuencias theta"],
    image: require("@/assets/images/sessions/session-24.jpg"),
  },
  {
    id: "60",
    title: "Soltar el mañana",
    subtitle: "Meditación",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Meditaciones" as const,
    duration: 12,
    durationLabel: "12 min",
    description: "Una meditación para quienes se van a dormir con preocupaciones sobre el futuro. Suelta el mañana, confía en el proceso y descansa en el presente.",
    benefits: ["Liberación del futuro", "Confianza", "Presente nocturno", "Sueño tranquilo"],
    instruments: ["Voz guía", "Cuencos suaves"],
    image: require("@/assets/images/sessions/session-25.jpg"),
  },

  // ── Descanso — Historias para dormir ────────────────────────────────────
  {
    id: "61",
    title: "El jardín de la luna",
    subtitle: "Historia para dormir",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Historias para dormir" as const,
    skipDetail: true,
    duration: 25,
    durationLabel: "25 min",
    description: "Un relato contemplativo sobre un jardín que solo florece bajo la luna llena. Una historia de belleza silenciosa y calma absoluta para el descanso.",
    benefits: ["Escape mental", "Relajación profunda", "Imágenes tranquilas", "Sueño inducido"],
    instruments: ["Voz narradora", "Música de fondo", "Sonidos de naturaleza"],
    image: require("@/assets/images/sessions/session-26.jpg"),
  },
  {
    id: "62",
    title: "La cabaña en la niebla",
    subtitle: "Historia para dormir",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Historias para dormir" as const,
    skipDetail: true,
    duration: 30,
    durationLabel: "30 min",
    description: "Una historia de regreso al hogar: una cabaña cálida en medio de un bosque silencioso. Un relato lento y reconfortante perfecto para cerrar los ojos.",
    benefits: ["Sensación de hogar", "Calma profunda", "Escape narrativo", "Sueño tranquilo"],
    instruments: ["Voz narradora", "Chimenea", "Lluvia suave"],
    image: require("@/assets/images/sessions/session-27.jpg"),
  },
  {
    id: "63",
    title: "Viaje en tren nocturno",
    subtitle: "Historia para dormir",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Historias para dormir" as const,
    skipDetail: true,
    duration: 28,
    durationLabel: "28 min",
    description: "A bordo de un tren que cruza paisajes nocturnos, el ritmo constante de las ruedas sobre los rieles hipnotiza y lleva la mente al descanso total.",
    benefits: ["Ritmo hipnótico", "Paisajes imaginados", "Relajación gradual", "Sueño profundo"],
    instruments: ["Voz narradora", "Sonido de tren", "Música suave"],
    image: require("@/assets/images/sessions/session-56.jpg"),
  },
  {
    id: "64",
    title: "La orilla al amanecer",
    subtitle: "Historia para dormir",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Historias para dormir" as const,
    skipDetail: true,
    duration: 22,
    durationLabel: "22 min",
    description: "Una historia de contemplación en la orilla del mar antes del amanecer. La soledad tranquila del agua y la brisa conducen a un descanso total.",
    benefits: ["Contemplación serena", "Presencia total", "Relajación natural", "Inicio del sueño"],
    instruments: ["Voz narradora", "Olas del mar", "Pájaros lejanos"],
    image: require("@/assets/images/sessions/session-29.jpg"),
  },
  {
    id: "65",
    title: "El templo del silencio",
    subtitle: "Historia para dormir",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Historias para dormir" as const,
    skipDetail: true,
    duration: 35,
    durationLabel: "35 min",
    description: "Un viaje narrativo a un templo antiguo donde el silencio es la única práctica. Una historia lenta y profunda que invita al descanso sin esfuerzo.",
    benefits: ["Silencio interior", "Relajación profunda", "Escape espiritual", "Sueño reparador"],
    instruments: ["Voz narradora", "Cuencos tibetanos", "Silencio"],
    image: require("@/assets/images/sessions/session-30.jpg"),
  },

  // ── Descanso — Historias infantiles ─────────────────────────────────────
  {
    id: "66",
    title: "La nube viajera",
    subtitle: "Historia infantil",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Historias infantiles" as const,
    skipDetail: true,
    duration: 15,
    durationLabel: "15 min",
    description: "Una pequeña nube que viaja por el cielo buscando el lugar perfecto para descansar. Un cuento suave y entrañable para los más pequeños.",
    benefits: ["Imaginación tranquila", "Sueño infantil", "Calma nocturna", "Mundo de sueños"],
    instruments: ["Voz narradora", "Música de cuna", "Sonidos suaves"],
    image: require("@/assets/images/sessions/session-31.jpg"),
  },
  {
    id: "67",
    title: "El guardián de las estrellas",
    subtitle: "Historia infantil",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Historias infantiles" as const,
    skipDetail: true,
    duration: 18,
    durationLabel: "18 min",
    description: "Un viejito sabio cuida las estrellas cada noche para que brillen mientras los niños duermen. Un cuento mágico lleno de ternura y calma.",
    benefits: ["Seguridad nocturna", "Imaginación dulce", "Sueño tranquilo", "Mundo mágico"],
    instruments: ["Voz narradora", "Música de caja de música", "Campanas suaves"],
    image: require("@/assets/images/sessions/session-32.jpg"),
  },
  {
    id: "68",
    title: "El río de los sueños",
    subtitle: "Historia infantil",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Historias infantiles" as const,
    skipDetail: true,
    duration: 20,
    durationLabel: "20 min",
    description: "Todos los sueños del mundo viajan por un río invisible. Esta noche, es tu turno de subir a la barca y dejarte llevar hacia aventuras increíbles.",
    benefits: ["Imaginación activa", "Transición al sueño", "Mundo onírico", "Calma nocturna"],
    instruments: ["Voz narradora", "Sonidos de río", "Música suave"],
    image: require("@/assets/images/sessions/session-33.jpg"),
  },
  {
    id: "69",
    title: "La tortuga lenta",
    subtitle: "Historia infantil",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Historias infantiles" as const,
    skipDetail: true,
    duration: 12,
    durationLabel: "12 min",
    description: "Una tortuga sabia enseña a los animales del bosque el arte de ir despacio y descansar bien. Un cuento sobre la calma y el poder del silencio.",
    benefits: ["Ritmo lento", "Calma aprendida", "Sueño precoz", "Valores tranquilos"],
    instruments: ["Voz narradora", "Sonidos del bosque", "Música tranquila"],
    image: require("@/assets/images/sessions/session-34.jpg"),
  },
  {
    id: "70",
    title: "Las semillas duermen",
    subtitle: "Historia infantil",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "Historias infantiles" as const,
    skipDetail: true,
    duration: 14,
    durationLabel: "14 min",
    description: "Bajo la tierra, las semillas descansan en la oscuridad antes de convertirse en flores. Un cuento sobre el poder transformador del descanso nocturno.",
    benefits: ["Metáfora del descanso", "Calma nocturna", "Sueño natural", "Crecimiento interior"],
    instruments: ["Voz narradora", "Sonidos de naturaleza", "Música de cuna"],
    image: require("@/assets/images/sessions/session-35.jpg"),
  },

  // ── Gongs (sesiones de prueba) ───────────────────────────────────────────
  {
    id: "71",
    title: "Gong del Templo Ancestral",
    subtitle: "Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonoterapia",
    ancestralTag: "Gongs" as const,
    duration: 30,
    durationLabel: "30 min",
    description: "El resonar profundo de un gong de bronce colgado en un templo milenario. Sus ondas atraviesan el cuerpo y disuelven la tensión acumulada, devolviendo el equilibrio.",
    benefits: ["Relajación profunda", "Liberación de tensión", "Presencia plena", "Equilibrio energético"],
    instruments: ["Gong de bronce", "Cuencos de acompañamiento"],
    image: require("@/assets/images/sessions/session-56.png"),
    isNew: true,
  },
  {
    id: "72",
    title: "Ola de Gong",
    subtitle: "Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonoterapia",
    ancestralTag: "Gongs" as const,
    duration: 45,
    durationLabel: "45 min",
    description: "Una ceremonia completa de baño de gong. Las ondas sonoras se expanden en círculos, envolviendo cada célula del cuerpo en vibración pura y sanadora.",
    benefits: ["Sanación vibracional", "Liberación emocional", "Profunda relajación", "Claridad mental"],
    instruments: ["Gong planetario", "Mallets de fieltro"],
    image: require("@/assets/images/sessions/session-57.png"),
    isNew: true,
  },
  {
    id: "73",
    title: "Mandala de Sonido",
    subtitle: "Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonoterapia",
    ancestralTag: "Gongs" as const,
    duration: 20,
    durationLabel: "20 min",
    description: "Los patrones grabados en la superficie del gong son un mandala que vibra con cada golpe. Una meditación visual y auditiva que centra la mente con precisión.",
    benefits: ["Concentración", "Armonía interior", "Claridad", "Conexión sagrada"],
    instruments: ["Gong de cobre cincelado", "Campanas tingsha"],
    image: require("@/assets/images/sessions/session-58.png"),
    isNew: true,
  },
  {
    id: "74",
    title: "Gong Lunar",
    subtitle: "Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonoterapia",
    ancestralTag: "Gongs" as const,
    duration: 35,
    durationLabel: "35 min",
    description: "Bajo la luna llena, el gong canta con la frecuencia del ciclo lunar. Una práctica de liberación y renovación alineada con los ritmos naturales de la Tierra.",
    benefits: ["Liberación", "Renovación", "Conexión con la naturaleza", "Sueño profundo"],
    instruments: ["Gong lunar", "Cuencos de cuarzo"],
    image: require("@/assets/images/sessions/session-59.png"),
    isNew: true,
  },
  {
    id: "75",
    title: "Círculo de Gongs",
    subtitle: "Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonoterapia",
    ancestralTag: "Gongs" as const,
    duration: 50,
    durationLabel: "50 min",
    description: "Múltiples gongs dispuestos en círculo crean un campo de sonido envolvente. Cada instrumento vibra en una frecuencia distinta, formando un tejido sonoro completo.",
    benefits: ["Inmersión total", "Relajación muscular profunda", "Paz interior", "Integración"],
    instruments: ["5 gongs planetarios", "Cuencos tibetanos"],
    image: require("@/assets/images/sessions/session-60.png"),
    isNew: true,
  },
  {
    id: "76",
    title: "Frecuencia del Gong",
    subtitle: "Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonoterapia",
    ancestralTag: "Gongs" as const,
    duration: 25,
    durationLabel: "25 min",
    description: "Cada gong planetario corresponde a un cuerpo celeste y su frecuencia. Esta sesión trabaja con las vibraciones del Sol y Júpiter para expandir la conciencia.",
    benefits: ["Expansión de conciencia", "Energía vital", "Optimismo", "Apertura"],
    instruments: ["Gong Solar", "Gong de Júpiter"],
    image: require("@/assets/images/sessions/session-61.png"),
    isNew: true,
  },
  {
    id: "77",
    title: "Gong del Himalaya",
    subtitle: "Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonoterapia",
    ancestralTag: "Gongs" as const,
    duration: 40,
    durationLabel: "40 min",
    description: "Forjado a mano en las montañas del Himalaya, este gong lleva siglos de tradición espiritual. Su voz grave y sostenida induce estados meditativos profundos.",
    benefits: ["Meditación profunda", "Silencio interior", "Conexión espiritual", "Arraigo"],
    instruments: ["Gong himalayo forjado a mano", "Cuencos de barro"],
    image: require("@/assets/images/sessions/session-62.png"),
    isNew: true,
  },
  {
    id: "78",
    title: "Gong Planetario",
    subtitle: "Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonoterapia",
    ancestralTag: "Gongs" as const,
    duration: 45,
    durationLabel: "45 min",
    description: "Los planetas emiten frecuencias que Hans Cousto calculó y trasladó al sonido. Esta sesión sintoniza el cuerpo con los ritmos del cosmos a través del gong.",
    benefits: ["Alineación cósmica", "Expansión", "Visión amplia", "Paz universal"],
    instruments: ["Gong planetario", "Platillos de cristal"],
    image: require("@/assets/images/sessions/session-63.png"),
    isNew: true,
  },
  {
    id: "79",
    title: "Resonancia en las Profundidades",
    subtitle: "Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonoterapia",
    ancestralTag: "Gongs" as const,
    duration: 30,
    durationLabel: "30 min",
    description: "Como las corrientes del océano que nunca vemos, la vibración del gong trabaja en capas profundas del sistema nervioso, liberando lo que el cuerpo ya no necesita.",
    benefits: ["Liberación del sistema nervioso", "Descanso profundo", "Soltar", "Fluidez"],
    instruments: ["Gong de agua", "Cuencos oceánicos"],
    image: require("@/assets/images/sessions/session-64.png"),
    isNew: true,
  },
  {
    id: "80",
    title: "Gong al Atardecer",
    subtitle: "Gongs",
    categoryId: "sonidos-ancestrales",
    categoryLabel: "Sonoterapia",
    ancestralTag: "Gongs" as const,
    duration: 35,
    durationLabel: "35 min",
    description: "En muchas tradiciones el atardecer es el momento del gong: el día se cierra con gratitud y el cuerpo se prepara para el descanso. Una transición sonora hacia la noche.",
    benefits: ["Transición al descanso", "Gratitud", "Cierre del día", "Sueño reparador"],
    instruments: ["Gong de bronce", "Tambor frame"],
    image: require("@/assets/images/sessions/session-65.png"),
    isNew: true,
  },

  // ── Descanso — ASMR (contenido de prueba) ───────────────────────────────
  {
    id: "83",
    title: "Tapping nocturno",
    subtitle: "ASMR",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "ASMR" as const,
    skipDetail: true,
    duration: 22,
    durationLabel: "22 min",
    description: "Golpecitos rítmicos y suaves sobre distintas superficies generan una vibración hipnótica que acompaña el cuerpo hacia el descanso.",
    benefits: ["Ritmo hipnótico", "Relajación muscular", "Calma auditiva", "Sueño profundo"],
    instruments: ["Tapping", "Superficies de madera y vidrio"],
    image: require("@/assets/images/sessions/session-11.jpg"),
  },
  {
    id: "84",
    title: "Agua y cristales",
    subtitle: "ASMR",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "ASMR" as const,
    skipDetail: true,
    duration: 25,
    durationLabel: "25 min",
    description: "El sonido del agua fluyendo entre cristales crea una textura sonora envolvente, íntima y profundamente relajante.",
    benefits: ["Textura envolvente", "Relajación profunda", "Escape sensorial", "Sueño reparador"],
    instruments: ["Agua", "Cristales", "Cuencos de cuarzo"],
    image: require("@/assets/images/sessions/session-4.jpg"),
  },
  {
    id: "85",
    title: "Cepillado relajante",
    subtitle: "ASMR",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "ASMR" as const,
    skipDetail: true,
    duration: 16,
    durationLabel: "16 min",
    description: "El sonido suave y repetitivo del cepillado activa una respuesta de calma inmediata en el cuerpo, ideal para conciliar el sueño.",
    benefits: ["Respuesta de calma", "Relajación inmediata", "Desconexión sensorial", "Sueño rápido"],
    instruments: ["Cepillos", "Susurros suaves"],
    image: require("@/assets/images/sessions/session-5.jpg"),
  },
  {
    id: "86",
    title: "Voz cercana",
    subtitle: "ASMR",
    categoryId: "descanso",
    categoryLabel: "Dormir",
    descansoTag: "ASMR" as const,
    skipDetail: true,
    duration: 24,
    durationLabel: "24 min",
    description: "Una voz cercana y pausada que acompaña con palabras suaves, creando una sensación de compañía tranquila antes de dormir.",
    benefits: ["Compañía tranquila", "Relajación auditiva", "Calma emocional", "Sueño acompañado"],
    instruments: ["Voz cercana", "Ambiente silencioso"],
    image: require("@/assets/images/sessions/session-9.jpg"),
  },
  {
    id: "test-ambiental-01",
    title: "Lluvia suave",
    subtitle: "Paisaje sonoro",
    categoryId: "ambientales",
    categoryLabel: "Ambientales",
    duration: 12,
    durationLabel: "12 min",
    description: "Una lluvia delicada sobre el cristal crea un refugio íntimo para bajar el ritmo y descansar la atención.",
    benefits: ["Calma inmediata", "Pausa mental", "Descanso sensorial"],
    instruments: ["Lluvia", "Gotas sobre cristal"],
    image: require("@/assets/images/sessions/ambiental-test-01-lluvia-suave.jpg"),
    isPlaceholder: true,
    voiceTag: "Sin voz",
    sonidosTags: ["Todos los sonidos"],
  },
  {
    id: "test-ambiental-02",
    title: "Bosque al amanecer",
    subtitle: "Paisaje sonoro",
    categoryId: "ambientales",
    categoryLabel: "Ambientales",
    duration: 28,
    durationLabel: "28 min",
    description: "La atmósfera húmeda de un bosque que despierta acompaña una práctica suave de presencia y conexión con la naturaleza.",
    benefits: ["Conexión natural", "Atención plena", "Relajación profunda"],
    instruments: ["Aves lejanas", "Hojas", "Brisa"],
    image: require("@/assets/images/sessions/ambiental-test-02-bosque-amanecer.jpg"),
    isPlaceholder: true,
    voiceTag: "Sin voz",
    sonidosTags: ["Todos los sonidos", "Sonidos de naturaleza"],
  },
  {
    id: "test-ambiental-03",
    title: "Océano en calma",
    subtitle: "Paisaje sonoro",
    categoryId: "ambientales",
    categoryLabel: "Ambientales",
    duration: 15,
    durationLabel: "15 min",
    description: "El movimiento lento de las olas sobre la arena abre un espacio amplio y sereno para respirar con más profundidad.",
    benefits: ["Respiración amplia", "Sensación de amplitud", "Quietud"],
    instruments: ["Olas", "Agua", "Arena"],
    image: require("@/assets/images/sessions/ambiental-test-03-oceano-calma.jpg"),
    isPlaceholder: true,
    voiceTag: "Sin voz",
    sonidosTags: ["Todos los sonidos", "Sonidos de naturaleza"],
  },
  {
    id: "test-ambiental-04",
    title: "Viento entre bambúes para respirar",
    subtitle: "Paisaje sonoro",
    categoryId: "ambientales",
    categoryLabel: "Ambientales",
    duration: 35,
    durationLabel: "35 min",
    description: "El viento atraviesa los tallos de bambú con un pulso orgánico y repetitivo que invita a soltar tensión.",
    benefits: ["Liberación de tensión", "Ritmo sostenido", "Respiración consciente"],
    instruments: ["Bambú", "Viento suave", "Hojas"],
    image: require("@/assets/images/sessions/ambiental-test-04-viento-bambues.jpg"),
    isPlaceholder: true,
    voiceTag: "Sin voz",
    sonidosTags: ["Todos los sonidos", "Sonidos de naturaleza"],
  },
  {
    id: "test-ambiental-05",
    title: "Fuego lento para una tarde de pausa",
    subtitle: "Paisaje sonoro",
    categoryId: "ambientales",
    categoryLabel: "Ambientales",
    duration: 22,
    durationLabel: "22 min",
    description: "Chasquidos cálidos y fuego lento construyen una sensación de hogar para acompañar una tarde tranquila.",
    benefits: ["Sensación de refugio", "Relajación", "Pausa reparadora"],
    instruments: ["Leña", "Brasas", "Fuego"],
    image: require("@/assets/images/sessions/ambiental-test-05-fuego-hogar.jpg"),
    isPlaceholder: true,
    voiceTag: "Sin voz",
    sonidosTags: ["Todos los sonidos"],
  },
  {
    id: "test-ambiental-06",
    title: "Noche de estrellas y silencio profundo",
    subtitle: "Paisaje sonoro",
    categoryId: "ambientales",
    categoryLabel: "Ambientales",
    duration: 40,
    durationLabel: "40 min",
    description: "Una noche abierta y silenciosa sostiene la desaceleración, ideal para cerrar el día y preparar el descanso.",
    benefits: ["Desaceleración", "Cierre del día", "Descanso profundo"],
    instruments: ["Noche", "Brisa distante", "Pradera"],
    image: require("@/assets/images/sessions/ambiental-test-06-noche-estrellas.jpg"),
    isPlaceholder: true,
    voiceTag: "Sin voz",
    sonidosTags: ["Todos los sonidos"],
  },
  {
    id: "test-ambiental-07",
    title: "Río de cristal",
    subtitle: "Paisaje sonoro",
    categoryId: "ambientales",
    categoryLabel: "Ambientales",
    duration: 18,
    durationLabel: "18 min",
    description: "El agua transparente corre entre piedras redondeadas y ofrece una textura continua para volver al presente.",
    benefits: ["Enfoque suave", "Presencia", "Limpieza mental"],
    instruments: ["Río", "Piedras", "Agua corriente"],
    image: require("@/assets/images/sessions/ambiental-test-07-rio-cristal.jpg"),
    isPlaceholder: true,
    voiceTag: "Sin voz",
    sonidosTags: ["Todos los sonidos", "Sonidos de naturaleza"],
  },
];

export function getSessionsByCategory(categoryId: string): Session[] {
  return SESSIONS.filter((s) => s.categoryId === categoryId);
}

export function getSessionsBySleepTag(sleepTag: SleepTag): Session[] {
  return SESSIONS.filter((s) => s.sleepTag === sleepTag);
}

const CANONICAL_SONIDOS_TAGS = new Set<SonidosCollectionTag>(
  SONIDOS_TAG_CARDS.map((card) => card.label),
);

const LEGACY_SONIDOS_TAG_MAP: Record<SonidosTag, SonidosCollectionTag[]> = {
  "Sonidos Binaurales": ["Todos los sonidos", "Sonidos binaurales"],
  "Sonidos Naturaleza": ["Todos los sonidos", "Sonidos de naturaleza"],
  "Sonidos Atmosféricos": ["Todos los sonidos"],
  "Sonidos Hipnóticos": ["Todos los sonidos"],
};

export function normalizeSonidosTags(
  tags: readonly string[] | null | undefined,
  legacySonidosTag?: string | null,
): SonidosCollectionTag[] {
  const result = new Set<SonidosCollectionTag>();
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      if (CANONICAL_SONIDOS_TAGS.has(tag as SonidosCollectionTag)) {
        result.add(tag as SonidosCollectionTag);
      }
    }
  } else if (legacySonidosTag && legacySonidosTag in LEGACY_SONIDOS_TAG_MAP) {
    for (const tag of LEGACY_SONIDOS_TAG_MAP[legacySonidosTag as SonidosTag]) {
      result.add(tag);
    }
  }
  if (result.size > 0) result.add("Todos los sonidos");
  return SONIDOS_TAG_CARDS.map((card) => card.label).filter((tag) => result.has(tag));
}

export function getSessionSonidosTags(session: Session): SonidosCollectionTag[] {
  return normalizeSonidosTags(session.sonidosTags, session.sonidosTag);
}

export function getSessionsBySonidosTag(tag: SonidosCollectionTag): Session[] {
  return SESSIONS
    .filter((session) => getSessionSonidosTags(session).includes(tag))
    .sort(newestFirst);
}

export const SONIDOS_VISIBLE_TAGS: SonidosCollectionTag[] = SONIDOS_TAG_CARDS.map(
  (card) => card.label,
);

export function getSonidosVisibleSessions(): Session[] {
  const seen = new Set<string>();
  const result: Session[] = [];
  for (const tag of SONIDOS_VISIBLE_TAGS) {
    for (const session of getSessionsBySonidosTag(tag)) {
      if (!seen.has(session.id)) {
        seen.add(session.id);
        result.push(session);
      }
    }
  }
  return result;
}

const CANONICAL_DESCANSO_TAGS = new Set<DescansoTag>(
  DESCANSO_TAG_CARDS.map((card) => card.label),
);

const LEGACY_DESCANSO_TAG_MAP: Record<LegacyDescansoTag, DescansoTag[]> = {
  Relajaciones: ["Meditaciones para dormir"],
  "Sueño profundo": ["Música para dormir"],
  Ruidos: ["Ruido"],
  Meditaciones: ["Meditaciones para dormir"],
  "Historias para dormir": ["Historias para dormir"],
  "Historias infantiles": ["Historias para dormir", "Para niños"],
  ASMR: ["Sonidos para dormir"],
  "Sonidos Binaurales": ["Música para dormir"],
  "Sonidos Ambientales": ["Paisajes sonoros"],
};

const LEGACY_SLEEP_TAG_MAP: Record<SleepTag, DescansoTag[]> = {
  "Sonidos Binaurales": ["Música para dormir"],
  "Sonidos Ancestrales": ["Sonidos para dormir"],
  "ASMR Expansivos": ["Sonidos para dormir"],
};

export function normalizeDescansoTags(
  tags: readonly string[] | null | undefined,
  legacyDescansoTag?: string | null,
  legacySleepTag?: string | null,
): DescansoTag[] {
  const result = new Set<DescansoTag>();
  for (const tag of tags ?? []) {
    if (CANONICAL_DESCANSO_TAGS.has(tag as DescansoTag)) result.add(tag as DescansoTag);
  }
  if (result.size === 0 && legacyDescansoTag && legacyDescansoTag in LEGACY_DESCANSO_TAG_MAP) {
    for (const tag of LEGACY_DESCANSO_TAG_MAP[legacyDescansoTag as LegacyDescansoTag]) result.add(tag);
  }
  if (result.size === 0 && legacySleepTag && legacySleepTag in LEGACY_SLEEP_TAG_MAP) {
    for (const tag of LEGACY_SLEEP_TAG_MAP[legacySleepTag as SleepTag]) result.add(tag);
  }
  return DESCANSO_TAG_CARDS.map((card) => card.label).filter((tag) => result.has(tag));
}

export function getSessionDescansoTags(session: Session): DescansoTag[] {
  return normalizeDescansoTags(session.descansoTags, session.descansoTag, session.sleepTag);
}

function newestFirst(a: Session, b: Session): number {
  const parsedA = a.createdAt ? Date.parse(a.createdAt) : 0;
  const parsedB = b.createdAt ? Date.parse(b.createdAt) : 0;
  const aTime = Number.isFinite(parsedA) ? parsedA : 0;
  const bTime = Number.isFinite(parsedB) ? parsedB : 0;
  if (aTime !== bTime) return bTime - aTime;

  // Las sesiones bundleadas históricas usan IDs numéricos. Mantener este
  // desempate evita cambiar su orden cuando todavía no tienen createdAt.
  const aId = Number(a.id);
  const bId = Number(b.id);
  if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) {
    return bId - aId;
  }
  return 0;
}

export function getSessionsByDescansoTag(tag: DescansoTag): Session[] {
  return SESSIONS
    .filter((s) => getSessionDescansoTags(s).includes(tag))
    .sort(newestFirst);
}

/** Orden editorial canónico compartido por Dormir y la cola del reproductor. */
export const DESCANSO_VISIBLE_TAGS: DescansoTag[] = DESCANSO_TAG_CARDS.map(
  (card) => card.label,
);

/** Devuelve todas las sesiones visibles en la pantalla Dormir, deduplicadas
 *  y en el mismo orden en que aparecerían al recorrer los tabs de izquierda a
 *  derecha. Úsala para construir la cola implícita del reproductor. */
export function getDescansoVisibleSessions(): Session[] {
  const seen = new Set<string>();
  const result: Session[] = [];
  for (const tag of DESCANSO_VISIBLE_TAGS) {
    for (const s of getSessionsByDescansoTag(tag)) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        result.push(s);
      }
    }
  }
  return result;
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
  isFeaturedCategory?: boolean;
  isNew: boolean;
  isPremium: boolean;
  isPlaceholder?: boolean;
  skipDetail?: boolean;
  skipMiniPlayer?: boolean;
  /** Loop infinito a nivel sesión (motor gapless, duración infinita). */
  isLoop?: boolean;
  frequency?: string | null;
  soundTag?: string | null;
  meditationTag?: string | null;
  ancestralTag?: string | null;
  sabiduriaTag?: string | null;
  podcastTag?: string | null;
  sonidosTag?: string | null;
  sonidosTags?: string[] | null;
  descansoTag?: string | null;
  descansoTags?: string[] | null;
  themeTag?: string[] | null;
  temaTag?: string[] | null;
  sleepTag?: string | null;
  voiceTag?: string | null;
  guideId?: string | null;
  artistId?: string | null;
  guests?: { name: string; role: string; instagram?: string | null }[] | null;
  /** URL de imagen (para sesiones nuevas no bundleadas). */
  imageUrl?: string | null;
  /** Archivos de audio (para sesiones nuevas no bundleadas). */
  audioFiles?: { role: string; url?: string | null; name: string }[];
  /** Descripción corta mostrada en el reproductor (campo admin opcional). */
  playerDescription?: string | null;
  /** Fecha de creación ISO (para ordenar "Nuevas sesiones" entre sesiones del admin). */
  createdAt?: string | null;
};

/** Imágenes bundleadas por nombre de archivo (imageKey de la DB). */
const BUNDLED_SESSION_IMAGES: Record<string, import("react-native").ImageSourcePropType> = {
  "ancestral-instrumentos.jpg": require("@/assets/images/sessions/ancestral-instrumentos.jpg"),
  "med-escaneo-corporal.jpg": require("@/assets/images/sessions/med-escaneo-corporal.jpg"),
  "med-manifestacion.jpg": require("@/assets/images/sessions/med-manifestacion.jpg"),
  "med-mantras.jpg": require("@/assets/images/sessions/med-mantras.jpg"),
  "med-no-duales.jpg": require("@/assets/images/sessions/med-no-duales.jpg"),
  "med-visualizaciones.jpg": require("@/assets/images/sessions/med-visualizaciones.jpg"),
  "sab-aceptacion-flujo.jpg": require("@/assets/images/sessions/sab-aceptacion-flujo.jpg"),
  "sab-atencion-plena.jpg": require("@/assets/images/sessions/sab-atencion-plena.jpg"),
  "sab-condicionamiento.jpg": require("@/assets/images/sessions/sab-condicionamiento.jpg"),
  "sab-oscuridad.jpg": require("@/assets/images/sessions/sab-oscuridad.jpg"),
  "sab-silencio-interior.jpg": require("@/assets/images/sessions/sab-silencio-interior.jpg"),
  "session-1.jpg": require("@/assets/images/sessions/session-1.jpg"),
  "session-10.jpg": require("@/assets/images/sessions/session-10.jpg"),
  "session-11.jpg": require("@/assets/images/sessions/session-11.jpg"),
  "session-12.jpg": require("@/assets/images/sessions/session-12.jpg"),
  "session-13.jpg": require("@/assets/images/sessions/session-13.jpg"),
  "session-14.jpg": require("@/assets/images/sessions/session-14.jpg"),
  "session-15.jpg": require("@/assets/images/sessions/session-15.jpg"),
  "session-16.jpg": require("@/assets/images/sessions/session-16.jpg"),
  "session-17.jpg": require("@/assets/images/sessions/session-17.jpg"),
  "session-18.jpg": require("@/assets/images/sessions/session-18.jpg"),
  "session-19.jpg": require("@/assets/images/sessions/session-19.jpg"),
  "session-2-musica-dark.jpg": require("@/assets/images/sessions/session-2-musica-dark.jpg"),
  "session-2.jpg": require("@/assets/images/sessions/session-2.jpg"),
  "session-20-musica-dark.jpg": require("@/assets/images/sessions/session-20-musica-dark.jpg"),
  "session-20.jpg": require("@/assets/images/sessions/session-20.jpg"),
  "session-21.jpg": require("@/assets/images/sessions/session-21.jpg"),
  "session-22.jpg": require("@/assets/images/sessions/session-22.jpg"),
  "session-23.jpg": require("@/assets/images/sessions/session-23.jpg"),
  "session-24.jpg": require("@/assets/images/sessions/session-24.jpg"),
  "session-25.jpg": require("@/assets/images/sessions/session-25.jpg"),
  "session-26.jpg": require("@/assets/images/sessions/session-26.jpg"),
  "session-27-musica-dark.jpg": require("@/assets/images/sessions/session-27-musica-dark.jpg"),
  "session-27.jpg": require("@/assets/images/sessions/session-27.jpg"),
  "session-28.jpg": require("@/assets/images/sessions/session-28.jpg"),
  "session-29.jpg": require("@/assets/images/sessions/session-29.jpg"),
  "session-3-musica-dark.jpg": require("@/assets/images/sessions/session-3-musica-dark.jpg"),
  "session-30.jpg": require("@/assets/images/sessions/session-30.jpg"),
  "session-31.jpg": require("@/assets/images/sessions/session-31.jpg"),
  "session-32.jpg": require("@/assets/images/sessions/session-32.jpg"),
  "session-33.jpg": require("@/assets/images/sessions/session-33.jpg"),
  "session-34.jpg": require("@/assets/images/sessions/session-34.jpg"),
  "session-35.jpg": require("@/assets/images/sessions/session-35.jpg"),
  "session-36.jpg": require("@/assets/images/sessions/session-36.jpg"),
  "session-37.jpg": require("@/assets/images/sessions/session-37.jpg"),
  "session-38.jpg": require("@/assets/images/sessions/session-38.jpg"),
  "session-39.jpg": require("@/assets/images/sessions/session-39.jpg"),
  "session-4.jpg": require("@/assets/images/sessions/session-4.jpg"),
  "session-40.jpg": require("@/assets/images/sessions/session-40.jpg"),
  "session-41.jpg": require("@/assets/images/sessions/session-41.jpg"),
  "session-42.jpg": require("@/assets/images/sessions/session-42.jpg"),
  "session-43.jpg": require("@/assets/images/sessions/session-43.jpg"),
  "session-44.jpg": require("@/assets/images/sessions/session-44.jpg"),
  "session-45.jpg": require("@/assets/images/sessions/session-45.jpg"),
  "session-46.jpg": require("@/assets/images/sessions/session-46.jpg"),
  "session-47.jpg": require("@/assets/images/sessions/session-47.jpg"),
  "session-48.jpg": require("@/assets/images/sessions/session-48.jpg"),
  "session-49.jpg": require("@/assets/images/sessions/session-49.jpg"),
  "session-5-musica-dark.jpg": require("@/assets/images/sessions/session-5-musica-dark.jpg"),
  "session-5.jpg": require("@/assets/images/sessions/session-5.jpg"),
  "session-50.jpg": require("@/assets/images/sessions/session-50.jpg"),
  "session-51.jpg": require("@/assets/images/sessions/session-51.jpg"),
  "session-52.jpg": require("@/assets/images/sessions/session-52.jpg"),
  "session-53.jpg": require("@/assets/images/sessions/session-53.jpg"),
  "session-54.jpg": require("@/assets/images/sessions/session-54.jpg"),
  "session-55.jpg": require("@/assets/images/sessions/session-55.jpg"),
  "session-56.jpg": require("@/assets/images/sessions/session-56.jpg"),
  "session-56.png": require("@/assets/images/sessions/session-56.png"),
  "session-57.png": require("@/assets/images/sessions/session-57.png"),
  "session-58.png": require("@/assets/images/sessions/session-58.png"),
  "session-59.png": require("@/assets/images/sessions/session-59.png"),
  "session-6-musica-dark.jpg": require("@/assets/images/sessions/session-6-musica-dark.jpg"),
  "session-6.jpg": require("@/assets/images/sessions/session-6.jpg"),
  "session-60.png": require("@/assets/images/sessions/session-60.png"),
  "session-61.png": require("@/assets/images/sessions/session-61.png"),
  "session-62.png": require("@/assets/images/sessions/session-62.png"),
  "session-63.png": require("@/assets/images/sessions/session-63.png"),
  "session-64.png": require("@/assets/images/sessions/session-64.png"),
  "session-65.png": require("@/assets/images/sessions/session-65.png"),
  "session-66.jpg": require("@/assets/images/sessions/session-66.jpg"),
  "session-7-musica-dark.jpg": require("@/assets/images/sessions/session-7-musica-dark.jpg"),
  "session-7.jpg": require("@/assets/images/sessions/session-7.jpg"),
  "session-8-musica-dark.jpg": require("@/assets/images/sessions/session-8-musica-dark.jpg"),
  "session-8.jpg": require("@/assets/images/sessions/session-8.jpg"),
  "session-9-musica-dark.jpg": require("@/assets/images/sessions/session-9-musica-dark.jpg"),
  "session-9.jpg": require("@/assets/images/sessions/session-9.jpg"),
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
    local.isFeaturedCategory = r.isFeaturedCategory ?? false;
    local.isNew = r.isNew;
    local.isPremium = r.isPremium;
    local.isPlaceholder = r.isPlaceholder ?? false;
    // La BD no distingue "nunca tocado" de "explícitamente false" (columna
    // boolean default false). Solo aplicar cuando viene true: un false NO debe
    // clobbear los skipDetail:true bundleados ni el default por categoría de
    // SessionCard (skipDetail !== false), que un false explícito rompería.
    if (r.skipDetail) local.skipDetail = true;
    if (r.isPlaceholder) local.skipMiniPlayer = false;
    else if (r.skipMiniPlayer) local.skipMiniPlayer = true;
    // Complemento del Set hardcodeado LOOP_SESSIONS: solo fijar si viene true
    // (no clobbear a false las sesiones bundleadas que loopean por el Set).
    if (r.isLoop) local.isLoop = true;
    local.frequency = r.frequency ?? undefined;
    local.soundTag = (r.soundTag ?? undefined) as SoundTag | undefined;
    local.meditationTag = (r.meditationTag ?? undefined) as MeditationTag | undefined;
    local.ancestralTag = (r.ancestralTag ?? undefined) as AncestralTag | undefined;
    local.sabiduriaTag = (r.sabiduriaTag ?? undefined) as SabiduriaTag | undefined;
    local.podcastTag = (r.podcastTag ?? undefined) as PodcastTag | undefined;
    local.sonidosTag = (r.sonidosTag ?? undefined) as SonidosTag | undefined;
    local.sonidosTags = normalizeSonidosTags(r.sonidosTags, r.sonidosTag);
    local.descansoTags = normalizeDescansoTags(r.descansoTags, r.descansoTag, r.sleepTag);
    local.descansoTag = undefined;
    local.themeTag = (r.themeTag ?? undefined) as ThemeTag[] | undefined;
    local.temaTag = r.temaTag ?? undefined;
    local.sleepTag = (r.sleepTag ?? undefined) as SleepTag | undefined;
    // Sesión bundleada: solo sobrescribir si el admin fijó una etiqueta explícita.
    // Si el remoto viene vacío (null), dejar `undefined` para conservar el fallback
    // legacy de VOICE_MAP (la DB no distingue "sin fijar" de "vacío explícito" para bundles).
    if (r.voiceTag != null) {
      local.voiceTag = r.voiceTag as "Guiada" | "Sin voz";
    }
    local.guideId = r.guideId ?? undefined;
    local.artistId = r.artistId ?? undefined;
    local.playerDescription = r.playerDescription ?? undefined;
    local.createdAt = r.createdAt ?? undefined;
    local.guests = r.guests
      ? r.guests.map((g) => ({
          name: g.name,
          role: g.role,
          instagram: g.instagram ?? undefined,
        }))
      : undefined;
    // Siempre aplicar el audio del servidor: si el admin reemplazó el audio,
    // el nuevo audioUri debe prevalecer sobre el bundle en el PlayerContext.
    if (r.audioFiles?.length) {
      const main = r.audioFiles.find((a) => a.role === "main" || a.role === "base") ?? r.audioFiles[0];
      local.audioUri = resolveObjectPath(main.url);
      const voice = r.audioFiles.find((a) => a.role === "voice");
      local.voiceUri = voice ? resolveObjectPath(voice.url) : undefined;
    }
    // Si el admin subió una foto personalizada (no un key de asset bundleado), aplicarla.
    if (r.imageUrl && !(r.imageUrl in BUNDLED_SESSION_IMAGES)) {
      local.image = { uri: resolveObjectPath(r.imageUrl) as string };
    }
  }

  // 2. Insertar sesiones nuevas (subidas vía admin) que no están en el bundle.
  for (const r of remote) {
    if (SESSIONS.some((s) => s.id === r.id)) continue;
    const main = r.audioFiles?.find((a) => a.role === "main" || a.role === "base") ?? r.audioFiles?.[0];
    const voice = r.audioFiles?.find((a) => a.role === "voice");
    const image: import("react-native").ImageSourcePropType = r.imageUrl
      ? (BUNDLED_SESSION_IMAGES[r.imageUrl] ??
          (r.imageUrl.startsWith("/") || /^https?:/i.test(r.imageUrl)
            ? { uri: resolveObjectPath(r.imageUrl) as string }
            : require("@/assets/images/sessions/session-2.jpg")))
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
      isFeaturedCategory: r.isFeaturedCategory ?? false,
      isNew: r.isNew,
      isPremium: r.isPremium,
      isPlaceholder: r.isPlaceholder ?? false,
      // false de la BD → undefined: así aplican los defaults por categoría
      // (p.ej. SessionCard manda sonidos-ancestrales directo al player salvo
      // skipDetail === false explícito, que la BD no puede expresar).
      skipDetail: r.skipDetail ? true : undefined,
      skipMiniPlayer: r.isPlaceholder ? false : (r.skipMiniPlayer ? true : undefined),
      isLoop: r.isLoop ? true : undefined,
      frequency: r.frequency ?? undefined,
      soundTag: (r.soundTag ?? undefined) as SoundTag | undefined,
      meditationTag: (r.meditationTag ?? undefined) as MeditationTag | undefined,
      ancestralTag: (r.ancestralTag ?? undefined) as AncestralTag | undefined,
      sabiduriaTag: (r.sabiduriaTag ?? undefined) as SabiduriaTag | undefined,
      podcastTag: (r.podcastTag ?? undefined) as PodcastTag | undefined,
      sonidosTag: (r.sonidosTag ?? undefined) as SonidosTag | undefined,
      sonidosTags: normalizeSonidosTags(r.sonidosTags, r.sonidosTag),
      descansoTags: normalizeDescansoTags(r.descansoTags, r.descansoTag, r.sleepTag),
      themeTag: (r.themeTag ?? undefined) as ThemeTag[] | undefined,
      temaTag: r.temaTag ?? undefined,
      sleepTag: (r.sleepTag ?? undefined) as SleepTag | undefined,
      voiceTag: (r.voiceTag ?? null) as "Guiada" | "Sin voz" | null,
      guideId: r.guideId ?? undefined,
      artistId: r.artistId ?? undefined,
      audioUri: main ? resolveObjectPath(main.url) : undefined,
      voiceUri: voice ? resolveObjectPath(voice.url) : undefined,
      playerDescription: r.playerDescription ?? undefined,
      createdAt: r.createdAt ?? undefined,
    });
  }
}
