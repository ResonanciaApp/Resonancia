import assert from "node:assert/strict";
import test from "node:test";
import { resolveAvatarUrl } from "../lib/avatar.ts";

test("normalizes legacy double-slash playlist covers for cards and hero", () => {
  assert.equal(
    resolveAvatarUrl("/api/storage//objects/uploads/cover"),
    resolveAvatarUrl("/api/storage/objects/uploads/cover"),
  );
  assert.equal(
    resolveAvatarUrl("https://example.com/api/storage//objects/uploads/cover"),
    "https://example.com/api/storage/objects/uploads/cover",
  );
  assert.equal(resolveAvatarUrl("https://example.com/photo.jpg"), "https://example.com/photo.jpg");
  assert.equal(resolveAvatarUrl(null), null);
});