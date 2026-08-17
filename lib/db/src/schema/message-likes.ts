import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { messagesTable } from "./messages";

/**
 * Un like por (usuario, mensaje). Igual que shared_mix_likes: el contador
 * denormalizado `messages.likes` se recalcula desde estas filas en una
 * transacción para que no se pueda inflar con llamadas repetidas.
 */
export const messageLikesTable = pgTable(
  "message_likes",
  {
    id: serial("id").primaryKey(),
    messageId: integer("message_id")
      .notNull()
      .references(() => messagesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex("message_likes_pair_idx").on(table.messageId, table.userId),
  }),
);

export type MessageLike = typeof messageLikesTable.$inferSelect;
