import { type ImageSourcePropType } from "react-native";
import { SESSIONS, type Session } from "@/data/sessions";

export type Series = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  gradient: [string, string];
  image: ImageSourcePropType;
  sessionIds: string[];
};

export const SERIES: Series[] = [
  {
    id: "7-dias-dormir-mejor",
    title: "7 días para dormir mejor",
    subtitle: "Programa · 7 sesiones",
    description:
      "Un viaje guiado de una semana para reconectar con el sueño profundo. Cada noche, un sonido distinto que prepara cuerpo y mente para descansar.",
    accentColor: "#8AAAD4",
    gradient: ["#243350", "#101A28"],
    image: SESSIONS.find((s) => s.id === "8")?.image ?? SESSIONS[0].image,
    sessionIds: ["8", "9", "2", "24", "25"],
  },
  {
    id: "iniciacion-al-cuenco",
    title: "Iniciación al cuenco",
    subtitle: "Programa · 4 sesiones",
    description:
      "Una introducción al mundo de los cuencos tibetanos y las frecuencias ancestrales. Ideal para quien recién empieza su camino sonoro.",
    accentColor: "#f4c993",
    gradient: ["#7A5520", "#3E2208"],
    image: SESSIONS.find((s) => s.id === "2")?.image ?? SESSIONS[0].image,
    sessionIds: ["2", "8", "9"],
  },
  {
    id: "calma-la-ansiedad",
    title: "Calma la ansiedad",
    subtitle: "Programa · 5 sesiones",
    description:
      "Una secuencia diseñada para soltar la tensión, regular la respiración y volver al centro. Para acompañarte en los días de mucho ruido interior.",
    accentColor: "#C8B4E0",
    gradient: ["#4A3260", "#251633"],
    image: SESSIONS.find((s) => s.id === "1")?.image ?? SESSIONS[0].image,
    sessionIds: ["1", "30", "26"],
  },
];

export function getSeriesById(id: string): Series | undefined {
  return SERIES.find((s) => s.id === id);
}

export function getSeriesSessions(series: Series): Session[] {
  return series.sessionIds
    .map((id) => SESSIONS.find((s) => s.id === id))
    .filter((s): s is Session => !!s);
}
