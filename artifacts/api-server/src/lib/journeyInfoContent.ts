import { UpdateAdminJourneyInfoBody } from "@workspace/api-zod";

export const DEFAULT_JOURNEY_INFO = {
  title: "¿Qué es?",
  description: "El primer universo de Resonancia es un recorrido de 365 días de racha acumulada: 5 mundos de 73 días, cada uno dividido en fases que acompañan tu crecimiento.\n\nAl avanzar de fase, desbloqueas 3 avatares a tu elección. Al pasar de mundo, desbloqueas 10 avatares más.\n\nAl completar el universo, tu constancia será reconocida en el Hall of Fame de Resonancia.",
};

export function validateJourneyInfoUpdate(input: unknown) {
  return UpdateAdminJourneyInfoBody.refine(
    value => Boolean(value.content.title.trim() && value.content.description.trim()),
    { message: "Los textos no pueden estar vacíos" },
  ).transform(value => ({
    ...value,
    content: { title: value.content.title.trim(), description: value.content.description.trim() },
  })).safeParse(input);
}
