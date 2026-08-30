import type { ThemeTag } from "@/data/tags";
import type { SoundTagId } from "@/data/sounds";

export type MoodId =
  | "estresado"
  | "ansioso"
  | "cansado"
  | "inepto"
  | "triste"
  | "solo"
  | "deprimido"
  | "desmotivado"
  | "enojado"
  | "adolorido"
  | "agradecido"
  | "emocionado"
  | "lleno-de-amor"
  | "feliz"
  | "en-paz"
  | "esperanzado"
  | "contento"
  | "presente";

export interface Mood {
  id: MoodId;
  emoji: string;
  label: string;
  themeTags: ThemeTag[];
  categoryIds: string[];
}

export interface MoodSurveyOption {
  id: string;
  label: string;
}

export const MOODS: Mood[] = [
  {
    id: "estresado",
    emoji: "🥵",
    label: "Estresad@",
    themeTags: ["Para la ansiedad", "Respiración consciente"],
    categoryIds: ["meditaciones-guiadas", "musica-sonidos"],
  },
  {
    id: "ansioso",
    emoji: "😬",
    label: "Ansios@",
    themeTags: ["Para la ansiedad", "Respiración consciente"],
    categoryIds: ["meditaciones-guiadas", "musica-sonidos"],
  },
  {
    id: "cansado",
    emoji: "😪",
    label: "Cansad@",
    themeTags: ["Energiza tus mañanas", "Meditaciones Activas"],
    categoryIds: ["musica-sonidos", "sonidos-ancestrales"],
  },
  {
    id: "inepto",
    emoji: "😑",
    label: "Inept@",
    themeTags: ["Crecimiento personal", "Foco y concentración"],
    categoryIds: ["meditaciones-guiadas"],
  },
  {
    id: "triste",
    emoji: "😭",
    label: "Triste",
    themeTags: ["Crecimiento personal", "Armonía familiar"],
    categoryIds: ["meditaciones-guiadas"],
  },
  {
    id: "solo",
    emoji: "🥺",
    label: "Solo(a)",
    themeTags: ["Armonía familiar", "Crecimiento personal"],
    categoryIds: ["meditaciones-guiadas"],
  },
  {
    id: "deprimido",
    emoji: "😔",
    label: "Deprimido(a)",
    themeTags: ["Crecimiento personal", "Para la ansiedad"],
    categoryIds: ["meditaciones-guiadas"],
  },
  {
    id: "desmotivado",
    emoji: "😪",
    label: "Desmotivado(a)",
    themeTags: ["Crecimiento personal", "Energiza tus mañanas"],
    categoryIds: ["meditaciones-guiadas", "musica-sonidos"],
  },
  {
    id: "enojado",
    emoji: "😤",
    label: "Enojado(a)",
    themeTags: ["Suelto la Rabia", "Respiración consciente"],
    categoryIds: ["meditaciones-guiadas"],
  },
  {
    id: "adolorido",
    emoji: "😣",
    label: "Adolorido(a)",
    themeTags: ["Respiración consciente", "Crecimiento personal"],
    categoryIds: ["meditaciones-guiadas", "musica-sonidos"],
  },
  {
    id: "agradecido",
    emoji: "🙏",
    label: "Agradecido(a)",
    themeTags: ["Crecimiento personal", "Armonía familiar"],
    categoryIds: ["meditaciones-guiadas", "musica-sonidos"],
  },
  {
    id: "emocionado",
    emoji: "🤩",
    label: "Emocionado(a)",
    themeTags: ["Energiza tus mañanas", "Crecimiento personal"],
    categoryIds: ["musica-sonidos", "sonidos-ancestrales"],
  },
  {
    id: "lleno-de-amor",
    emoji: "🥰",
    label: "Lleno(a) de amor",
    themeTags: ["Armonía familiar", "Crecimiento personal"],
    categoryIds: ["meditaciones-guiadas", "musica-sonidos"],
  },
  {
    id: "feliz",
    emoji: "😊",
    label: "Feliz",
    themeTags: ["Energiza tus mañanas", "Crecimiento personal"],
    categoryIds: ["musica-sonidos", "meditaciones-guiadas"],
  },
  {
    id: "en-paz",
    emoji: "😌",
    label: "En paz",
    themeTags: ["Respiración consciente"],
    categoryIds: ["meditaciones-guiadas", "musica-sonidos"],
  },
  {
    id: "esperanzado",
    emoji: "😇",
    label: "Esperanzado(a)",
    themeTags: ["Crecimiento personal", "Energiza tus mañanas"],
    categoryIds: ["meditaciones-guiadas", "musica-sonidos"],
  },
  {
    id: "contento",
    emoji: "🙂",
    label: "Contento(a)",
    themeTags: ["Energiza tus mañanas", "Crecimiento personal"],
    categoryIds: ["musica-sonidos", "meditaciones-guiadas"],
  },
  {
    id: "presente",
    emoji: "🧘",
    label: "Presente",
    themeTags: ["Respiración consciente", "Foco y concentración"],
    categoryIds: ["meditaciones-guiadas"],
  },
];

/**
 * Preguntas de contexto para el primer paso del flujo emocional.
 * El contenido vive separado del componente para que cada emoción pueda
 * evolucionar sin llenar de condiciones la pantalla.
 */
export const MOOD_SURVEY_OPTIONS: Record<MoodId, MoodSurveyOption[]> = {
  estresado: [
    { id: "too-much", label: "Siento que tengo demasiado encima." },
    { id: "disconnect", label: "No logro desconectarme." },
    { id: "body-tense", label: "Mi cuerpo se siente tenso." },
    { id: "pause", label: "Necesito hacer una pausa." },
    { id: "other", label: "Otro" },
  ],
  ansioso: [
    { id: "racing-mind", label: "Mi mente no deja de dar vueltas." },
    { id: "uncertain", label: "Me preocupa lo que pueda pasar." },
    { id: "body-alert", label: "Siento alerta o nervios en el cuerpo." },
    { id: "breathe", label: "Necesito volver a respirar con calma." },
    { id: "other", label: "Otro" },
  ],
  cansado: [
    { id: "no-energy", label: "Siento que no tengo energía." },
    { id: "poor-sleep", label: "No he descansado bien." },
    { id: "need-rest", label: "Necesito bajar el ritmo." },
    { id: "overloaded", label: "He estado sosteniendo demasiado." },
    { id: "other", label: "Otro" },
  ],
  inepto: [
    { id: "not-enough", label: "Siento que no soy suficiente." },
    { id: "mistake", label: "Algo que hice no salió como esperaba." },
    { id: "comparison", label: "Me estoy comparando con otras personas." },
    { id: "self-doubt", label: "Estoy dudando de mis capacidades." },
    { id: "other", label: "Otro" },
  ],
  triste: [
    { id: "general", label: "Me siento triste en general." },
    { id: "relationship-ended", label: "Mi relación terminó." },
    { id: "regret", label: "Siento arrepentimiento." },
    { id: "loss", label: "He experimentado una pérdida." },
    { id: "other", label: "Otro" },
  ],
  solo: [
    { id: "need-company", label: "Necesito sentirme acompañado(a)." },
    { id: "disconnected", label: "Me siento lejos de los demás." },
    { id: "miss-someone", label: "Extraño a alguien." },
    { id: "hard-to-connect", label: "Me cuesta conectar con otras personas." },
    { id: "other", label: "Otro" },
  ],
  deprimido: [
    { id: "low-mood", label: "Me cuesta encontrar ánimo." },
    { id: "heavy", label: "Todo se siente más pesado de lo normal." },
    { id: "alone", label: "Me siento muy solo(a) con esto." },
    { id: "no-motivation", label: "No encuentro motivación para empezar." },
    { id: "other", label: "Otro" },
  ],
  desmotivado: [
    { id: "stuck", label: "Siento que estoy estancado(a)." },
    { id: "no-direction", label: "No sé por dónde continuar." },
    { id: "tired-trying", label: "Me cansé de intentarlo." },
    { id: "need-inspiration", label: "Necesito volver a encontrar inspiración." },
    { id: "other", label: "Otro" },
  ],
  enojado: [
    { id: "injustice", label: "Siento que algo fue injusto." },
    { id: "crossed-line", label: "Alguien cruzó un límite importante." },
    { id: "frustrated", label: "Algo no salió como esperaba." },
    { id: "need-release", label: "Necesito liberar lo que siento." },
    { id: "other", label: "Otro" },
  ],
  adolorido: [
    { id: "physical", label: "Siento dolor en mi cuerpo." },
    { id: "emotional", label: "Estoy atravesando un dolor emocional." },
    { id: "tension", label: "La tensión se ha acumulado." },
    { id: "need-care", label: "Necesito tratarme con más cuidado." },
    { id: "other", label: "Otro" },
  ],
  agradecido: [
    { id: "person", label: "Agradezco a una persona especial." },
    { id: "small-thing", label: "Algo pequeño hizo especial mi día." },
    { id: "new-perspective", label: "Estoy viendo mi vida de otra manera." },
    { id: "moment", label: "Quiero guardar este momento." },
    { id: "other", label: "Otro" },
  ],
  emocionado: [
    { id: "good-news", label: "Recibí una buena noticia." },
    { id: "new-project", label: "Estoy por comenzar algo nuevo." },
    { id: "looking-forward", label: "Hay algo que espero con ilusión." },
    { id: "creative-energy", label: "Tengo mucha energía creativa." },
    { id: "other", label: "Otro" },
  ],
  "lleno-de-amor": [
    { id: "someone-special", label: "Estoy pensando en alguien especial." },
    { id: "connection", label: "Me siento profundamente conectado(a)." },
    { id: "giving", label: "Tengo ganas de entregar cariño." },
    { id: "receiving", label: "Me siento querido(a) y acompañado(a)." },
    { id: "other", label: "Otro" },
  ],
  feliz: [
    { id: "achievement", label: "Algo que logré me hace feliz." },
    { id: "good-company", label: "Compartí un momento bonito." },
    { id: "peaceful", label: "Hoy todo se siente más liviano." },
    { id: "simple-joy", label: "Estoy disfrutando algo sencillo." },
    { id: "other", label: "Otro" },
  ],
  "en-paz": [
    { id: "quiet", label: "Encontré un momento de quietud." },
    { id: "acceptance", label: "Estoy aceptando lo que es." },
    { id: "grounded", label: "Me siento presente y enraizado(a)." },
    { id: "relief", label: "Algo que me preocupaba se alivió." },
    { id: "other", label: "Otro" },
  ],
  esperanzado: [
    { id: "new-path", label: "Empiezo a ver un nuevo camino." },
    { id: "future", label: "Tengo ilusión por lo que viene." },
    { id: "recovering", label: "Siento que estoy volviendo a mí." },
    { id: "small-light", label: "Encontré una pequeña luz en el día." },
    { id: "other", label: "Otro" },
  ],
  contento: [
    { id: "good-day", label: "Estoy teniendo un buen día." },
    { id: "comfortable", label: "Me siento cómodo(a) donde estoy." },
    { id: "shared", label: "Algo que compartí me alegró." },
    { id: "grateful", label: "Estoy disfrutando lo que tengo." },
    { id: "other", label: "Otro" },
  ],
  presente: [
    { id: "connected-body", label: "Estoy conectado(a) con mi cuerpo." },
    { id: "focused", label: "Puedo estar aquí y ahora." },
    { id: "observing", label: "Estoy observando lo que siento." },
    { id: "slowing-down", label: "Quiero quedarme en este momento." },
    { id: "other", label: "Otro" },
  ],
};

export function getMoodById(id: string): Mood | undefined {
  return MOODS.find((m) => m.id === id);
}

/**
 * Mapeo de cada estado de ánimo a las etiquetas de sonido afines.
 * Lo usa el filtro "¿Cómo te sientes?" de los Ajustes del Mezclador:
 * al elegir un ánimo, se muestran solo los sonidos con alguna de estas
 * etiquetas. Editable según el criterio de la marca.
 */
export const MOOD_SOUND_TAGS: Record<MoodId, SoundTagId[]> = {
  estresado: ["naturaleza", "solfeggio"],
  ansioso:   ["naturaleza", "solfeggio"],
  cansado:   ["naturaleza", "binaural"],
  inepto:    ["solfeggio", "binaural"],
  triste:    ["armonicos", "solfeggio"],
  solo:      ["armonicos", "solfeggio"],
  deprimido: ["armonicos", "solfeggio"],
  desmotivado: ["naturaleza", "binaural"],
  enojado:   ["naturaleza", "armonicos"],
  adolorido: ["naturaleza", "armonicos"],
  agradecido: ["armonicos", "solfeggio"],
  emocionado: ["naturaleza", "binaural"],
  "lleno-de-amor": ["armonicos", "solfeggio"],
  feliz:     ["naturaleza", "armonicos"],
  "en-paz":  ["naturaleza", "armonicos"],
  esperanzado: ["naturaleza", "solfeggio"],
  contento:  ["naturaleza", "armonicos"],
  presente:  ["solfeggio", "binaural"],
};
