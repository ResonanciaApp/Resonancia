import type { MoodId } from "@/data/moods";

// Pares de color de la referencia editorial, de inicio a fin del degradado.
const PALETTE = {
  gratitude: ["#56B3CD", "#62A2D2"],
  happiness: ["#41BB9F", "#2CA379"],
  distress: ["#E77A8D", "#FA876C"],
  intensity: ["#C581BB", "#EC8282"],
  stillness: ["#9188E2", "#BB7EBF"],
} as const;

export const MOOD_CALENDAR_COLORS: Record<MoodId, readonly [string, string]> = {
  agradecido: PALETTE.gratitude,
  emocionado: PALETTE.gratitude,
  "lleno-de-amor": PALETTE.gratitude,
  feliz: PALETTE.happiness,
  esperanzado: PALETTE.happiness,
  contento: PALETTE.happiness,
  ansioso: PALETTE.distress,
  cansado: PALETTE.distress,
  inepto: PALETTE.distress,
  solo: PALETTE.distress,
  deprimido: PALETTE.distress,
  triste: PALETTE.distress,
  enojado: PALETTE.intensity,
  adolorido: PALETTE.intensity,
  desmotivado: PALETTE.intensity,
  estresado: PALETTE.intensity,
  presente: PALETTE.stillness,
  "en-paz": PALETTE.stillness,
};