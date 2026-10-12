import assert from "node:assert/strict";
import test from "node:test";
import { toJourneyPayload, validateJourneyInfo, sameJourneyDraft } from "../src/lib/journey-info-form.ts";

test("payload trims but preserves paragraphs", () => {
  const p = toJourneyPayload({ title: "  ¿Qué es? ", description: "\n Uno.\n\nDos. \n" }, 3);
  assert.deepEqual(p, { revision: 3, content: { title: "¿Qué es?", description: "Uno.\n\nDos." } });
});

test("validation: required and max lengths", () => {
  assert.ok(validateJourneyInfo({ title: "  ", description: "x" }).title);
  assert.ok(validateJourneyInfo({ title: "a", description: "\n" }).description);
  assert.ok(validateJourneyInfo({ title: "a".repeat(101), description: "x" }).title);
  assert.ok(validateJourneyInfo({ title: "a", description: "a".repeat(5001) }).description);
  assert.deepEqual(validateJourneyInfo({ title: " a".repeat(50) + "  ", description: "a".repeat(5000) }), {});
});

test("sameJourneyDraft", () => {
  assert.equal(sameJourneyDraft({ title: "a", description: "b" }, { title: "a", description: "b" }), true);
  assert.equal(sameJourneyDraft({ title: "a", description: "b" }, { title: "a", description: "c" }), false);
});
