/** Pure helpers for profile avatar categories (cache envelopes + local filtering). */

export type AvatarCategory = { id: string; name: string };
export type CatalogEnvelope<P> = { categories: AvatarCategory[]; presets: P[] };

export const ALL_AVATARS = "__all__";
export const UNCATEGORIZED_AVATARS = "__none__";
export type AvatarCategoryFilter = string;

type RawPreset = { id: string; key: string; label: string; scope: string; categoryIds?: string[] };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPreset(value: unknown, scope?: string): value is RawPreset {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || !item.id) return false;
  if (typeof item.key !== "string" || typeof item.label !== "string") return false;
  if (typeof item.scope !== "string" || (scope !== undefined && item.scope !== scope)) return false;
  if (typeof item.sortOrder !== "number" || !Number.isFinite(item.sortOrder)) return false;
  if (item.source !== "builtin" && item.source !== "object") return false;
  if (item.objectPath != null && typeof item.objectPath !== "string") return false;
  if (item.builtinKey != null && typeof item.builtinKey !== "string") return false;
  if (item.isLocked !== undefined && typeof item.isLocked !== "boolean") return false;
  return item.categoryIds === undefined || isStringArray(item.categoryIds);
}

function isCategory(value: unknown): value is AvatarCategory {
  return !!value && typeof value === "object"
    && typeof (value as AvatarCategory).id === "string" && !!(value as AvatarCategory).id
    && typeof (value as AvatarCategory).name === "string";
}

function unique(ids: readonly string[]): boolean {
  return new Set(ids).size === ids.length;
}

/**
 * Validates a server response or cached payload. Accepts the legacy array cache
 * (presets only, no memberships) and the new envelope. Returns null when anything
 * is corrupt so callers keep their previous valid snapshot instead of erasing it.
 * Responses from older servers may omit categories only if no preset has memberships.
 */
export function parseCatalogEnvelope<P extends RawPreset>(raw: unknown, scope?: string): CatalogEnvelope<P> | null {
  let presets: unknown;
  let categories: unknown;
  if (Array.isArray(raw)) {
    presets = raw;
    categories = undefined;
  } else if (raw && typeof raw === "object") {
    const envelope = raw as { presets?: unknown; categories?: unknown };
    presets = envelope.presets;
    categories = envelope.categories;
    if ("categories" in envelope && categories === null) return null;
  } else {
    return null;
  }
  if (!Array.isArray(presets) || !presets.every((item) => isPreset(item, scope))) return null;
  const list = presets as P[];
  if (!unique(list.map((item) => item.id))) return null;
  if (categories !== undefined && (!Array.isArray(categories) || !categories.every(isCategory))) return null;
  const dictionary = (categories as AvatarCategory[] | undefined) ?? [];
  if (!unique(dictionary.map((item) => item.id))) return null;
  const known = new Set(dictionary.map((item) => item.id));
  for (const item of list) {
    const ids = item.categoryIds ?? [];
    if (!unique(ids) || ids.some((id) => !known.has(id))) return null;
  }
  return { categories: dictionary, presets: list };
}

export function filterAvatarsByCategory<T extends { id: string; categoryIds?: string[] }>(
  items: readonly T[],
  filter: AvatarCategoryFilter,
): T[] {
  const seen = new Set<string>();
  const unique = items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
  if (filter === ALL_AVATARS) return unique;
  if (filter === UNCATEGORIZED_AVATARS) return unique.filter((item) => !item.categoryIds?.length);
  return unique.filter((item) => item.categoryIds?.includes(filter));
}

export function avatarFilterLabel(filter: AvatarCategoryFilter, categories: readonly AvatarCategory[]): string {
  if (filter === ALL_AVATARS) return "Todos";
  if (filter === UNCATEGORIZED_AVATARS) return "Sin categoría";
  return categories.find((item) => item.id === filter)?.name ?? "Todos";
}

/** Only an authoritative (freshly validated) catalog may reset a missing category to Todos. */
export function reconcileAvatarFilter(
  filter: AvatarCategoryFilter,
  categories: readonly AvatarCategory[],
  authoritative: boolean,
): AvatarCategoryFilter {
  if (filter === ALL_AVATARS || filter === UNCATEGORIZED_AVATARS) return filter;
  if (!authoritative) return filter;
  return categories.some((item) => item.id === filter) ? filter : ALL_AVATARS;
}

export function avatarFilterOptions(categories: readonly AvatarCategory[]): { id: string; label: string }[] {
  return [
    { id: ALL_AVATARS, label: "Todos" },
    { id: UNCATEGORIZED_AVATARS, label: "Sin categoría" },
    ...categories.map((item) => ({ id: item.id, label: item.name })),
  ];
}

export type AvatarGridPlaceholder = { id: string; placeholder: true };

/** Pads the last row with invisible cells so short groups keep the 5-column rhythm. */
export function padAvatarGrid<T extends { id: string }>(
  items: readonly T[],
  columns: number,
): Array<(T & { placeholder?: undefined }) | AvatarGridPlaceholder> {
  const result: Array<(T & { placeholder?: undefined }) | AvatarGridPlaceholder> = [...items] as Array<T & { placeholder?: undefined }>;
  const remainder = items.length % columns;
  if (remainder) {
    for (let i = remainder; i < columns; i += 1) result.push({ id: `__avatar-grid-pad-${i}`, placeholder: true });
  }
  return result;
}
