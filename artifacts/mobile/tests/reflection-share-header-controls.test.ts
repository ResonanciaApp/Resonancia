import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const share = readFileSync(new URL("../components/ReflectionShare.tsx", import.meta.url), "utf8");
const modal = readFileSync(new URL("../components/StoryShareModal.tsx", import.meta.url), "utf8");

test("Restablecer is immediately to the right of X with a 7px gap, not next to the avatar", () => {
  assert.match(share, /headerLeftActionGap=\{7\}/);
  const leftAction = share.slice(share.indexOf("headerLeftAction="), share.indexOf("headerRightAction="));
  assert.match(leftAction, /compositionIsModified \?/);
  assert.match(leftAction, /accessibilityLabel="Restablecer composición"/);
  assert.match(leftAction, /onPress=\{resetComposition\}/);
  assert.match(leftAction, /name="rotate-ccw"/);
  const rightAction = share.slice(share.indexOf("headerRightAction="), share.indexOf("renderArtwork="));
  assert.doesNotMatch(rightAction, /Restablecer composición|resetComposition|rotate-ccw/);
  assert.match(rightAction, /Quitar avatar de la imagen/);
  const header = modal.slice(modal.indexOf("{closeOnLeft ? ("), modal.indexOf("<View style={styles.previewArea}"));
  assert.ok(header.indexOf('name="x"') < header.indexOf("{headerLeftAction}"));
  assert.match(header, /\{ gap: headerLeftActionGap \}/);
  assert.match(modal, /headerLeftActionGap = 8/);
});

test("Restablecer and X use the same 43px circular background with no positional offset", () => {
  assert.match(share, /closeButtonBackgroundColor="rgba\(255,255,255,0\.1\)"/);
  const reset = share.match(/resetButton: \{([\s\S]*?)\n  \},/)?.[1];
  assert.ok(reset);
  assert.match(reset, /backgroundColor: "rgba\(255,255,255,0\.1\)"/);
  assert.match(reset, /width: 43/);
  assert.match(reset, /height: 43/);
  assert.match(reset, /borderRadius: 21\.5/);
  assert.doesNotMatch(reset, /translateX|margin|transform/);
});
