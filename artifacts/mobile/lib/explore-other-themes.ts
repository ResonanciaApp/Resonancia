export interface ExploreSection {
  slug: string;
  label: string;
  visible: boolean;
  sortOrder: number;
  coverImagePath?: string | null;
}

export interface ThemeCardSource<TImage> {
  id: string;
  label: string;
  description: string;
  image: TImage;
}

export interface ThemeSessionSource<TImage> {
  themeTag?: readonly string[];
  image: TImage;
}

export interface OtherThemeCard<TImage> {
  id: string;
  label: string;
  description: string;
  image: TImage | undefined;
}

export const OTHER_THEME_INTERNAL_PREFIX = "__other_theme_internal:";

export interface OtherThemeInternalTag {
  parentSlug: string;
  label: string;
}

const CANONICAL_OTHER_THEME_PARENT_SLUGS: Record<string, string> = {
  "para-la-ansiedad": "para-la-ansiedad",
  "energiza-tus-mananas": "energiza-tus-mananas",
  "foco-y-concentracion": "foco-concentracion",
  "foco-concentracion": "foco-concentracion",
  "suelto-la-rabia": "suelto-la-rabia",
  "crecimiento-personal": "crecimiento-personal",
  "armonia-familiar": "armonia-familiar",
  "respiracion-consciente": "respiracion-consciente",
  "meditaciones-activas": "meditaciones-activas",
  astrologia: "astrologia",
};

function slugifyOtherThemeParent(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Returns the stable route ID used by the nine default Otras temáticas cards. */
export function canonicalOtherThemeParentSlug(value: string): string {
  const slug = slugifyOtherThemeParent(value);
  return CANONICAL_OTHER_THEME_PARENT_SLUGS[slug] ?? slug;
}

/** Parses the private token used to attach a session to a thematic carousel. */
export function parseOtherThemeInternalTag(
  value: string,
): OtherThemeInternalTag | null {
  if (!value.startsWith(OTHER_THEME_INTERNAL_PREFIX)) return null;
  const remainder = value.slice(OTHER_THEME_INTERNAL_PREFIX.length);
  const separator = remainder.indexOf("__:");
  if (separator <= 0) return null;
  const parentSlug = canonicalOtherThemeParentSlug(
    remainder.slice(0, separator),
  );
  const label = remainder.slice(separator + 3).trim();
  return parentSlug && label ? { parentSlug, label } : null;
}

export function isOtherThemeInternalTag(value: string): boolean {
  return parseOtherThemeInternalTag(value) !== null;
}

export function buildOtherThemeInternalRoute(
  parentSlug: string,
  label: string,
): string {
  return `/tag/${encodeURIComponent(parentSlug)}/internal/${encodeURIComponent(label)}`;
}

export function groupOtherThemeInternalSessions<T extends ThemeSessionSource<unknown>>(
  sessions: readonly T[],
  parentSlug: string,
  parentLabel?: string,
): Map<string, T[]> {
  const canonicalParentSlug = canonicalOtherThemeParentSlug(parentSlug);
  const groups = new Map<string, T[]>();
  for (const session of sessions) {
    const tags = session.themeTag ?? [];
    const belongsToParent = tags.some((tag) =>
      tag === parentLabel ||
      tag === parentSlug ||
      parseOtherThemeInternalTag(tag)?.parentSlug === canonicalParentSlug,
    );
    if (!belongsToParent) continue;
    for (const tag of tags) {
      const parsed = parseOtherThemeInternalTag(tag);
      if (!parsed || parsed.parentSlug !== canonicalParentSlug) continue;
      const group = groups.get(parsed.label) ?? [];
      group.push(session);
      groups.set(parsed.label, group);
    }
  }
  return groups;
}

export function hasOtherThemeInternalTag(
  session: ThemeSessionSource<unknown>,
  parentSlug: string,
  parentLabel?: string,
): boolean {
  return groupOtherThemeInternalSessions([session], parentSlug, parentLabel).size > 0;
}

function isInternalEditorialSection(section: ExploreSection): boolean {
  const label = section.label.trim();
  return (
    label.startsWith("__") ||
    /^(?:super)?category-theme-/.test(section.slug)
  );
}

export function parseExploreSectionsCache(raw: string | null): ExploreSection[] | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ExploreSection[]) : null;
  } catch {
    return null;
  }
}

export function keepLastExploreSections(
  current: ExploreSection[] | null,
): ExploreSection[] {
  return current ?? [];
}

export function buildOtherThemeCards<TImage>({
  sections,
  localCards,
  sessions,
  isExcludedLabel,
  slugifyLabel,
  resolveCoverImage,
}: {
  sections: ExploreSection[] | null;
  localCards: readonly ThemeCardSource<TImage>[];
  sessions: readonly ThemeSessionSource<TImage>[];
  isExcludedLabel: (label: string) => boolean;
  slugifyLabel: (label: string) => string;
  resolveCoverImage?: (path: string) => string;
}): OtherThemeCard<TImage | string>[] {
  if (!sections?.length) return [];

  const seen = new Set<string>();
  return sections
    .filter((section) => {
      if (
        !section.visible ||
        isInternalEditorialSection(section) ||
        isExcludedLabel(section.label) ||
        seen.has(section.slug)
      ) {
        return false;
      }
      seen.add(section.slug);
      return true;
    })
    .map((section) => {
      const localCard = localCards.find((card) => card.id === section.slug);
      const matchingSession = sessions.find((session) =>
        session.themeTag?.some(
          (tag) =>
            !isOtherThemeInternalTag(tag) &&
            (tag === section.label || slugifyLabel(tag) === section.slug),
        ),
      );

      return {
        id: section.slug,
        label: localCard?.label ?? section.label,
        description:
          localCard?.description ??
          `Sesiones para explorar ${section.label.toLocaleLowerCase("es")}.`,
        image:
          (section.coverImagePath && resolveCoverImage
            ? resolveCoverImage(section.coverImagePath)
            : undefined) ??
          localCard?.image ??
          matchingSession?.image,
      };
    });
}