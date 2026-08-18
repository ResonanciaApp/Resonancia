import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messagesTable = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    likes: integer("likes").default(0).notNull(),
    authorClerkId: text("author_clerk_id"),
    authorName: text("author_name"),
    authorAvatarUrl: text("author_avatar_url"),
  },
  (t) => [
    // Feed de muro: ORDER BY created_at DESC
    index("messages_created_at_idx").on(t.createdAt),
  ],
);

export const insertMessageSchema = createInsertSchema(messagesTable)
  .omit({ id: true, createdAt: true, likes: true })
  .extend({
    content: z.string().min(1).max(300),
  });

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
