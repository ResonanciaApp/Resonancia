import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, integer, timestamp, uniqueIndex, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const COVER_PRESET_SCOPES = ["mix", "playlist", "profile", "reflection-story"] as const;
export type CoverPresetScope = (typeof COVER_PRESET_SCOPES)[number];

export const REFLECTION_STORY_BUILTIN_KEYS = [
  "cosmic-nebula", "moon-valley", "earth-orbit", "galaxy-lake", "desert-stars",
  "mist-forest", "redwood-light", "autumn-river", "moss-waterfall", "snow-pines",
  "quiet-ocean", "coastal-cliffs", "river-canyon", "rain-lagoon", "ice-lagoon",
  "birds-dawn", "crane-marsh", "elephant-savanna", "deer-meadow", "whale-depths",
  "wild-horses", "mountain-clouds", "volcanic-island", "lavender-hills", "northern-lights",
  "cosmic-nebula", "moon-valley", "earth-orbit", "galaxy-lake", "desert-stars",
  "mist-forest", "redwood-light", "autumn-river", "moss-waterfall", "snow-pines",
  "quiet-ocean", "coastal-cliffs", "river-canyon", "rain-lagoon", "ice-lagoon",
] as const;

export const coverPresetScopeEnum = pgEnum("cover_preset_scope", COVER_PRESET_SCOPES);

export const coverPresetsTable = pgTable(
  "cover_presets",
  {
    id: text("id").primaryKey(),
    scope: coverPresetScopeEnum("scope").notNull(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    objectPath: text("object_path"),
    builtinKey: text("builtin_key"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("cover_presets_scope_key_idx").on(table.scope, table.key),
    uniqueIndex("cover_presets_scope_sort_idx").on(table.scope, table.sortOrder),
    check(
      "cover_presets_source_check",
      sql`((${table.objectPath} IS NULL) <> (${table.builtinKey} IS NULL))`,
    ),
    check("cover_presets_sort_order_check", sql`${table.sortOrder} >= 0`),
  ],
);

export const insertCoverPresetSchema = createInsertSchema(coverPresetsTable, {
  id: z.string().min(1).max(160),
  scope: z.enum(COVER_PRESET_SCOPES),
  key: z.string().min(1).max(120),
  label: z.string().trim().min(1).max(120),
  objectPath: z.string().regex(/^\/objects\/.+/).optional().nullable(),
  builtinKey: z.string().min(1).max(120).optional().nullable(),
  sortOrder: z.number().int().min(0),
}).superRefine((value, ctx) => {
  if ((value.objectPath == null) === (value.builtinKey == null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["objectPath"], message: "Exactly one image source is required" });
  }
});

export type InsertCoverPreset = z.infer<typeof insertCoverPresetSchema>;
export type CoverPreset = typeof coverPresetsTable.$inferSelect;