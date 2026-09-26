import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export type InspirationContent = {
  quote: string;
  author: string | null;
  reflection: string;
  imagePath: string | null;
  imagePositionX: number;
  imagePositionY: number;
  overlayOpacity: number;
  sessionId: string | null;
  quoteBoldRanges?: Array<{ start: number; end: number }>;
};
export type InspirationLabels = {
  sectionTitle: string;
  readMoreLabel: string;
  discoverMoreLabel: string;
  notesLabel: string;
};

export const inspirationsTable = pgTable("inspirations", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull().unique(),
  revision: integer("revision").notNull().default(1),
  draft: jsonb("draft").$type<InspirationContent>().notNull(),
  published: jsonb("published").$type<InspirationContent>(),
  publishedRevision: integer("published_revision"),
  deleted: boolean("deleted").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("inspirations_revision_check", sql`${t.revision} > 0`),
  check("inspirations_snapshot_check", sql`(${t.published} IS NULL) = (${t.publishedRevision} IS NULL)`),
  check("inspirations_deleted_check", sql`NOT ${t.deleted} OR ${t.published} IS NULL`),
]);
export const inspirationSettingsTable = pgTable("inspiration_settings", {
  id: integer("id").primaryKey(),
  revision: integer("revision").notNull(),
  labels: jsonb("labels").$type<InspirationLabels>().notNull(),
}, (t) => [
  check("inspiration_settings_id_check", sql`${t.id} = 1`),
  check("inspiration_settings_revision_check", sql`${t.revision} > 0`),
]);
// Dedicated editorial assets are never granted generic storage/ACL access.
// Ownership is editorial (not private user data); account deletion cannot delete
// another editor's published/shared image. No uploader personal data is stored.
export const inspirationAssetsTable = pgTable("inspiration_assets", {
  objectPath: text("object_path").primaryKey(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  generation: text("generation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("inspiration_assets_content_type_check", sql`${t.contentType} IN ('image/jpeg', 'image/png', 'image/webp')`),
  check("inspiration_assets_size_bytes_check", sql`${t.sizeBytes} BETWEEN 1 AND 15728640`),
]);
export type HeroOverrideMedia = {
  type: "image" | "video";
  objectPath: string;
  contentType: string;
  sizeBytes: number;
  generation: string | null;
  posterObjectPath?: string | null;
};
export type HeroOverrideContent = {
  media: HeroOverrideMedia;
  title?: string | null;
};
/** Date-keyed editorial hero overrides. Deliberately independent of inspirations. */
export const heroOverridesTable = pgTable("hero_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull().unique(),
  revision: integer("revision").notNull().default(1),
  draft: jsonb("draft").$type<HeroOverrideContent>().notNull(),
  published: jsonb("published").$type<HeroOverrideContent>(),
  publishedRevision: integer("published_revision"),
  deleted: boolean("deleted").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("hero_overrides_revision_check", sql`${t.revision} > 0`),
  check("hero_overrides_snapshot_check", sql`(${t.published} IS NULL) = (${t.publishedRevision} IS NULL)`),
  check("hero_overrides_deleted_check", sql`NOT ${t.deleted} OR ${t.published} IS NULL`),
]);
export const heroOverrideAssetsTable = pgTable("hero_override_assets", {
  objectPath: text("object_path").primaryKey(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  generation: text("generation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("hero_override_assets_content_type_check", sql`${t.contentType} IN ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm')`),
  check("hero_override_assets_size_bytes_check", sql`${t.sizeBytes} BETWEEN 1 AND 104857600`),
]);
export const inspirationFavoritesTable = pgTable("inspiration_favorites", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  inspirationId: uuid("inspiration_id").notNull(),
  revision: integer("revision").notNull(),
  deleted: boolean("deleted").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.inspirationId] }),
  check("inspiration_favorites_revision_check", sql`${t.revision} > 0`),
]);
export const inspirationNotesTable = pgTable("inspiration_notes", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  id: uuid("id").notNull(),
  inspirationId: uuid("inspiration_id").notNull(),
  text: text("text").notNull(),
  revision: integer("revision").notNull(),
  deleted: boolean("deleted").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.id] }),
  index("inspiration_notes_owner_inspiration_idx").on(t.userId, t.inspirationId),
  check("inspiration_notes_text_check", sql`length(${t.text}) <= 20000`),
  check("inspiration_notes_revision_check", sql`${t.revision} > 0`),
  check("inspiration_notes_deleted_check", sql`NOT ${t.deleted} OR ${t.text} = ''`),
]);