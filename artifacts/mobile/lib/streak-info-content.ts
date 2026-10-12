import type { StreakInfoSettings } from "@workspace/api-client-react";

export function isStreakInfoSettings(value: unknown): value is StreakInfoSettings {
  if (!value || typeof value !== "object") return false;
  const data = value as StreakInfoSettings;
  const content = data.content;
  if (!Number.isInteger(data.revision) || data.revision < 0 || !content) return false;
  const text = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
  if (!text(content.title, 100) || !text(content.description, 1000) || !Array.isArray(content.cards) || content.cards.length !== 4) return false;
  const ids = new Set(["current", "accumulated", "longest", "completed"]);
  return content.cards.every(card => {
    if (!card || !ids.delete(card.id)) return false;
    return text(card.title, 100) && text(card.description, 2000);
  }) && ids.size === 0;
}
