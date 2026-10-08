import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { getThemeStyleId, SCENE_THEMES } from "../config/scene-themes.ts";

const source = readFileSync(new URL("../components/TimerSheet.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("TimerSheet.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let expression: ts.Expression | undefined;
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "timerGradient") expression = node.initializer;
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(expression);
const resolve = new Function("theme", "getThemeStyleId", ts.transpileModule(`return (${expression.getText(ast)});`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText);

test("the timer uses the first four stops only in Cloudy", () => {
  for (const id of ["cloudy", "cloudy2", "indigo2", "tibet", "natural", "pleyades"] as const) {
    assert.deepEqual(resolve(SCENE_THEMES[id], getThemeStyleId), getThemeStyleId(id) === "cloudy" ? SCENE_THEMES[id].gradient.slice(0, 4) : null);
  }
});

test("timer gradient preserves rounded corners, direction, controls and selection behavior", () => {
  assert.match(source, /\{timerGradient && \([\s\S]*?<LinearGradient[\s\S]*?colors=\{timerGradient\}/);
  assert.match(source, /locations=\{\[0, 1 \/ 3, 2 \/ 3, 1\]\}/);
  assert.match(source, /start=\{theme.gradientStart\}\s+end=\{theme.gradientEnd\}/);
  assert.match(source, /pointerEvents="none"/);
  assert.match(source, /borderTopLeftRadius: 20, borderTopRightRadius: 20/);
  assert.match(source, /setSleepTimer\(value\);\s+onClose\(\)/);
  assert.match(source, /value > FREE_TIMER_MAX_MINUTES && !isPremium/);
});
