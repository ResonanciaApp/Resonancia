import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const expansorProfilesTable = pgTable("expansor_profiles", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  specialties: text("specialties").array().notNull().default([]),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  instagram: text("instagram"),
  photos: text("photos").array().notNull().default([]),
  quote: text("quote"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertExpansorProfileSchema = createInsertSchema(expansorProfilesTable).omit({
  updatedAt: true,
});
export type InsertExpansorProfile = z.infer<typeof insertExpansorProfileSchema>;
export type ExpansorProfile = typeof expansorProfilesTable.$inferSelect;
