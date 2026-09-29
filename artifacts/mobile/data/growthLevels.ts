import type { ImageSourcePropType } from "react-native";

export type GrowthLevel = {
  id: string;
  name: string;
  startDay: number;
  endDay: number;
  story: string;
  image: ImageSourcePropType;
};

// The ranges are editorial: Semilla includes day zero, so do not derive them
// with a generic floor(days / 7) calculation.
export const growthLevels: readonly GrowthLevel[] = [
  { id: "semilla", name: "Semilla", startDay: 0, endDay: 7, story: "Todo gran cambio comienza con una intención.", image: require("../assets/images/growth/01-semilla.png") },
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