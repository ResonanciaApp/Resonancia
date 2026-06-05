import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const SHARED_MIX_CATEGORIES = ["dormir", "trabajar", "motivarme", "concentracion"] as const;
export type SharedMixCategory = (typeof SHARED_MIX_CATEGORIES)[number];

export type SharedMixSound = { id: string; volume: number };

export const sharedMixesTable = pgTable("shared_mixes", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  category: text("category").$type<SharedMixCategory>().notNull(),
  sounds: jsonb("sounds").$type<SharedMixSound[]>().notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSharedMixSchema = createInsertSchema(sharedMixesTable)
  .omit({ id: true, authorId: true, likes: true, createdAt: true })
  .extend({
    name: z.string().min(1).max(40),
    description: z.string().max(120).optional(),
    image: z.string().max(60).optional(),
    category: z.enum(SHARED_MIX_CATEGORIES),
    sounds: z
      .array(z.object({ id: z.string().min(1).max(40), volume: z.number().min(0).max(1) }))
      .min(1)
      .max(10),
  });

export type InsertSharedMix = z.infer<typeof insertSharedMixSchema>;
export type SharedMix = typeof sharedMixesTable.$inferSelect;
