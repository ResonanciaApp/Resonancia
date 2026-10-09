export type GrowthLevel = {
  id: string;
  name: string;
  startDay: number;
  endDay: number;
  story: string;
  detailPhrase?: string;
  detailDescription?: string;
  image: number | string;
  group?: "florecimiento" | "ascenso";
  rewards?: { id: string; enabled: boolean; text: string; amount: number }[];
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

export const ascentLevels: readonly GrowthLevel[] = [
  { id: "ascenso-inicio", name: "Inicio", startDay: 57, endDay: 63, story: "Das el primer paso hacia un horizonte nuevo.", image: require("../assets/images/growth/ascenso-01-inicio.png") },
  { id: "ascenso-sendero", name: "Sendero", startDay: 64, endDay: 70, story: "Encuentras tu ritmo entre árboles y caminos.", image: require("../assets/images/growth/ascenso-02-sendero.png") },
  { id: "ascenso-ascenso", name: "Ascenso", startDay: 71, endDay: 77, story: "Cada paso te lleva más allá de lo conocido.", image: require("../assets/images/growth/ascenso-03-ascenso.png") },
  { id: "ascenso-altura", name: "Altura", startDay: 78, endDay: 84, story: "Desde arriba, reconoces cuánto has avanzado.", image: require("../assets/images/growth/ascenso-04-altura.png") },
  { id: "ascenso-mirador", name: "Mirador", startDay: 85, endDay: 91, story: "Te detienes a mirar el camino recorrido.", image: require("../assets/images/growth/ascenso-05-mirador.png") },
  { id: "ascenso-cumbre", name: "Cumbre", startDay: 92, endDay: 98, story: "Llegas alto sin perder lo que te trajo aquí.", image: require("../assets/images/growth/ascenso-06-cumbre.png") },
  { id: "ascenso-horizonte", name: "Horizonte", startDay: 99, endDay: 105, story: "Descubres que siempre hay más por explorar.", image: require("../assets/images/growth/ascenso-07-horizonte.png") },
  { id: "ascenso-trascendencia", name: "Trascendencia", startDay: 106, endDay: 112, story: "Tu mirada se abre más allá de la montaña.", image: require("../assets/images/growth/ascenso-08-trascendencia.png") },
];

export const allGrowthLevels: readonly GrowthLevel[] = [...growthLevels, ...ascentLevels];

export function growthLevelIndex(days: number): number {
  const safeDays = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
  const next = allGrowthLevels.findIndex((level) => safeDays <= level.endDay);
  return next === -1 ? allGrowthLevels.length - 1 : next;
}