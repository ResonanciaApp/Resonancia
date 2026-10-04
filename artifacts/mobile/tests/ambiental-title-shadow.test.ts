import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import ts from "typescript";

test("all Ambiental carousel title variants override inherited shadows without changing typography", () => {
  const source = readFileSync(new URL("../components/SessionCarousel.tsx", import.meta.url), "utf8");
  const match = source.match(/const AMBIENTAL_TITLE_NO_SHADOW: TextStyle = (\{[\s\S]*?\n\});/);
  assert.ok(match);
  const neutral = new Function(ts.transpileModule(`return (${match[1]});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText)();
  const base = { fontSize: 14, lineHeight: 18, color: "#F9F9F9",
    textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 };
  const flattened = { ...base, ...neutral };
  assert.equal(flattened.textShadowColor, "transparent");
  assert.equal(flattened.textShadowRadius, 0);
  assert.deepEqual(flattened.textShadowOffset, { width: 0, height: 0 });
  for (const key of ["fontSize", "lineHeight", "color"] as const) {
    assert.equal(flattened[key], base[key]);
  }
  assert.match(source, /styles\.ambientalCardTitle, AMBIENTAL_TITLE_NO_SHADOW/);
  assert.match(source, /ambientalTitleOnlyTitleStyle,\s+AMBIENTAL_TITLE_NO_SHADOW/);
  assert.match(source, /isAmbiental && AMBIENTAL_TITLE_NO_SHADOW/);
  assert.match(source, /sleepOverlayTitle: \{[\s\S]*?textShadowRadius: 4/);
});

test("standalone Ambiental cards remove shadows on editorial and normal titles, not other categories", () => {
  const source = readFileSync(new URL("../components/SessionCard.tsx", import.meta.url), "utf8");
  assert.match(source, /ambientalTitleNoShadow: \{\s+textShadowColor: "transparent",\s+textShadowOffset: \{ width: 0, height: 0 \},\s+textShadowRadius: 0/);
  assert.match(source, /styles\.sleepEditorialTitle, styles\.ambientalTitleNoShadow/);
  assert.match(source, /styles\.editorialTitle, styles\.ambientalTitleNoShadow/);
  assert.match(source, /styles\.ambientalCardTitle,\s+styles\.ambientalTitleNoShadow/);
  assert.match(source, /<Text style=\{styles\.sleepEditorialTitle\}/);
  assert.match(source, /<Text style=\{styles\.editorialTitle\}/);
});