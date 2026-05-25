import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const directMessagesTable = pgTable(
  "direct_messages",
  {
    id: serial("id").primaryKey(),
    senderId: integer("sender_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    recipientId: integer("recipient_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    body: text("body"),
    sessionId: integer("session_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pairIdx: index("direct_messages_pair_idx").on(
      table.senderId,
      table.recipientId,
      table.createdAt,
    ),
    recipientIdx: index("direct_messages_recipient_idx").on(
      table.recipientId,
      table.readAt,
    ),
  }),
);

export const insertDirectMessageSchema = createInsertSchema(directMessagesTable).omit({
  id: true,
  createdAt: true,
  readAt: true,
});
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessagesTable.$inferSelect;
