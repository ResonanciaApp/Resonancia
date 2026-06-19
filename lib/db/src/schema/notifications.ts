import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const NOTIFICATION_TYPES = [
  "friend_request",
  "friend_accepted",
  "new_follower",
  "dm",
  "group_message",
  "mix_like",
  "mix_comment",
  "content_approved",
  "content_rejected",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationsTable = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    actorUserId: integer("actor_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").$type<NotificationType>().notNull(),
    // ID de la entidad relacionada (p. ej. la mezcla en mix_like/mix_comment),
    // para poder enlazar el tap de la notificación a la pantalla correcta.
    entityId: integer("entity_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId, table.createdAt),
    unreadDmUnique: uniqueIndex("notifications_unread_dm_unique")
      .on(table.userId, table.actorUserId, table.type)
      .where(sql`${table.readAt} IS NULL AND ${table.type} = 'dm'`),
    // Colapsa likes/comentarios no leídos del mismo actor sobre la misma mezcla
    // en una sola notificación (evita spam si dan like/comentan repetidamente).
    unreadMixUnique: uniqueIndex("notifications_unread_mix_unique")
      .on(table.userId, table.actorUserId, table.entityId, table.type)
      .where(
        sql`${table.readAt} IS NULL AND ${table.type} IN ('mix_like', 'mix_comment')`,
      ),
  }),
);

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
