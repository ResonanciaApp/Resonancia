import { asc } from "drizzle-orm";
import { db, profileAvatarCategoriesTable, profileAvatarMembershipsTable, type CoverPreset } from "@workspace/db";

export function normalizeAvatarCategoryName(value: string) {
  const name = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  const normalizedName = name.toLocaleLowerCase("es");
  if (!name || name.length > 80 || ["todos", "sin categoría", "sin categoria"].includes(normalizedName)) return null;
  return { name, normalizedName };
}

export async function avatarCategoryMetadata(executor: Pick<typeof db, "select"> = db) {
  const categories = await executor.select({
    id: profileAvatarCategoriesTable.id,
    name: profileAvatarCategoriesTable.name,
  }).from(profileAvatarCategoriesTable).orderBy(asc(profileAvatarCategoriesTable.normalizedName));
  const memberships = await executor.select().from(profileAvatarMembershipsTable);
  const idsByPreset = new Map<string, string[]>();
  for (const membership of memberships) {
    const ids = idsByPreset.get(membership.presetId) ?? [];
    ids.push(membership.categoryId);
    idsByPreset.set(membership.presetId, ids);
  }
  return { categories, idsByPreset };
}

export function serializeAvatarMembership(preset: CoverPreset, idsByPreset: Map<string, string[]>) {
  return preset.scope === "profile" ? { categoryIds: (idsByPreset.get(preset.id) ?? []).sort() } : {};
}
