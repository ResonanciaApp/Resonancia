export const DEFAULT_GREETINGS = {
  morning: "Buenos días",
  afternoon: "Buenas tardes",
  night: "Buenas noches",
} as const;

export type RemoteGreeting = { enabled: boolean; text: string | null };

export function getAutomaticGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return DEFAULT_GREETINGS.morning;
  if (hour >= 12 && hour < 19) return DEFAULT_GREETINGS.afternoon;
  return DEFAULT_GREETINGS.night;
}

export function millisecondsUntilNextGreetingBoundary(now: Date = new Date()): number {
  const next = new Date(now);
  const hour = now.getHours();
  const nextHour = hour < 6 ? 6 : hour < 12 ? 12 : hour < 19 ? 19 : 6;
  if (hour >= 19) next.setDate(next.getDate() + 1);
  next.setHours(nextHour, 0, 0, 0);
  return Math.max(1_000, next.getTime() - now.getTime());
}

export function resolveGreeting(
  remote: RemoteGreeting | null | undefined,
  cached: RemoteGreeting | null | undefined,
  date: Date = new Date(),
): string {
  const setting = remote ?? cached;
  if (setting?.enabled && typeof setting.text === "string" && setting.text.trim()) {
    return setting.text.trim();
  }
  return getAutomaticGreeting(date);
}

export function isValidGreetingSetting(value: unknown): value is RemoteGreeting {
  if (!value || typeof value !== "object") return false;
  const setting = value as Partial<RemoteGreeting>;
  return typeof setting.enabled === "boolean"
    && (setting.text === null || typeof setting.text === "string");
}