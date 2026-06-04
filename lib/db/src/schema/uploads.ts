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

export const uploadsTable = pgTable(
  "uploads",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    objectPath: text("object_path").notNull(),
    name: text("name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index("uploads_user_created_at_idx").on(table.userId, table.createdAt),
  }),
);

export const insertUploadSchema = createInsertSchema(uploadsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Upload = typeof uploadsTable.$inferSelect;
