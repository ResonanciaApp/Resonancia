import { sql } from "drizzle-orm";
import { check, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const EMOTIONAL_PHRASE_MOOD_IDS = [
  "estresado",
  "ansioso",
  "cansado",
  "inepto",
  "triste",
  "solo",
  "deprimido",
  "desmotivado",
  "enojado",
  "adolorido",
  "agradecido",
  "emocionado",
  "lleno-de-amor",
  "feliz",
  "en-paz",
  "esperanzado",
  "contento",
  "presente",
] as const;

export type EmotionalPhraseMoodId = (typeof EMOTIONAL_PHRASE_MOOD_IDS)[number];

export const emotionalPhraseSetsTable = pgTable(
  "emotional_phrase_sets",
  {
    moodId: text("mood_id").primaryKey(),
    revision: integer("revision").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("emotional_phrase_sets_revision_check", sql`${table.revision} >= 0`),
    check(
      "emotional_phrase_sets_mood_id_check",
      sql`${table.moodId} in (
        'estresado', 'ansioso', 'cansado', 'inepto', 'triste', 'solo',
        'deprimido', 'desmotivado', 'enojado', 'adolorido', 'agradecido',
        'emocionado', 'lleno-de-amor', 'feliz', 'en-paz', 'esperanzado',
        'contento', 'presente'
      )`,
    ),
  ],
);

export const emotionalPhrasesTable = pgTable(
  "emotional_phrases",
  {
    moodId: text("mood_id")
      .notNull()
      .references(() => emotionalPhraseSetsTable.moodId, { onDelete: "cascade" }),
    slot: integer("slot").notNull(),
    text: text("text").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.moodId, table.slot] }),
    check("emotional_phrases_slot_check", sql`${table.slot} between 1 and 7`),
    check(
      "emotional_phrases_text_check",
      sql`length(btrim(${table.text})) between 1 and 500`,
    ),
  ],
);

export const insertEmotionalPhraseSetSchema = createInsertSchema(
  emotionalPhraseSetsTable,
).omit({ updatedAt: true });

export const insertEmotionalPhraseSchema = createInsertSchema(
  emotionalPhrasesTable,
);

export type EmotionalPhraseSet = typeof emotionalPhraseSetsTable.$inferSelect;
export type InsertEmotionalPhraseSet = z.infer<typeof insertEmotionalPhraseSetSchema>;
export type EmotionalPhrase = typeof emotionalPhrasesTable.$inferSelect;
export type InsertEmotionalPhrase = z.infer<typeof insertEmotionalPhraseSchema>;