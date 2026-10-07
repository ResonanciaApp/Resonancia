import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import test from "node:test";
import { reflectionAvatarObjectPath, getStableIdempotencyKey } from "../lib/reflection-story-logic.ts";

const base = "https://app.example.invalid";

test("avatar snapshots preserve only our stable object paths, not third-party URLs or bundle URIs", () => {
  assert.equal(reflectionAvatarObjectPath("/objects/uploads/a", base), "/objects/uploads/a");
  assert.equal(reflectionAvatarObjectPath("/api/storage/objects/uploads/a", base), "/objects/uploads/a");
  assert.equal(reflectionAvatarObjectPath(`${base}/api/storage/objects/uploads/a`, base), "/objects/uploads/a");
  assert.equal(reflectionAvatarObjectPath("https://other.example.invalid/objects/uploads/a", base), null);
  assert.equal(reflectionAvatarObjectPath("file:///tmp/avatar.png", base), null);
  assert.equal(reflectionAvatarObjectPath("data:image/png;base64,abc", base), null);
  assert.equal(reflectionAvatarObjectPath("https://other.example.invalid/avatar.png", ""), null);
});

test("changing avatar inclusion invalidates the saved recipe's idempotency key", () => {
  const first = getStableIdempotencyKey({ avatarImagePath: null }, { hash: "", key: "" });
  const withAvatar = getStableIdempotencyKey({ avatarImagePath: "/objects/uploads/a" }, first);
  assert.notEqual(first.key, withAvatar.key);
  assert.deepEqual(getStableIdempotencyKey({ avatarImagePath: "/objects/uploads/a" }, withAvatar), withAvatar);
});

test("preview and export share avatar geometry and wait for both images", () => {
  const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
  const exportFrame = read("../components/StoryArtworkFrame.tsx");
  const preview = read("../components/ReflectionShare.tsx");
  assert.match(exportFrame, /<StoryAvatar source=\{avatarSource\} scale=\{exportScale\}/);
  assert.match(preview, /<StoryAvatar source=\{avatarSource\} scale=\{width \/ STORY_WIDTH\}/);
  assert.match(exportFrame, /loadedBackground === backgroundKey && \(!avatarSource \|\| loadedAvatar === avatarKey\)/);
  assert.match(preview, /JSON\.stringify\(includedAvatar\)/);
  assert.match(read("../app/galeria-reflexiones/index.tsx"), /avatarUrl: item\.avatarImagePath/);
  assert.match(read("../app/galeria-reflexiones/[id].tsx"), /avatarImagePath: story\.avatarImagePath/);
});
