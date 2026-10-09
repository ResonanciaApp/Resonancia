import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../app/galeria-reflexiones/[id].tsx", import.meta.url), "utf8");

test("Gallery story detail omits visibility controls while preserving close, delete and sharing", () => {
  assert.doesNotMatch(source, /Privada|Pública|eye-off|name="eye"|useSetMyReflectionStoryVisibility/);
  assert.match(source, /onClose=\{\(\) => router\.back\(\)\}/);
  assert.match(source, /accessibilityLabel="Borrar historia"/);
  assert.match(source, /onPress=\{requestDelete\}/);
  assert.match(source, /onBeforeInstagramShare=\{handleBeforeInstagramShare\}/);
});
