import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("creating a mix from Biblioteca opens only the overlay, not a second mixer route", () => {
  const source = readFileSync(new URL("../components/BibliotecaScreen.tsx", import.meta.url), "utf8");
  assert.match(source, /onGoMezclas=\{openMixer\}/);
  assert.doesNotMatch(source, /router\.(?:navigate|push|replace)\(["']\/\(tabs\)\/musica/);
  assert.match(source, /title: "Crea tus mezclas"[^ \n]*[^\n]*onClose\(\); onGoMezclas\(\)/);
  const overlay = readFileSync(new URL("../components/CreationPanelsOverlay.tsx", import.meta.url), "utf8");
  assert.match(overlay, /<MezcladorScreen \/>/);
  assert.match(overlay, /pointerEvents=\{isMixerOpen \? "box-none" : "none"\}/);
});
