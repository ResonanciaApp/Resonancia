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
