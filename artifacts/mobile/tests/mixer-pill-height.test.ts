import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";

test("mixer pills shrink 5 px while retaining their original centered layout slots", () => {
  const source = readFileSync(new URL("../app/(tabs)/musica.tsx", import.meta.url), "utf8");
  const pill = source.match(/  pillTab: \{([\s\S]*?)\n  \},/)?.[1];
  assert.ok(pill);
  assert.match(pill, /height: 30/);
  assert.match(source, /pillTabSlot: \{ height: 35, justifyContent: "center" \}/);
  assert.match(source, /<View key=\{tab\.id\} style=\{styles\.pillTabSlot\}>/);
  assert.match(source, /hitSlop=\{\{ top: 2\.5, bottom: 2\.5 \}\}/);
  // Reducing the row gap from 12 to 5 moves the second row and the
  // auto-sized sticky bottom up together, preserving its bottom clearance.
  assert.match(source, /<View style=\{\{ gap: 5 \}\}>/);
  assert.match(source, /pillRowContent: \{[^\n]*paddingBottom: 6 \}/);
  const divider = source.match(/  stickyTabsBorder: \{([\s\S]*?)\n  \},/)?.[1];
  assert.ok(divider);
  assert.match(divider, /bottom: 3/);
});