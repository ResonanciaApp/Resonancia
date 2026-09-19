import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";

export type HeroSessionSlide = {
  position: 2 | 3 | 4;
  enabled: boolean;
  sessionId: string;
  title: string;
  description?: string;
  pillLabel?: string;
  actionLabel: string;
};

export type HeroSessionSlidesContent = {
  slides: [HeroSessionSlide | null, HeroSessionSlide | null, HeroSessionSlide | null];
};

/** Global configuration for the session-backed Home hero slides. */
export const heroSessionSlidesTable = pgTable("hero_session_slides", {
  id: integer("id").primaryKey(),
  revision: integer("revision").notNull().default(1),
  draft: jsonb("draft").$type<HeroSessionSlidesContent>().notNull(),
  published: jsonb("published").$type<HeroSessionSlidesContent>(),
  publishedRevision: integer("published_revision"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("hero_session_slides_id_check", sql`${t.id} = 1`),
  check("hero_session_slides_revision_check", sql`${t.revision} > 0`),
  check("hero_session_slides_snapshot_check", sql`(${t.published} IS NULL) = (${t.publishedRevision} IS NULL)`),
]);

export type HeroSessionSlides = typeof heroSessionSlidesTable.$inferSelect;