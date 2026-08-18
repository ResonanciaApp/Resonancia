import { index, integer, pgTable, serial, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { sharedGlyphsTable } from "./shared-glyphs";

export const sharedGlyphLikesTable = pgTable(
  "shared_glyph_likes",
  {
    id: serial("id").primaryKey(),
    glyphId: integer("glyph_id")
      .notNull()
      .references(() => sharedGlyphsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("shared_glyph_likes_glyph_user_idx").on(t.glyphId, t.userId),
    // "Glyphs que le gustan al usuario" (glyphId cubierto por el unique compuesto)
    index("shared_glyph_likes_user_idx").on(t.userId),
  ],
);

export type SharedGlyphLike = typeof sharedGlyphLikesTable.$inferSelect;
