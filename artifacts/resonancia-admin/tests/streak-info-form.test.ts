import assert from "node:assert/strict";
import test from "node:test";
import { toDraft, toPayload, validateStreakInfo, sameDraft, errorStatus } from "../src/lib/streak-info-form.ts";

const content = {
  title: "Tu racha",
  description: "Desc",
  cards: [
    { id: "longest", title: "L", description: "dl" },
    { id: "current", title: "C", description: "dc" },
    { id: "completed", title: "W", description: "dw" },
    { id: "accumulated", title: "A", description: "da" },
  ],
};

test("toDraft orders cards canonically", () => {
  assert.deepEqual(toDraft(content).cards.map((c) => c.id), ["current", "accumulated", "longest", "completed"]);
});

test("valid draft has no errors and payload trims", () => {
  const d = toDraft(content);
  assert.deepEqual(validateStreakInfo(d), {});
  d.title = "  X  ";
  assert.equal(toPayload(d, 3).content.title, "X");
  assert.equal(toPayload(d, 3).revision, 3);
});

test("rejects whitespace and over-length", () => {
  const d = toDraft(content);
  d.title = "   ";
  d.description = "a".repeat(1001);
  d.cards[2].description = "b".repeat(2001);
  d.cards[0].title = "c".repeat(101);
  const e = validateStreakInfo(d);
  assert.ok(e.title && e.description && e["cards.2.description"] && e["cards.0.title"]);
});

test("limits are inclusive", () => {
  const d = toDraft(content);
  d.title = "a".repeat(100);
  d.description = "a".repeat(1000);
  d.cards[1].description = "a".repeat(2000);
  assert.deepEqual(validateStreakInfo(d), {});
});

test("sameDraft and errorStatus", () => {
  assert.ok(sameDraft(toDraft(content), toDraft(content)));
  assert.equal(errorStatus({ status: 409 }), 409);
  assert.equal(errorStatus(new Error("x")), undefined);
});
