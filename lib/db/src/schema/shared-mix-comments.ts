import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { sharedMixesTable } from "./shared-mixes";

export const sharedMixCommentsTable = pgTable(
  "shared_mix_comments",
  {
    id: serial("id").primaryKey(),
    mixId: integer("mix_id")
      .notNull()
      .references(() => sharedMixesTable.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Listar comentarios de una mezcla ordenados por fecha
    index("shared_mix_comments_mix_idx").on(t.mixId, t.createdAt),
    // "Mis comentarios" por autor
    index("shared_mix_comments_author_idx").on(t.authorId),
  ],
);

export const insertSharedMixCommentSchema = createInsertSchema(sharedMixCommentsTable)
  .omit({ id: true, mixId: true, authorId: true, createdAt: true })
  .extend({
    body: z.string().min(1).max(500),
  });

export type InsertSharedMixComment = z.infer<typeof insertSharedMixCommentSchema>;
export type SharedMixComment = typeof sharedMixCommentsTable.$inferSelect;
