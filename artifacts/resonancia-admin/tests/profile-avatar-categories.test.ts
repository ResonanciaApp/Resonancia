import assert from "node:assert/strict";
import test from "node:test";
import { categoryCounts, errorMessage, membershipPayload, mergeCategoryIds, validateCategoryName } from "../src/lib/profile-avatar-categories.ts";

test("validates empty, reserved and duplicate names", () => {
  const cats = [{ id: "a", name: "Calma" }];
  assert.ok(validateCategoryName("   ", cats));
  assert.ok(validateCategoryName("todos", cats));
  assert.ok(validateCategoryName("Sin categoría", cats));
  assert.ok(validateCategoryName(" calma ", cats));
  assert.equal(validateCategoryName("Calma", cats, "a"), null);
  assert.equal(validateCategoryName("Sueño", cats), null);
});

test("merge keeps local order and fields, replacing only categoryIds by id", () => {
  const local = [{ id: "b", label: "B" }, { id: "a", label: "A", categoryIds: ["x"] }];
  const merged = mergeCategoryIds(local, [{ id: "a", categoryIds: ["x", "y"] }, { id: "b" }]);
  assert.deepEqual(merged.map(i => i.id), ["b", "a"]);
  assert.deepEqual(merged[1].categoryIds, ["x", "y"]);
  assert.equal(merged[1].label, "A");
  assert.equal(mergeCategoryIds(merged, [{ id: "a", categoryIds: ["x", "y"] }]), merged);
});

test("payloads, counts and server error messages", () => {
  assert.deepEqual(membershipPayload(["a", "a", "b"], "c", false).data, { presetIds: ["a", "b"], categoryIds: ["c"], mode: "remove" });
  assert.equal(categoryCounts([{ id: "a", categoryIds: ["c", "c"] }, { id: "b", categoryIds: ["c"] }]).get("c"), 2);
  assert.equal(errorMessage({ data: { error: "Nombre duplicado" } }, "x"), "Nombre duplicado");
  assert.equal(errorMessage(new Error("boom"), "x"), "x");
});
