import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";

const source = readFileSync(new URL("../components/SleepReminderSheet.tsx", import.meta.url), "utf8");

test("the sleep reminder sheet has no outline while preserving rounded corners", () => {
  const sheet = source.match(/  sheet: \{([\s\S]*?)\n  \},/)?.[1];
  assert.ok(sheet);
  assert.doesNotMatch(sheet, /border(?:Width|Color|TopWidth|LeftWidth|RightWidth)/);
  assert.match(sheet, /borderTopLeftRadius: 32/);
  assert.match(sheet, /borderTopRightRadius: 32/);
  assert.doesNotMatch(source, /sheetOutline/);
});

test("the morning reminder keeps its existing border without applying it to sleep", () => {
  assert.match(source, /isMorning && styles\.morningSheetBorder/);
  const border = source.match(/  morningSheetBorder: \{([\s\S]*?)\n  \},/)?.[1];
  assert.ok(border);
  assert.match(border, /borderWidth: 1/);
  assert.match(border, /borderBottomWidth: 0/);
});