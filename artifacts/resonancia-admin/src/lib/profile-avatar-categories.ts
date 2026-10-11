type CategoryLike = { id: string; name: string };
type PresetLike = { id: string; categoryIds?: string[] };

const RESERVED = ["todos", "sin categoría", "sin categoria"];

function normalize(name: string) {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

/** Client-side mirror of the server rules; the server remains authoritative. */
export function validateCategoryName(
  name: string,
  categories: readonly CategoryLike[],
  excludeId?: string,
): string | null {
  const clean = normalize(name);
  if (!clean) return "Escribe un nombre para la categoría.";
  if (clean.length > 80) return "El nombre admite hasta 80 caracteres.";
  if (RESERVED.includes(clean)) return "Todos y Sin categoría son nombres reservados.";
  if (categories.some(item => item.id !== excludeId && normalize(item.name) === clean)) {
    return "Ya existe una categoría con ese nombre.";
  }
  return null;
}

/**
 * Keeps the local (possibly unsaved) order and every local field, replacing only
 * categoryIds with the server's value for matching IDs. Server order never wins.
 */
export function mergeCategoryIds<T extends PresetLike>(local: readonly T[], server: readonly PresetLike[]): T[] {
  const byId = new Map(server.map(item => [item.id, item.categoryIds]));
  let changed = false;
  const next = local.map(item => {
    if (!byId.has(item.id)) return item;
    const ids = byId.get(item.id) ?? [];
    const current = item.categoryIds ?? [];
    if (ids.length === current.length && ids.every((id, i) => id === current[i])) return item;
    changed = true;
    return { ...item, categoryIds: [...ids] };
  });
  return changed ? next : (local as T[]);
}

export function categoryCounts(presets: readonly PresetLike[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const preset of presets) {
    for (const id of new Set(preset.categoryIds ?? [])) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export function membershipPayload(presetIds: Iterable<string>, categoryId: string, add: boolean) {
  return { data: { presetIds: [...new Set(presetIds)], categoryIds: [categoryId], mode: add ? "add" as const : "remove" as const } };
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === "object") {
      const msg = (data as { error?: unknown; message?: unknown }).error ?? (data as { message?: unknown }).message;
      if (typeof msg === "string" && msg.trim()) return msg;
      if (msg && typeof msg === "object" && typeof (msg as { message?: unknown }).message === "string") {
        return (msg as { message: string }).message;
      }
    }
  }
  return fallback;
}
