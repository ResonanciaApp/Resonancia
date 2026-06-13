import { pgTable, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const geometrixSettingsTable = pgTable("geometrix_settings", {
  id: text("id").primaryKey(),
  name: text("name"),
  sortOrder: integer("sort_order").notNull().default(0),
  geometryType: text("geometry_type").notNull().default("wireframe"),
  strokeMode: text("stroke_mode").notNull().default("natural"),
  outlineWidth: real("outline_width").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  description: text("description"),
  color: text("color"),
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
    outlineWidth: z.number().min(0).max(1.5).optional(),
    visible: z.boolean(),
    description: z.string().max(1000).nullable().optional(),
    color: z.string().max(20).nullable().optional(),
  }),
);
export type BulkUpdateGeometrix = z.infer<typeof BulkUpdateGeometrixSchema>;
