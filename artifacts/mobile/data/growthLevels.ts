import type { ImageSourcePropType } from "react-native";

export type GrowthLevel = {
  id: string;
  name: string;
  startDay: number;
  endDay: number;
  story: string;
  image: ImageSourcePropType;
};

// Intención precedes the first active day; the remaining ranges are editorial.
export const growthLevels: readonly GrowthLevel[] = [
  { id: "intencion", name: "Intención", startDay: 0, endDay: 0, story: "Todo gran cambio comienza con una intención.", image: require("../assets/images/growth/00-intencion.png") },
  { id: "semilla", name: "Semilla", startDay: 1, endDay: 7, story: "Tu primer paso abre un espacio para crecer.", image: require("../assets/images/growth/01-semilla.png") },
  { id: "brote", name: "Brote", startDay: 8, endDay: 14, story: "Tu práctica comienza a echar raíces.", image: require("../assets/images/growth/02-brote.png") },
  { id: "crecimiento", name: "Crecimiento", startDay: 15, endDay: 21, story: "Tu disciplina se fortalece y comienzas a crecer.", image: require("../assets/images/growth/03-crecimiento.png") },
  { id: "desarrollo", name: "Desarrollo", startDay: 22, endDay: 28, story: "La práctica comienza a integrarse en tu vida.", image: require("../assets/images/growth/04-desarrollo.png") },
  { id: "enraizamiento", name: "Enraizamiento", startDay: 29, endDay: 35, story: "Tu práctica se vuelve más sólida y estable.", image: require("../assets/images/growth/05-enraizamiento.png") },
  { id: "vegetacion", name: "Vegetación", startDay: 36, endDay: 42, story: "Tu bienestar crece y comienza a expandirse.", image: require("../assets/images/growth/06-vegetacion.png") },
  { id: "floracion", name: "Floración", startDay: 43, endDay: 49, story: "Tu dedicación florece y llena tu vida de luz.", image: require("../assets/images/growth/07-floracion.png") },
  { id: "expansion", name: "Expansión", startDay: 50, endDay: 56, story: "Tu práctica se expande y transforma tu energía.", image: require("../assets/images/growth/08-expansion.png") },
];

export function growthLevelIndex(days: number): number {
  const safeDays = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
  const next = growthLevels.findIndex((level) => safeDays <= level.endDay);
  return next === -1 ? growthLevels.length - 1 : next;
}