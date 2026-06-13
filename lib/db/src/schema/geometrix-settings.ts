import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const geometrixSettingsTable = pgTable("geometrix_settings", {
  id: text("id").primaryKey(),
  name: text("name"),
  sortOrder: integer("sort_order").notNull().default(0),
  geometryType: text("geometry_type").notNull().default("wireframe"),
  strokeMode: text("stroke_mode").notNull().default("natural"),
  visible: boolean("visible").notNull().default(true),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGeometrixSettingSchema = createInsertSchema(geometrixSettingsTable);
export const updateGeometrixSettingSchema = createUpdateSchema(geometrixSettingsTable);

export type GeometrixSetting = typeof geometrixSettingsTable.$inferSelect;
export type InsertGeometrixSetting = typeof geometrixSettingsTable.$inferInsert;

export const BulkUpdateGeometrixSchema = z.array(
  z.object({
    id: z.string().min(1).max(100),
    name: z.string().max(200).nullable().optional(),
    sortOrder: z.int().min(0),
    geometryType: z.enum(["wireframe", "mosaic"]),
    strokeMode: z.enum(["thin", "natural"]),
    visible: z.boolean(),
    description: z.string().max(1000).nullable().optional(),
  }),
);
export type BulkUpdateGeometrix = z.infer<typeof BulkUpdateGeometrixSchema>;
