import { Router, type IRouter } from "express";
import { asc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  emotionalPhraseSetsTable,
  emotionalPhrasesTable,
  EMOTIONAL_PHRASE_MOOD_IDS,
  type EmotionalPhraseMoodId,
} from "@workspace/db";
import {
  GetAdminEmotionalPhrasesResponse,
  GetPublicEmotionalPhrasesResponse,
  UpdateAdminEmotionalPhrasesBody,
  UpdateAdminEmotionalPhrasesParams,
  UpdateAdminEmotionalPhrasesResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();
const slots = [1, 2, 3, 4, 5, 6, 7] as const;

type PhraseRow = typeof emotionalPhrasesTable.$inferSelect;

export function emptyPhraseSet(moodId: EmotionalPhraseMoodId) {
  return {
    moodId,
    revision: 0,
    updatedAt: null,
    phrases: slots.map((slot) => ({ slot, text: "" })),
  };
}

export function validatePhraseSlots(
  phrases: Array<{ slot: number; text: string }>,
): string | null {
  if (phrases.length !== 7) return "Se requieren exactamente 7 frases";
  const seen = new Set<number>();
  for (const phrase of phrases) {
    if (seen.has(phrase.slot) || !slots.includes(phrase.slot as (typeof slots)[number])) {
      return "Los slots deben ser únicos y corresponder del 1 al 7";
    }
    if (!phrase.text.trim() || phrase.text.trim().length > 500) {
      return "Cada frase debe tener entre 1 y 500 caracteres";
    }
    seen.add(phrase.slot);
  }
  if (seen.size !== 7) return "Los slots deben corresponder del 1 al 7";
  return null;
}

export function serializePhraseRows(rows: PhraseRow[]) {
  const bySlot = new Map(rows.map((row) => [row.slot, row]));
  return slots.map((slot) => ({
    slot,
    text: bySlot.get(slot)?.text ?? "",
  }));
}

router.get(
  "/admin/emotional-phrases",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    try {
      const [sets, phrases] = await Promise.all([
        db
          .select()
          .from(emotionalPhraseSetsTable)
          .where(inArray(emotionalPhraseSetsTable.moodId, [...EMOTIONAL_PHRASE_MOOD_IDS])),
        db
          .select()
          .from(emotionalPhrasesTable)
          .where(inArray(emotionalPhrasesTable.moodId, [...EMOTIONAL_PHRASE_MOOD_IDS]))
          .orderBy(asc(emotionalPhrasesTable.moodId), asc(emotionalPhrasesTable.slot)),
      ]);
      const phrasesByMood = new Map<string, PhraseRow[]>();
      for (const phrase of phrases) {
        const list = phrasesByMood.get(phrase.moodId) ?? [];
        list.push(phrase);
        phrasesByMood.set(phrase.moodId, list);
      }
      const setByMood = new Map(sets.map((set) => [set.moodId, set]));
      const moods = EMOTIONAL_PHRASE_MOOD_IDS.map((moodId) => {
        const set = setByMood.get(moodId);
        if (!set) return emptyPhraseSet(moodId);
        return {
          moodId,
          revision: set.revision,
          updatedAt: set.updatedAt,
          phrases: serializePhraseRows(phrasesByMood.get(moodId) ?? []),
        };
      });
      res.json(GetAdminEmotionalPhrasesResponse.parse({ moods }));
    } catch (err) {
      req.log.error({ err }, "error listing emotional phrases");
      res.status(500).json({ error: "Error al obtener las frases emocionales" });
    }
  },
);

router.put(
  "/admin/emotional-phrases/:moodId",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const params = UpdateAdminEmotionalPhrasesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Emoción inválida" });
      return;
    }
    const parsed = UpdateAdminEmotionalPhrasesBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
      return;
    }
    const slotError = validatePhraseSlots(parsed.data.phrases);
    if (slotError) {
      res.status(400).json({ error: slotError });
      return;
    }

    const moodId = params.data.moodId as EmotionalPhraseMoodId;
    try {
      const result = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${moodId}, 0))`,
        );
        const [existing] = await tx
          .select()
          .from(emotionalPhraseSetsTable)
          .where(eq(emotionalPhraseSetsTable.moodId, moodId))
          .limit(1);
        const currentRevision = existing?.revision ?? 0;
        if (currentRevision !== parsed.data.revision) {
          return { kind: "stale" as const, revision: currentRevision };
        }

        const now = new Date();
        const nextRevision = currentRevision + 1;
        if (existing) {
          await tx
            .update(emotionalPhraseSetsTable)
            .set({ revision: nextRevision, updatedAt: now })
            .where(eq(emotionalPhraseSetsTable.moodId, moodId));
        } else {
          await tx.insert(emotionalPhraseSetsTable).values({
            moodId,
            revision: nextRevision,
            updatedAt: now,
          });
        }
        await tx
          .delete(emotionalPhrasesTable)
          .where(eq(emotionalPhrasesTable.moodId, moodId));
        await tx.insert(emotionalPhrasesTable).values(
          parsed.data.phrases.map((phrase) => ({
            moodId,
            slot: phrase.slot,
            text: phrase.text.trim(),
          })),
        );
        return {
          kind: "updated" as const,
          moodId,
          revision: nextRevision,
          updatedAt: now,
          phrases: parsed.data.phrases
            .map((phrase) => ({ slot: phrase.slot, text: phrase.text.trim() }))
            .sort((a, b) => a.slot - b.slot),
        };
      });

      if (result.kind === "stale") {
        res.status(409).json({ error: `La revisión actual es ${result.revision}; vuelve a cargar` });
        return;
      }
      res.json(UpdateAdminEmotionalPhrasesResponse.parse(result));
    } catch (err) {
      req.log.error({ err, moodId }, "error updating emotional phrases");
      res.status(500).json({ error: "Error al guardar las frases emocionales" });
    }
  },
);

router.get(
  "/catalog/emotional-phrases",
  async (req, res): Promise<void> => {
    try {
      const rows = await db
        .select()
        .from(emotionalPhrasesTable)
        .where(inArray(emotionalPhrasesTable.moodId, [...EMOTIONAL_PHRASE_MOOD_IDS]))
        .orderBy(asc(emotionalPhrasesTable.moodId), asc(emotionalPhrasesTable.slot));
      const byMood = new Map<string, PhraseRow[]>();
      for (const row of rows) {
        const list = byMood.get(row.moodId) ?? [];
        list.push(row);
        byMood.set(row.moodId, list);
      }
      const moods = EMOTIONAL_PHRASE_MOOD_IDS
        .map((moodId) => {
          const phrases = byMood.get(moodId) ?? [];
          if (
            phrases.length !== 7 ||
            new Set(phrases.map((phrase) => phrase.slot)).size !== 7 ||
            phrases.some((phrase) => !phrase.text.trim())
          ) {
            return null;
          }
          return {
            moodId,
            phrases: serializePhraseRows(phrases),
          };
        })
        .filter((mood): mood is NonNullable<typeof mood> => mood !== null);
      res.json(GetPublicEmotionalPhrasesResponse.parse({ moods }));
    } catch (err) {
      req.log.error({ err }, "error listing public emotional phrases");
      res.status(500).json({ error: "Error al obtener las frases emocionales" });
    }
  },
);

export default router;