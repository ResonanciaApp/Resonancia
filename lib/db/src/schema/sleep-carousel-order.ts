import { boolean, integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sleepCarouselOrderTable = pgTable(
  "sleep_carousel_order",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    type: text("type", { enum: ["session", "playlist"] }).notNull(),
    label: text("label").notNull(),
    visible: boolean("visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [unique("sleep_carousel_order_key_unique").on(table.key)],
);

export const insertSleepCarouselOrderSchema = createInsertSchema(sleepCarouselOrderTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSleepCarouselOrder = z.infer<typeof insertSleepCarouselOrderSchema>;
export type SleepCarouselOrder = typeof sleepCarouselOrderTable.$inferSelect;