export const SUPERCATEGORY_EDITORIAL_TAG_TYPES = {
  descanso: "supercategory_theme_descanso",
  sonidos: "supercategory_theme_sonidos",
} as const;

export type SupercategoryEditorialType = keyof typeof SUPERCATEGORY_EDITORIAL_TAG_TYPES;
export type SupercategoryFilter =
  | "all"
  | "duration-5"
  | "duration-10"
  | "duration-11"
  | `editorial:${string}`;

export type SupercategoryFilterTab = {
  id: SupercategoryFilter;
  label: string;
};

export function getSupercategoryFilterTabs(
  editorialTags: readonly string[],
  includeDurationFilters = true,
): SupercategoryFilterTab[] {
  return [
    { id: "all", label: "Ver todo" },
    ...(includeDurationFilters
      ? [
          { id: "duration-5" as const, label: "5 min" },
          { id: "duration-10" as const, label: "10 min" },
          { id: "duration-11" as const, label: "11+ min" },
        ]
      : []),
    ...editorialTags.map((tag) => ({
      id: `editorial:${tag}` as const,
      label: tag,
    })),
  ];
}

export function shouldShowSupercategoryFilterTabs(
  editorialTags: readonly string[],
  hideWithoutEditorialTags: boolean,
): boolean {
  return !hideWithoutEditorialTags || editorialTags.length > 0;
}

type ThemeTagged = {
  themeTag?: readonly string[] | null;
};

type SupercategoryFeatureable = {
  isFeaturedCategory?: boolean;
};

type FilterableSession = ThemeTagged & {
  durationLabel: string;
};

function prefixFor(type: SupercategoryEditorialType): string {
  return `__${SUPERCATEGORY_EDITORIAL_TAG_TYPES[type]}__:`;
}

export function getSupercategoryEditorialTags(
  session: ThemeTagged,
  type: SupercategoryEditorialType,
): string[] {
  const prefix = prefixFor(type);
  return [...new Set(
    (session.themeTag ?? [])
      .filter((value) => value.startsWith(prefix))
      .map((value) => value.slice(prefix.length))
      .filter(Boolean),
  )];
}

function durationMinutes(label: string): number {
  const match = label.match(/(\d+(?:[.,]\d+)?)\s*min/i);
  if (match) return Number(match[1].replace(",", "."));
  const parts = label.split(":").map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) return parts[0] + parts[1] / 60;
  return Number.parseFloat(label.replace(",", "."));
}

export function matchesSupercategoryFilter(
  session: FilterableSession,
  type: SupercategoryEditorialType,
  filter: SupercategoryFilter,
): boolean {
  if (filter === "all") return true;
  if (filter.startsWith("editorial:")) {
    return getSupercategoryEditorialTags(session, type)
      .includes(filter.slice("editorial:".length));
  }
  const minutes = durationMinutes(session.durationLabel);
  if (filter === "duration-5") return minutes <= 5;
  if (filter === "duration-10") return minutes > 5 && minutes <= 10;
  return minutes > 10;
}

export function collectSupercategoryEditorialTags(
  sessions: ThemeTagged[],
  type: SupercategoryEditorialType,
): string[] {
  return [...new Set(sessions.flatMap((session) => getSupercategoryEditorialTags(session, type)))];
}

export function collectSupercategoryFeaturedSessions<
  T extends SupercategoryFeatureable,
>(sessions: readonly T[]): T[] {
  return sessions.filter((session) => session.isFeaturedCategory === true);
}