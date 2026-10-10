import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";

test("the drawer hides Diario without removing its screen or neighboring menu items", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  const sections = source.match(/const INICIO3_SECTIONS[\s\S]*?\n\];/)?.[0];
  assert.ok(sections);
  assert.doesNotMatch(sections, /id: "journal"|label: "Diario"|__overlay:\/diario/);
  for (const id of ["profile", "premium", "favorites", "library", "history", "downloads", "notifications", "mixer", "breathing"]) {
    assert.ok(sections.includes(`id: "${id}"`), `Missing neighboring drawer item: ${id}`);
  }
  assert.ok(existsSync(new URL("../app/diario.tsx", import.meta.url)));
});

test("mixer and breathing follow notifications; mood register is removed only from the menu", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  const sections = source.match(/const INICIO3_SECTIONS[\s\S]*?\n\];/)?.[0];
  assert.ok(sections);
  assert.doesNotMatch(sections, /Herramientas/);
  assert.equal((sections.match(/items: \[/g) ?? []).length, 1);
  assert.match(sections, /title: null/);
  const ids = Array.from(sections.matchAll(/id: "([^"]+)"/g), match => match[1]);
  assert.deepEqual(ids.slice(ids.indexOf("notifications")), ["notifications", "mixer", "breathing"]);
  assert.match(sections, /id: "mixer", label: "Mezclador"[^}]*route: "__mixer"/);
  assert.match(sections, /id: "breathing", label: "Respiración"[^}]*route: "\/respiracion"/);
  assert.doesNotMatch(sections, /id: "mood-register"|label: "Registro de ánimo"/);
  assert.match(source, /itemGroup: \{ gap: 10, marginTop: 10 \}/);
  assert.match(source, /section\.items\.map\(\(item\) => \([\s\S]*?style=\{styles\.item\}/);
  assert.match(source, /item: \{[\s\S]*?paddingVertical: 5,/);
});

test("smaller menu icons keep row heights and centers while labels move left 3px independently", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  assert.match(source, /inicio3ItemLabel: \{[\s\S]*?fontSize: 17,/);
  assert.match(source, /itemLabel: \{[\s\S]*?lineHeight: 23,[\s\S]*?fontWeight: "700"/);
  assert.match(source, /MaterialCommunityIcons name=\{item\.mciIcon\} size=\{23\}/);
  assert.match(source, /Feather name=\{item\.icon\} size=\{20\}/);
  assert.match(source, /premiumMenuStar: \{\s*width: 21,\s*height: 21/);
  assert.match(source, /height: item\.id === "premium" \? 24 : item\.mciIcon \? 26 : 23/);
  assert.match(source, /itemIcon: \{ width: 26, alignItems: "center", justifyContent: "center" \}/);
  assert.match(source, /item: \{[\s\S]*?gap: 16,/);
  assert.equal(16 - 19, -3);
  for (const originalIcon of [23, 26, 24]) {
    const smallerIcon = originalIcon - 3;
    const slotHeight = originalIcon;
    const inset = (slotHeight - smallerIcon) / 2;
    assert.equal(inset + smallerIcon / 2, originalIcon / 2);
    assert.equal(Math.max(23, slotHeight) + 2 * 5, originalIcon + 2 * 5);
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

test("Perfil and all following menu content move down 15px together", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  assert.match(source, /paddingLeft: 23, paddingRight: 17, paddingTop: 20, paddingBottom: bottomPad \+ 40/);
  assert.equal(20 - 5, 15);
  assert.match(source, /itemGroup: \{ gap: 10, marginTop: 10 \}/);
  assert.match(source, /scenePositionCompensation: \{[\s\S]*?marginTop: -\(8 \* 8 - 3\)/);
});

test("menu and scenes shift left 3px, labels another 3px; removing mood register preserves scene height", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  assert.match(source, /paddingLeft: 23, paddingRight: 17/);
  assert.equal(23 - 26, -3);
  assert.equal((23 + 26 + 16) - (26 + 26 + 19), -6, "labels move a total of 6px left");
  assert.equal(23 + 17, 20 * 2, "menu and scene content width is unchanged");
  assert.match(source, /style=\{styles\.scenePositionCompensation\}>\s*<DrawerSceneCards/);
  assert.match(source, /scenePositionCompensation: \{[\s\S]*?marginTop: -\(8 \* 8 - 3\)/);
  const originalRows = 34 + 8 * 36;
  const originalMenuHeight = originalRows + 8 * 2;
  const currentMenuHeight = originalRows + 33 - 36 + 8 * 10;
  assert.equal(currentMenuHeight - 61 + 165, originalMenuHeight + 165);
});