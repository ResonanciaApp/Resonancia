import { UpdateAdminStreakInfoBody } from "@workspace/api-zod";

export const STREAK_CARD_IDS = ["current", "accumulated", "longest", "completed"] as const;
export const DEFAULT_STREAK_INFO = {
  title: "Sistema de rachas",
  description: "Existen diferentes tipos de rachas que te muestran tu compromiso, constancia y evolución en la app.",
  cards: [
    { id: "current" as const, title: "Racha actual", description: "Días activos de esta semana, no necesariamente consecutivos." },
    { id: "accumulated" as const, title: "Racha acumulada", description: "Total de días que has sumado de racha desde que comenzaste" },
    { id: "longest" as const, title: "Racha más larga", description: "Tu mejor secuencia de dias de racha consecutiva en la App" },
    { id: "completed" as const, title: "Rachas completadas", description: "Semanas de lunes a domingo en las que completaste los 7 días activos" },
  ],
};

const schema = UpdateAdminStreakInfoBody.superRefine(({ content }, ctx) => {
  const ids = new Set(content.cards.map(card => card.id));
  if (ids.size !== 4 || STREAK_CARD_IDS.some(id => !ids.has(id))) {
    ctx.addIssue({ code: "custom", path: ["content", "cards"], message: "Debe existir una card por cada tipo de racha." });
  }
  for (const key of ["title", "description"] as const) {
    if (!content[key].trim()) ctx.addIssue({ code: "custom", path: ["content", key], message: "Campo obligatorio" });
    content.cards.forEach((card, index) => {
      if (!card[key].trim()) ctx.addIssue({ code: "custom", path: ["content", "cards", index, key], message: "Campo obligatorio" });
    });
  }
}).transform(({ content, revision }) => ({
  revision,
  content: {
    title: content.title.trim(),
    description: content.description.trim(),
    cards: STREAK_CARD_IDS.map(id => {
      const card = content.cards.find(item => item.id === id)!;
      return { id, title: card.title.trim(), description: card.description.trim() };
    }),
  },
}));

export const validateStreakInfoUpdate = (value: unknown) => schema.safeParse(value);
