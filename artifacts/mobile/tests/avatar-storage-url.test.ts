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

test("local avatar URIs are not converted into server URLs", () => {
  for (const uri of [
    "file:///var/mobile/Documents/profile_photo.jpg",
    "content://media/external/images/media/12",
    "ph://photo-asset",
    "assets-library://asset/asset.JPG?id=123",
    "blob:https://app.example.test/photo",
    "data:image/jpeg;base64,abc",
  ]) {
    assert.equal(resolveAvatarUrl(uri), uri);
  }
});