import {
  pgTable,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Catálogo de resonadores (facilitadores de sonido, guías y músicos).
 * La PK es un slug legible (ej. "luna-cosmica").
 * photoUrl / coverPhotoUrl: URL absoluta o objectPath de Object Storage.
 * Cuando son null la app usa la foto bundleada del asset local (fallback).
 * projects / formacion se almacenan como jsonb (arrays de objetos).
 */
export const resonadoresTable = pgTable("resonadores", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id"),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  coverPhotoUrl: text("cover_photo_url"),
  subtipo: text("subtipo").notNull(),
  bio: text("bio").notNull().default(""),
  city: text("city").notNull().default(""),
  country: text("country").notNull().default(""),
  specialty: text("specialty").array().notNull().default([]),
  genres: text("genres").array().notNull().default([]),
  memberSince: text("member_since"),
  followersCount: integer("followers_count"),
  followingCount: integer("following_count"),
  certified: boolean("certified").notNull().default(false),
  servicesDescription: text("services_description"),
  bookingUrl: text("booking_url"),
  bookingTagline: text("booking_tagline"),
  bookingPrice: text("booking_price"),
  bookingModality: text("booking_modality"),
  phone: text("phone"),
  email: text("email"),
  instagram: text("instagram"),
  linktree: text("linktree"),
  donationUrl: text("donation_url"),
  sessionIds: text("session_ids").array().notNull().default([]),
  projects: jsonb("projects").notNull().default([]),
  formacion: jsonb("formacion").notNull().default([]),
  quote: text("quote"),
  photos: text("photos").array().notNull().default([]),
  status: text("status").notNull().default("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertResonadorSchema = createInsertSchema(resonadoresTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateResonadorSchema = insertResonadorSchema.partial().omit({
  id: true,
});

export type InsertResonador = z.infer<typeof insertResonadorSchema>;
export type UpdateResonador = z.infer<typeof updateResonadorSchema>;
export type ResonadorRow = typeof resonadoresTable.$inferSelect;
