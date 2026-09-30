import test from "node:test";
import assert from "node:assert/strict";

import { buildLocalAvatarFilename, resolveProfileAvatarSource } from "../lib/profile-avatar-logic.ts";

const preset = (key: string, source: number) => ({
  id: `profile:${key}`,
  key,
  label: key,
  source,
});

test("profile preset wins over custom URL", () => {
  assert.equal(
    resolveProfileAvatarSource(
      { avatarPresetId: "profile:aurora", avatarUrl: "/objects/custom.jpg" },
      [preset("profile:aurora", 42)],
    ),
    42,
  );
});

test("custom URL is used when preset is unavailable", () => {
  assert.deepEqual(
    resolveProfileAvatarSource(
      { avatarPresetId: "profile:deleted", avatarUrl: "/objects/custom.jpg" },
      [],
    ),
    { uri: `${process.env.EXPO_PUBLIC_API_URL ?? ""}/api/storage/objects/custom.jpg` },
  );
});

test("missing preset and URL produces the fallback state", () => {
  assert.equal(resolveProfileAvatarSource({ avatarPresetId: null, avatarUrl: null }, []), undefined);
});

test("local phone and browser photos keep their original URI for Inicio and drawer", () => {
  const previousBase = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
  try {
    for (const uri of [
      "file:///var/mobile/Documents/profile_photo.jpg",
      "content://media/external/images/media/12",
      "ph://photo-asset",
      "assets-library://asset/asset.JPG?id=123",
      "blob:https://app.example.test/photo",
      "data:image/jpeg;base64,abc",
    ]) {
      assert.deepEqual(resolveProfileAvatarSource({ avatarPresetId: null, avatarUrl: uri }, []), { uri });
    }
    assert.deepEqual(
      resolveProfileAvatarSource({ avatarUrl: "/objects/avatar.jpg" }, []),
      { uri: "https://api.example.test/api/storage/objects/avatar.jpg" },
    );
  } finally {
    if (previousBase === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousBase;
  }
});

test("successive photo selections use distinct persistent image and sync identities", () => {
  const first = buildLocalAvatarFilename("file:///tmp/photo.jpeg?selection=1", "selection-a");
  const second = buildLocalAvatarFilename("file:///tmp/photo.jpeg?selection=2", "selection-b");
  assert.equal(first, "profile_photo_selection-a.jpeg");
  assert.equal(second, "profile_photo_selection-b.jpeg");
  assert.notEqual(first, second);
  assert.equal(buildLocalAvatarFilename("content://media/images/12", "selection-c"), "profile_photo_selection-c.jpg");
});