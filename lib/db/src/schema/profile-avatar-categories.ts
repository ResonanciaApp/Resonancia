import { pgTable, text, primaryKey, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { coverPresetsTable } from "./cover-presets";

export const profileAvatarCategoriesTable = pgTable("profile_avatar_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
}, table => [uniqueIndex("profile_avatar_categories_name_idx").on(table.normalizedName)]);

export const profileAvatarMembershipsTable = pgTable("profile_avatar_memberships", {
  presetId: text("preset_id").notNull().references(() => coverPresetsTable.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => profileAvatarCategoriesTable.id, { onDelete: "cascade" }),
}, table => [
  primaryKey({ columns: [table.presetId, table.categoryId] }),
  index("profile_avatar_memberships_category_idx").on(table.categoryId),
]);

export const insertProfileAvatarCategorySchema = createInsertSchema(profileAvatarCategoriesTable).omit({ id: true });
export const insertProfileAvatarMembershipSchema = createInsertSchema(profileAvatarMembershipsTable);
export type ProfileAvatarCategory = typeof profileAvatarCategoriesTable.$inferSelect;
export type ProfileAvatarMembership = typeof profileAvatarMembershipsTable.$inferSelect;
