import type { ThemeTag } from "@/data/tags";

export type MoodId =
  | "tranquilo"
  | "triste"
  | "cansado"
  | "ansioso"
  | "en-panico"
  | "inseguro";

export interface Mood {
  id: MoodId;
  emoji: string;
  label: string;
  themeTags: ThemeTag[];
  categoryIds: string[];
}

export const MOODS: Mood[] = [
  {
    id: "tranquilo",
    emoji: "😌",
    label: "Tranquil@",
    themeTags: ["Respiración consciente"],
    categoryIds: ["meditaciones-guiadas", "musica-sonidos"],
  },
  {
    id: "triste",
    emoji: "😕",
    label: "Triste",
    themeTags: ["Crecimiento personal", "Armonía familiar"],
    categoryIds: ["meditaciones-guiadas"],
  },
  {
    id: "cansado",
    emoji: "😴",
    label: "Cansad@",
    themeTags: ["Energiza tus mañanas", "Meditaciones Activas"],
    categoryIds: ["musica-sonidos", "sonidos-ancestrales"],
  },
  {
    id: "ansioso",
    emoji: "😬",
    label: "Ansios@",
    themeTags: ["Para la ansiedad", "Respiración consciente"],
    categoryIds: ["meditaciones-guiadas", "musica-sonidos"],
  },
  {
    id: "en-panico",
    emoji: "😤",
    label: "En pánico",
    themeTags: ["Para la ansiedad", "Respiración consciente"],
    categoryIds: ["meditaciones-guiadas"],
  },
  {
    id: "inseguro",
    emoji: "😟",
    label: "Insegur@",
    themeTags: ["Crecimiento personal", "Foco y concentración"],
    categoryIds: ["meditaciones-guiadas", "podcast"],
  },
];

export function getMoodById(id: string): Mood | undefined {
  return MOODS.find((m) => m.id === id);
}
