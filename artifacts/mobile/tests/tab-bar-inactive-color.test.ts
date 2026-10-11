import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import { TAB_BAR_INACTIVE_COLOR, getTabBarInactiveColor } from "../constants/tab-bar.ts";

test("Cloudy and Indigo 2 use their exact requested inactive tints, without changing other themes", () => {
  assert.equal(getTabBarInactiveColor("cloudy"), "#D5E5F2");
  assert.equal(getTabBarInactiveColor("indigo2"), "#DED5F2");
  assert.equal(TAB_BAR_INACTIVE_COLOR, "rgba(190,180,207,0.96)");
  for (const theme of ["tibet", "indigo", "resonancia", "cloudy2", "unknown"]) {
    assert.equal(getTabBarInactiveColor(theme), TAB_BAR_INACTIVE_COLOR);
  }
});

test("icons and menu labels share the theme tint and selected white", () => {
  const source = readFileSync(new URL("../app/(tabs)/_layout.tsx", import.meta.url), "utf8");
  assert.match(source, /const INACTIVE_COLOR = TAB_BAR_INACTIVE_COLOR/);
  assert.match(source, /const inactiveColor = getTabBarInactiveColor\(activeSceneId\)/);
  assert.match(source, /inactiveColor=\{inactiveColor\}/);
  assert.match(source, /const inactiveCol = inactiveColor/);
  assert.match(source, /active \? activeCol : inactiveCol/);
  assert.match(source, /<Image[^>]+tintColor=\{color\}/);
  assert.match(source, /<MaterialCommunityIcons[^>]+color=\{color\}/);
  assert.match(source, /<SymbolView[^>]+tintColor=\{color\}/);
  assert.match(source, /<Feather[^>]+color=\{color\}/);
  assert.match(source, /accessibilityLabel=\{conf.label\}/);
  assert.match(source, /\{conf.label\}[\s\n]*<\/Text>/);
  assert.match(source, /styles.label, \{ color: isFocused \? activeCol : inactiveCol \}/);
  assert.match(source, /const ACTIVE_COLOR\s*=\s*"#FFFFFF"/);
});