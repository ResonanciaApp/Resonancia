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

test("Gallery back chevron has a circular black background with the requested theme opacity", () => {
  const gallery = readFileSync(new URL("../app/galeria-reflexiones/index.tsx", import.meta.url), "utf8");
  assert.match(gallery, /style=\{\[\s*styles\.backButton,\s*\{ backgroundColor: theme\.id === "cloudy" \|\| theme\.id === "natural"\s*\? "rgba\(0,0,0,0\.19\)"\s*: "rgba\(0,0,0,0\.16\)"/);
  assert.match(gallery, /backButton: \{\s*width: 44,\s*height: 44,\s*borderRadius: 22,/);
  assert.match(gallery, /accessibilityLabel="Volver" onPress=\{\(\) => router\.back\(\)\}/);
});
