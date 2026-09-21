import type { DailyQuotePalette } from "@workspace/api-client-react";

export const DAILY_QUOTE_PALETTE_COLORS: Record<
  DailyQuotePalette,
  readonly [string, string]
> = {
  jade: ["#073C3B", "#987044"],
  violet: ["#17132D", "#65417E"],
  ocean: ["#061A32", "#236174"],
  ruby: ["#280711", "#81425B"],
  amber: ["#271307", "#94642E"],
};