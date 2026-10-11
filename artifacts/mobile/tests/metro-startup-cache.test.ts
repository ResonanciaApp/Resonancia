import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { scripts } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("normal managed Metro restarts preserve the transformed bundle cache", () => {
  assert.doesNotMatch(scripts.dev, /(?:^|\s)--(?:clear|reset-cache)(?:\s|$)/);
  assert.match(scripts.dev, /expo start --localhost --port \$PORT/);
  assert.match(scripts.dev, /EXPO_PACKAGER_PROXY_URL=https:\/\/\$REPLIT_DEV_DOMAIN/);
  assert.match(scripts.dev, /NODE_OPTIONS=--max-old-space-size=6144/);
});

test("cache clearing remains an explicit diagnostic operation", () => {
  assert.equal(scripts["dev:clear"], "pnpm run dev --clear");
});
