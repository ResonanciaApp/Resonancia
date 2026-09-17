import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceMoodQuoteSlot,
  getNextMoodQuoteSlot,
  getPrimaryMoodId,
  normalizeRotationState,
  reconcileRotationFromHistory,
  validateMoodQuoteSlots,
} from "../data/mood-quote-rotation.ts";

test("rotates every mood through slots 1 to 7 and back to 1", () => {
  let state = {};
  const slots: number[] = [];
  for (let index = 0; index < 8; index += 1) {
    slots.push(getNextMoodQuoteSlot(state, "feliz") + 1);
    state = advanceMoodQuoteSlot(state, "feliz");
  }
  assert.deepEqual(slots, [1, 2, 3, 4, 5, 6, 7, 1]);
});

test("keeps rotation counters independent by mood", () => {
  let state = advanceMoodQuoteSlot({}, "feliz");
  state = advanceMoodQuoteSlot(state, "feliz");
  assert.equal(getNextMoodQuoteSlot(state, "feliz"), 2);
  assert.equal(getNextMoodQuoteSlot(state, "ansioso"), 0);
});

test("normalizes corrupt counters without throwing", () => {
  assert.deepEqual(
    normalizeRotationState({
      feliz: 8,
      ansioso: -1,
      desconocido: 4,
      triste: "2",
      presente: null,
    }),
    { feliz: 1, ansioso: 6 },
  );
});

test("recovers the next slot from the latest durable history record", () => {
  assert.deepEqual(
    reconcileRotationFromHistory(
      { feliz: 1, ansioso: 4 },
      [
        { quoteRotation: { moodId: "feliz", slot: 5 } },
        { quoteRotation: { moodId: "feliz", slot: 2 } },
        { quoteRotation: { moodId: "presente", slot: 6 } },
      ],
    ),
    { feliz: 6, ansioso: 4, presente: 0 },
  );
});

test("uses only the first selected mood as primary", () => {
  assert.equal(getPrimaryMoodId(["ansioso", "feliz"]), "ansioso");
  assert.equal(getPrimaryMoodId([]), undefined);
});

test("accepts only complete, unique, non-empty seven-slot sets", () => {
  const valid = {
    moods: [{
      moodId: "feliz",
      phrases: Array.from({ length: 7 }, (_, index) => ({
        slot: index + 1,
        text: `  Frase ${index + 1}  `,
      })),
    }],
  };
  const invalid = {
    moods: [{
      moodId: "ansioso",
      phrases: [
        { slot: 1, text: "Una frase" },
        { slot: 1, text: "Duplicada" },
        { slot: 3, text: "Falta la dos" },
        { slot: 4, text: "Cuatro" },
        { slot: 5, text: "Cinco" },
        { slot: 6, text: "Seis" },
        { slot: 7, text: "Siete" },
      ],
    }],
  };
  assert.deepEqual(validateMoodQuoteSlots(valid), {
    feliz: [
      "Frase 1",
      "Frase 2",
      "Frase 3",
      "Frase 4",
      "Frase 5",
      "Frase 6",
      "Frase 7",
    ],
  });
  assert.deepEqual(validateMoodQuoteSlots(invalid), {});
});