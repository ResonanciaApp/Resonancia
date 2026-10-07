import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const reflectionStoriesTable = pgTable(
  "reflection_stories",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    message: text("message").notNull(),
    category: text("category").notNull(),
    backgroundPresetKey: text("background_preset_key").notNull(),
    backgroundScale: real("background_scale").notNull(),
    backgroundX: real("background_x").notNull(),
    backgroundY: real("background_y").notNull(),
    textX: real("text_x").notNull(),
    textY: real("text_y").notNull(),
    avatarImagePath: text("avatar_image_path"),
    avatarX: real("avatar_x"),
    avatarY: real("avatar_y"),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("reflection_stories_user_idempotency_idx").on(table.userId, table.idempotencyKey),
    index("reflection_stories_user_created_id_idx").on(table.userId, table.createdAt, table.id),
    check("reflection_stories_message_check", sql`length(btrim(${table.message})) >= 1`),
    check("reflection_stories_scale_check", sql`${table.backgroundScale} between 1 and 3`),
    check("reflection_stories_background_x_check", sql`${table.backgroundX} between -((${table.backgroundScale} - 1) / 2) and ((${table.backgroundScale} - 1) / 2)`),
    check("reflection_stories_background_y_check", sql`${table.backgroundY} between -((${table.backgroundScale} - 1) / 2) and ((${table.backgroundScale} - 1) / 2)`),
    check("reflection_stories_text_x_check", sql`${table.textX} between -0.0925925926 and 0.0925925926`),
    check("reflection_stories_text_y_check", sql`${table.textY} between -0.2604166667 and 0.2604166667`),
  ],
);

export const insertReflectionStorySchema = createInsertSchema(reflectionStoriesTable)
  .omit({ id: true, createdAt: true });
export type ReflectionStory = typeof reflectionStoriesTable.$inferSelect;
export type InsertReflectionStory = z.infer<typeof insertReflectionStorySchema>;
