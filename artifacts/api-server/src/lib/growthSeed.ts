import type { GrowthStageRecord } from "@workspace/db";
export const growthSeedRows = [
  ["intencion", "Intención", 0, 0, "Todo gran cambio comienza con una intención.", "00-intencion.png"],
  ["semilla", "Semilla", 1, 7, "Tu primer paso abre un espacio para crecer.", "01-semilla.png"],
  ["brote", "Brote", 8, 14, "Tu práctica comienza a echar raíces.", "02-brote.png"],
  ["crecimiento", "Crecimiento", 15, 21, "Tu disciplina se fortalece y comienzas a crecer.", "03-crecimiento.png"],
  ["desarrollo", "Desarrollo", 22, 28, "La práctica comienza a integrarse en tu vida.", "04-desarrollo.png"],
  ["enraizamiento", "Enraizamiento", 29, 35, "Tu práctica se vuelve más sólida y estable.", "05-enraizamiento.png"],
  ["vegetacion", "Vegetación", 36, 42, "Tu bienestar crece y comienza a expandirse.", "06-vegetacion.png"],
  ["floracion", "Floración", 43, 49, "Tu dedicación florece y llena tu vida de luz.", "07-floracion.png"],
  ["expansion", "Expansión", 50, 56, "Tu práctica se expande y transforma tu energía.", "08-expansion.png"],
  ["ascenso-inicio", "Inicio", 57, 63, "Das el primer paso hacia un horizonte nuevo.", "ascenso-01-inicio.png"],
  ["ascenso-sendero", "Sendero", 64, 70, "Encuentras tu ritmo entre árboles y caminos.", "ascenso-02-sendero.png"],
  ["ascenso-ascenso", "Ascenso", 71, 77, "Cada paso te lleva más allá de lo conocido.", "ascenso-03-ascenso.png"],
  ["ascenso-altura", "Altura", 78, 84, "Desde arriba, reconoces cuánto has avanzado.", "ascenso-04-altura.png"],
  ["ascenso-mirador", "Mirador", 85, 91, "Te detienes a mirar el camino recorrido.", "ascenso-05-mirador.png"],
  ["ascenso-cumbre", "Cumbre", 92, 98, "Llegas alto sin perder lo que te trajo aquí.", "ascenso-06-cumbre.png"],
  ["ascenso-horizonte", "Horizonte", 99, 105, "Descubres que siempre hay más por explorar.", "ascenso-07-horizonte.png"],
  ["ascenso-trascendencia", "Trascendencia", 106, 112, "Tu mirada se abre más allá de la montaña.", "ascenso-08-trascendencia.png"],
] as const;
const rewards = new Set(["semilla", "crecimiento", "vegetacion", "expansion"]);
export const growthSeed: GrowthStageRecord[] = growthSeedRows.map(([id, name, startDay, endDay, story, filename]) => ({
  id, name, startDay, endDay, story,
  group: id.startsWith("ascenso-") ? "ascenso" : "florecimiento",
  imageUrl: `/api/storage/public-objects/growth/${filename}`,
  rewards: rewards.has(id) ? [{
    id: `${id}-avatars`, enabled: true, text: "Desbloquea {cantidad} avatares a elección", amount: 5,
  }] : [],
}));
