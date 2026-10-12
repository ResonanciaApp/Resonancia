import test from "node:test";
import assert from "node:assert/strict";
import { isStreakInfoSettings } from "../lib/streak-info-content.ts";

const settings = () => ({
  revision: 3,
  content: {
    title: "Mis rachas",
    description: "Descripción editorial",
    cards: ["current", "accumulated", "longest", "completed"].map(id => ({
      id, title: `Título ${id}`, description: `Descripción ${id}`,
    })),
  },
});
test("accepts all four editorial cards, preserving their stable identities", () => {
  assert.equal(isStreakInfoSettings(settings()), true);
});
test("rejects corrupt cache and partial responses rather than losing cards", () => {
  for (const value of [null, {}, "invalid", { ...settings(), revision: -1 }]) {
    assert.equal(isStreakInfoSettings(value), false);
  }
  const partial = settings();
  partial.content.cards.pop();
  assert.equal(isStreakInfoSettings(partial), false);
  const duplicate = settings();
  duplicate.content.cards[1].id = "current";
  assert.equal(isStreakInfoSettings(duplicate), false);
});
test("rejects invalid or blank editorial text", () => {
  const value = settings();
  value.content.description = " ";
  assert.equal(isStreakInfoSettings(value), false);
  value.content.description = "a".repeat(1001);
  assert.equal(isStreakInfoSettings(value), false);
});
