import type { MoodId } from "@workspace/api-client-react";

export const MOOD_OPTIONS: ReadonlyArray<{ id: MoodId; label: string }> = [
  { id: "estresado", label: "🥵 Estresad@" },
  { id: "ansioso", label: "😬 Ansios@" },
  { id: "cansado", label: "😪 Cansad@" },
  { id: "inepto", label: "😑 Inept@" },
  { id: "triste", label: "😭 Triste" },
  { id: "solo", label: "🥺 Solo(a)" },
  { id: "deprimido", label: "😔 Deprimido(a)" },
  { id: "desmotivado", label: "😪 Desmotivado(a)" },
  { id: "enojado", label: "😤 Enojado(a)" },
  { id: "adolorido", label: "😣 Adolorido(a)" },
  { id: "agradecido", label: "🙏 Agradecido(a)" },
  { id: "emocionado", label: "🤩 Emocionado(a)" },
  { id: "lleno-de-amor", label: "🥰 Lleno(a) de amor" },
  { id: "feliz", label: "😊 Feliz" },
  { id: "en-paz", label: "😌 En paz" },
  { id: "esperanzado", label: "😇 Esperanzado(a)" },
  { id: "contento", label: "🙂 Contento(a)" },
  { id: "presente", label: "🧘 Presente" },
];

export const MOOD_LABEL_TO_ID = new Map(
  MOOD_OPTIONS.map((option) => [option.label, option.id]),
);