import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import ts from "typescript";
import { getThemeStyleId, SCENE_THEMES } from "../config/scene-themes.ts";
import {
  SLEEP_REMINDER_NIGHT_GRADIENT,
  SLEEP_REMINDER_CARD_BACKGROUND,
  SLEEP_REMINDER_CONTINUE_BACKGROUND,
  SLEEP_REMINDER_CONTINUE_FOREGROUND,
} from "../constants/colors.ts";

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

test("sleep reminder uses a 16% black card and solid periwinkle Continue with dark indigo text, preserving morning colors", () => {
  assert.equal(SLEEP_REMINDER_CARD_BACKGROUND, "rgba(0,0,0,0.16)");
  assert.equal(SLEEP_REMINDER_CONTINUE_BACKGROUND, "#94A6FF");
  assert.equal(SLEEP_REMINDER_CONTINUE_FOREGROUND, "#0B0A26");
  assert.match(source, /nightReminderCard: \{\s*backgroundColor: SLEEP_REMINDER_CARD_BACKGROUND/);
  assert.match(source, /continueButton: \{[\s\S]*?backgroundColor: SLEEP_REMINDER_CONTINUE_BACKGROUND/);
  assert.match(source, /nightContinueText: \{\s*color: SLEEP_REMINDER_CONTINUE_FOREGROUND/);
  assert.match(source, /!isMorning && styles\.nightContinueText/);
  assert.match(source, /ActivityIndicator color=\{isMorning \? "#FFFFFF" : SLEEP_REMINDER_CONTINUE_FOREGROUND\}/);
  assert.doesNotMatch(source, /colors=\{\["#321F5E", "#4D318F"\]\}/);
  assert.match(source, /morningContinueButton: \{\s*backgroundColor: "#C96D68"/);
  assert.match(source, /continueText: \{\s*color: "#FFFFFF"/);
  assert.match(source, /morningReminderCard: \{\s*backgroundColor: "rgba\(20,18,32,0.36\)"/);
});

test("sleep reminder matches the Ambiental duration gradient in every theme without changing morning", () => {
  const expression = source.match(/const gradient = ([\s\S]*?);\n  return/)?.[1];
  assert.ok(expression);
  const gradientFor = new Function("isMorning", "theme", "SCENE_THEMES", "SLEEP_REMINDER_NIGHT_GRADIENT", "getThemeStyleId",
    ts.transpileModule(`return (${expression});`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText);
  assert.match(source, /<LinearGradient\s+colors=\{gradient\}/);
  assert.match(source, /locations=\{!isMorning && getThemeStyleId\(theme\.id\) === "cloudy" \? \[0, 1 \/ 3, 2 \/ 3, 1\] : undefined\}/);
  assert.match(source, /start=\{!isMorning && getThemeStyleId\(theme\.id\) === "cloudy" \? theme\.gradientStart : undefined\}/);
  assert.match(source, /end=\{!isMorning && getThemeStyleId\(theme\.id\) === "cloudy" \? theme\.gradientEnd : undefined\}/);
  for (const theme of Object.values(SCENE_THEMES)) {
    assert.deepEqual(
      gradientFor(false, theme, SCENE_THEMES, SLEEP_REMINDER_NIGHT_GRADIENT, getThemeStyleId),
      getThemeStyleId(theme.id) === "indigo2" ? ["#332261", "#2E2468"]
        : getThemeStyleId(theme.id) === "cloudy" ? theme.gradient.slice(0, 4)
        : [theme.gradient[1], theme.gradient[2]],
    );
    assert.deepEqual(
      gradientFor(true, theme, SCENE_THEMES, SLEEP_REMINDER_NIGHT_GRADIENT, getThemeStyleId),
      ["#C96D68", "#855269", "#443044"],
    );
  }
});