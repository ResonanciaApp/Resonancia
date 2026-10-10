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

test("mixer, breathing exercises and mood register follow notifications in the same standard-spaced menu group, without Herramientas", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  const sections = source.match(/const INICIO3_SECTIONS[\s\S]*?\n\];/)?.[0];
  assert.ok(sections);
  assert.doesNotMatch(sections, /Herramientas/);
  assert.equal((sections.match(/items: \[/g) ?? []).length, 1);
  assert.match(sections, /title: null/);
  const ids = Array.from(sections.matchAll(/id: "([^"]+)"/g), match => match[1]);
  assert.deepEqual(ids.slice(ids.indexOf("notifications")), ["notifications", "mixer", "breathing", "mood-register"]);
  assert.match(sections, /id: "mixer", label: "Mezclador"[^}]*route: "__mixer"/);
  assert.match(sections, /id: "breathing", label: "Respiración"[^}]*route: "\/respiracion"/);
  assert.match(sections, /id: "mood-register"[^}]*route: "__mood_picker"/);
  assert.match(source, /itemGroup: \{ gap: 10, marginTop: 10 \}/);
  assert.match(source, /section\.items\.map\(\(item\) => \([\s\S]*?style=\{styles\.item\}/);
  assert.match(source, /item: \{[\s\S]*?paddingVertical: 5,/);
});

test("larger bold menu contents keep row heights and do not push scenes down", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  assert.match(source, /inicio3ItemLabel: \{[\s\S]*?fontSize: 17,/);
  assert.match(source, /itemLabel: \{[\s\S]*?lineHeight: 23,[\s\S]*?fontWeight: "700"/);
  assert.match(source, /MaterialCommunityIcons name=\{item\.mciIcon\} size=\{26\}/);
  assert.match(source, /Feather name=\{item\.icon\} size=\{23\}/);
  assert.match(source, /premiumMenuStar: \{\s*width: 24,\s*height: 24/);
  for (const originalIcon of [20, 23, 21]) {
    assert.equal(originalIcon + 2 * 6.5, originalIcon + 3 + 2 * 5);
  }
});

test("Perfil precedes Premium and live stage replaces the old profile header controls", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  const profile = source.indexOf('id: "profile", label: "Perfil"');
  assert.ok(profile >= 0 && profile < source.indexOf('id: "premium", label: "Tu Premium"'));
  assert.match(source, /id: "profile"[^\n]*route: "\/\(tabs\)\/profile"/);
  assert.match(source, /testID="drawer-current-stage-pill"[\s\S]*?<GrowthCurrentStagePill \/>/);
  assert.doesNotMatch(source, /<Text[^>]*>\s*Ver perfil\s*<\/Text>/);
  assert.doesNotMatch(source, /style=\{styles\.profileChevronButton\}/);
});

test("menu and scenes shift right 6px; scene offset compensates the added menu height", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  assert.match(source, /paddingLeft: 26, paddingRight: 14/);
  assert.equal(26 - 20, 6);
  assert.equal(26 + 14, 20 * 2, "available text width is unchanged");
  assert.match(source, /style=\{styles\.scenePositionCompensation\}>\s*<DrawerSceneCards/);
  assert.match(source, /scenePositionCompensation: \{[\s\S]*?marginTop: -\(33 \+ 10 \+ 8 \* 8\)/);
  const originalRows = 34 + 8 * 36;
  const originalMenuHeight = originalRows + 8 * 2;
  const currentMenuHeight = originalRows + 33 + 9 * 10;
  assert.equal(currentMenuHeight - 107 + 165, originalMenuHeight + 165);
});