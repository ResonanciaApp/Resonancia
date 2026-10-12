import assert from "node:assert/strict";
import test from "node:test";
import { fitHomeName, homeNameCandidates } from "../lib/home-display-name";

test("fits full words plus a comma instead of ellipsis, and keeps complete names unchanged", () => {
  const names = homeNameCandidates("Nicolás Blanch Gomez");
  assert.deepEqual(names, ["Nicolás Blanch Gomez", "Nicolás Blanch,", "Nicolás,"]);
  const widths = { [names[0]]: 170, [names[1]]: 115, [names[2]]: 62 };
  assert.equal(fitHomeName(names, widths, 130), "Nicolás Blanch,");
  assert.equal(fitHomeName(names, widths, 110), "Nicolás,");
  assert.equal(fitHomeName(names, widths, 170), "Nicolás Blanch Gomez");
  assert.equal(fitHomeName(names, widths, 115), "Nicolás Blanch,");
});

test("handles whitespace, one-word names and widths too small for one whole word", () => {
  assert.deepEqual(homeNameCandidates("  Ana   María  "), ["Ana María", "Ana,"]);
  assert.deepEqual(homeNameCandidates("Alexandra"), ["Alexandra"]);
  assert.equal(fitHomeName(["Alexandra"], { Alexandra: 150 }, 50), "Alexandra");
  assert.deepEqual(homeNameCandidates(""), [""]);
});
