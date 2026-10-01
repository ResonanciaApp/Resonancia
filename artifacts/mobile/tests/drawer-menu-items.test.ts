import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";

test("the drawer hides Diario without removing its screen or neighboring menu items", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  const sections = source.match(/const INICIO3_SECTIONS[\s\S]*?\n\];/)?.[0];
  assert.ok(sections);
  assert.doesNotMatch(sections, /id: "journal"|label: "Diario"|__overlay:\/diario/);
  for (const id of ["premium", "favorites", "library", "history", "downloads", "notifications", "mixer", "breathing", "mood-register"]) {
    assert.ok(sections.includes(`id: "${id}"`), `Missing neighboring drawer item: ${id}`);
  }
  assert.ok(existsSync(new URL("../app/diario.tsx", import.meta.url)));
});

test("Herramientas and its items move up 15 px by reducing only the gap above the heading", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  const divider = source.match(/inicio3SectionDivider: \{([\s\S]*?)\n  \},/)?.[1];
  assert.ok(divider);
  assert.match(divider, /marginTop: 24/);
  assert.match(divider, /marginBottom: 10/);
  assert.match(source, /sectionIndex > 0 && <View style=\{styles\.inicio3SectionDivider\}/);
});