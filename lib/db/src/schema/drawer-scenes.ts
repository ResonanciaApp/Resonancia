import { integer, jsonb, pgTable } from "drizzle-orm/pg-core";

export const drawerScenesTable = pgTable("drawer_scenes_settings", {
  id: integer("id").primaryKey(),
  content: jsonb("content").$type<Array<{ id: string; title: string; iconPath: string | null }>>().notNull(),
});
