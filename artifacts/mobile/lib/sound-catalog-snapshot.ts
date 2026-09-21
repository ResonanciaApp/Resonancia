export interface CatalogCategory {
  id: string;
  label: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CategorizedSound {
  categoryId: string;
}

export interface CatalogSnapshot<TSound extends CategorizedSound> {
  sounds: TSound[];
  /** Undefined only for legacy caches/API responses that predate categories. */
  categories?: CatalogCategory[];
}

export interface NormalizedCatalogSnapshot<TSound extends CategorizedSound> {
  sounds: TSound[];
  categories: CatalogCategory[];
}

export function deriveLegacyCategories(
  sounds: readonly CategorizedSound[],
): CatalogCategory[] {
  const seen = new Set<string>();
  return sounds.reduce<CatalogCategory[]>((result, sound) => {
    const id = sound.categoryId?.trim();
    if (!id || seen.has(id)) return result;
    seen.add(id);
    const words = id.replace(/_/g, " ");
    result.push({
      id,
      label: words.charAt(0).toUpperCase() + words.slice(1),
      sortOrder: result.length,
      isActive: true,
    });
    return result;
  }, []);
}

export function normalizeCatalogSnapshot<TSound extends CategorizedSound>(
  snapshot: CatalogSnapshot<TSound>,
): NormalizedCatalogSnapshot<TSound> {
  return {
    sounds: snapshot.sounds,
    categories:
      snapshot.categories === undefined
        ? deriveLegacyCategories(snapshot.sounds)
        : snapshot.categories,
  };
}

export function parseSoundCatalogResponse<TSound extends CategorizedSound>(
  body: unknown,
): NormalizedCatalogSnapshot<TSound> | null {
  if (!body || typeof body !== "object") return null;
  const candidate = body as { sounds?: unknown; categories?: unknown };
  if (!Array.isArray(candidate.sounds)) return null;
  return normalizeCatalogSnapshot({
    sounds: candidate.sounds as TSound[],
    categories:
      candidate.categories === undefined
        ? undefined
        : Array.isArray(candidate.categories)
          ? candidate.categories as CatalogCategory[]
          : undefined,
  });
}