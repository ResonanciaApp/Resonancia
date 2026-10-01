import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import { TAB_BAR_INACTIVE_COLOR } from "../constants/tab-bar.ts";

test("unselected tab icons and labels share F2E8FF while selected tabs stay white", () => {
  assert.equal(TAB_BAR_INACTIVE_COLOR, "#F2E8FF");
  const source = readFileSync(new URL("../app/(tabs)/_layout.tsx", import.meta.url), "utf8");
  assert.match(source, /const INACTIVE_COLOR = TAB_BAR_INACTIVE_COLOR/);
  assert.match(source, /const inactiveCol = INACTIVE_COLOR/);
  assert.match(source, /active \? activeCol : inactiveCol/);
  assert.match(source, /color: isFocused \? activeCol : inactiveCol/);
  assert.match(source, /const ACTIVE_COLOR\s*=\s*"#FFFFFF"/);
});