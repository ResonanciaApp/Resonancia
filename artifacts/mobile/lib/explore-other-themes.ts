export interface ExploreSection {
  slug: string;
  label: string;
  visible: boolean;
  sortOrder: number;
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
}: {
  sections: ExploreSection[] | null;
  localCards: readonly ThemeCardSource<TImage>[];
  sessions: readonly ThemeSessionSource<TImage>[];
  isExcludedLabel: (label: string) => boolean;
  slugifyLabel: (label: string) => string;
}): OtherThemeCard<TImage>[] {
  if (!sections?.length) return [];

  const seen = new Set<string>();
  return sections
    .filter((section) => {
      if (!section.visible || isExcludedLabel(section.label) || seen.has(section.slug)) {
        return false;
      }
      seen.add(section.slug);
      return true;
    })
    .map((section) => {
      const localCard = localCards.find((card) => card.id === section.slug);
      const matchingSession = sessions.find((session) =>
        session.themeTag?.some(
          (tag) => tag === section.label || slugifyLabel(tag) === section.slug,
        ),
      );

      return {
        id: section.slug,
        label: localCard?.label ?? section.label,
        description:
          localCard?.description ??
          `Sesiones para explorar ${section.label.toLocaleLowerCase("es")}.`,
        image: localCard?.image ?? matchingSession?.image,
      };
    });
}