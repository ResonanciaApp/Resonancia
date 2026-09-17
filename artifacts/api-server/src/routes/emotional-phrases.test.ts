import { describe, expect, it } from "vitest";
import {
  EMOTIONAL_PHRASE_MOOD_IDS,
  type EmotionalPhraseMoodId,
} from "@workspace/db";
import {
  emptyPhraseSet,
  serializePhraseRows,
  validatePhraseSlots,
} from "./emotional-phrases";

const validPhrases = Array.from({ length: 7 }, (_, index) => ({
  slot: index + 1,
  text: `Frase ${index + 1}`,
}));

describe("emotional phrase validation and serialization", () => {
  it("accepts exactly the seven unique slots and rejects invalid revisions' payload shape", () => {
    expect(validatePhraseSlots(validPhrases)).toBeNull();
    expect(validatePhraseSlots(validPhrases.slice(0, 6))).toContain("exactamente 7");
    expect(
      validatePhraseSlots([
        ...validPhrases.slice(0, 6),
        { slot: 6, text: "Duplicada" },
      ]),
    ).toContain("únicos");
    expect(
      validatePhraseSlots([
        ...validPhrases.slice(0, 6),
        { slot: 8, text: "Fuera de rango" },
      ]),
    ).toContain("1 al 7");
    expect(validatePhraseSlots(validPhrases.map((phrase) => ({ ...phrase, text: "  " })))).toContain(
      "entre 1 y 500",
    );
    expect(
      validatePhraseSlots([
        ...validPhrases.slice(0, 6),
        { slot: 7, text: "x".repeat(501) },
      ]),
    ).toContain("entre 1 y 500");
  });

  it("serializes slots in canonical order and fills incomplete admin sets", () => {
    const serialized = serializePhraseRows([
      { moodId: "feliz", slot: 7, text: "Siete" },
      { moodId: "feliz", slot: 2, text: "Dos" },
    ] as never);
    expect(serialized).toEqual([
      { slot: 1, text: "" },
      { slot: 2, text: "Dos" },
      { slot: 3, text: "" },
      { slot: 4, text: "" },
      { slot: 5, text: "" },
      { slot: 6, text: "" },
      { slot: 7, text: "Siete" },
    ]);
    expect(emptyPhraseSet("estresado")).toEqual({
      moodId: "estresado",
      revision: 0,
      updatedAt: null,
      phrases: Array.from({ length: 7 }, (_, index) => ({ slot: index + 1, text: "" })),
    });
  });

  it("keeps the canonical mood IDs in the exact public/admin order", () => {
    expect(EMOTIONAL_PHRASE_MOOD_IDS).toEqual([
      "estresado", "ansioso", "cansado", "inepto", "triste", "solo",
      "deprimido", "desmotivado", "enojado", "adolorido", "agradecido",
      "emocionado", "lleno-de-amor", "feliz", "en-paz", "esperanzado",
      "contento", "presente",
    ] satisfies EmotionalPhraseMoodId[]);
    expect(emptyPhraseSet("presente").phrases.map((phrase) => phrase.slot)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });
});