import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import test from "node:test";
import { reflectionAvatarObjectPath, getStableIdempotencyKey, clampReflectionStoryAvatarPosition,
  REFLECTION_STORY_AVATAR_X_MIN, REFLECTION_STORY_AVATAR_Y_MIN, snapReflectionStoryAvatarCoordinate } from "../lib/reflection-story-logic.ts";

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
  assert.match(preview, /<StoryAvatarLayer source=\{avatarSource\} width=\{width\}/);
  assert.match(exportFrame, /<StoryAvatarLayer source=\{avatarSource\} width=\{width\}/);
  const layer = read("../components/StoryAvatarLayer.tsx");
  assert.match(layer, /event\.translationX \/ \(width \* visibleScale\)/);
  assert.match(layer, /event\.translationY \/ \(height \* visibleScale\)/);
  assert.doesNotMatch(layer, /textX|textY|backgroundX|backgroundY/);
  assert.match(exportFrame, /loadedBackground === backgroundKey && \(!avatarSource \|\| loadedAvatar === avatarKey\)/);
  assert.match(preview, /JSON\.stringify\(includedAvatar\)/);
  assert.match(read("../app/galeria-reflexiones/index.tsx"), /avatarUrl: item\.avatarImagePath/);
  assert.match(read("../app/galeria-reflexiones/[id].tsx"), /avatarImagePath: story\.avatarImagePath/);
  assert.match(read("../app/galeria-reflexiones/[id].tsx"), /avatarX: story\.avatarX/);
  assert.match(read("../components/StoryAvatar.tsx"), /borderWidth: 1, borderColor: "rgba\(255,255,255,0\.4\)"/);
  assert.match(read("../components/StoryAvatar.tsx"), /backgroundColor: "rgba\(0,0,0,0\.2\)"/);
});

test("free avatar movement keeps the full circle inside the image and changes the capture recipe", () => {
  assert.deepEqual(clampReflectionStoryAvatarPosition({ x: -100, y: 100 }), {
    x: REFLECTION_STORY_AVATAR_X_MIN, y: 1 - REFLECTION_STORY_AVATAR_Y_MIN,
  });
  assert.deepEqual(clampReflectionStoryAvatarPosition({ x: 0.25, y: 0.75 }), { x: 0.25, y: 0.75 });
  const initial = getStableIdempotencyKey({ avatarX: 0.5, avatarY: 0.66 }, { hash: "", key: "" });
  assert.notEqual(getStableIdempotencyKey({ avatarX: 0.25, avatarY: 0.75 }, initial).key, initial.key);
});

test("avatar snaps to both pink center guides using the visible size, not export pixels", () => {
  assert.equal(snapReflectionStoryAvatarCoordinate(0.52, 300), 0.5);
  assert.equal(snapReflectionStoryAvatarCoordinate(0.49, 600), 0.5);
  assert.equal(snapReflectionStoryAvatarCoordinate(0.54, 300), 0.54);
  assert.equal(snapReflectionStoryAvatarCoordinate(0.52, 600), 0.52);
  assert.equal(snapReflectionStoryAvatarCoordinate(0.52, 600 * 0.5), 0.5);
  assert.equal(snapReflectionStoryAvatarCoordinate(0.3, 300), 0.3);
  const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
  const layer = read("../components/StoryAvatarLayer.tsx");
  assert.match(layer, /guideOpacity\.value = 1/);
  assert.match(layer, /guideOpacity\.value = 0/);
  assert.match(layer, /snapReflectionStoryAvatarCoordinate\(nextX, width \* visibleScale\)/);
  assert.match(layer, /snapReflectionStoryAvatarCoordinate\(nextY, height \* visibleScale\)/);
  assert.match(read("../components/ReflectionShare.tsx"), /displayScale=\{displayScale\} guideOpacity=\{guideOpacity\}/);
});
