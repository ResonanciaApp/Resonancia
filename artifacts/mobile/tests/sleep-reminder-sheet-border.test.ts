import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import ts from "typescript";
import { SCENE_THEMES } from "../config/scene-themes.ts";
import { SLEEP_REMINDER_NIGHT_GRADIENT } from "../constants/colors.ts";

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

test("Indigo 2 sleep reminder matches the Universo duration gradient without changing morning or other themes", () => {
  const expression = source.match(/const gradient = ([\s\S]*?);\n  return/)?.[1];
  assert.ok(expression);
  const gradientFor = new Function("isMorning", "theme", "SCENE_THEMES", "SLEEP_REMINDER_NIGHT_GRADIENT",
    ts.transpileModule(`return (${expression});`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText);
  assert.match(source, /<LinearGradient colors=\{gradient\}/);
  for (const theme of Object.values(SCENE_THEMES)) {
    assert.deepEqual(
      gradientFor(false, theme, SCENE_THEMES, SLEEP_REMINDER_NIGHT_GRADIENT),
      theme.id === "indigo2" ? ["#332261", "#2E2468"] : SLEEP_REMINDER_NIGHT_GRADIENT,
    );
    assert.deepEqual(
      gradientFor(true, theme, SCENE_THEMES, SLEEP_REMINDER_NIGHT_GRADIENT),
      ["#C96D68", "#855269", "#443044"],
    );
  }
});