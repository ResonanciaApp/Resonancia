import type { JourneyInfoSettings } from "@workspace/api-client-react";

export const INITIAL_JOURNEY_INFO = {
  title: "¿Qué es?",
  description: "El primer universo de Resonancia es un recorrido de 365 días de racha acumulada: 5 mundos de 73 días, cada uno dividido en fases que acompañan tu crecimiento.\n\nAl avanzar de fase, desbloqueas 3 avatares a tu elección. Al pasar de mundo, desbloqueas 10 avatares más.\n\nAl completar el universo, tu constancia será reconocida en el Hall of Fame de Resonancia.",
};
export function isJourneyInfoSettings(value: unknown): value is JourneyInfoSettings {
  if (!value || typeof value !== "object") return false;
  const data = value as JourneyInfoSettings;
  return Number.isInteger(data.revision) && data.revision >= 0 &&
    typeof data.content?.title === "string" && !!data.content.title.trim() && data.content.title.length <= 100 &&
    typeof data.content.description === "string" && !!data.content.description.trim() && data.content.description.length <= 5000;
}
