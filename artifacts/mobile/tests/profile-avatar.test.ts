import test from "node:test";
import assert from "node:assert/strict";

import { resolveProfileAvatarSource } from "../lib/profile-avatar-logic.ts";

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