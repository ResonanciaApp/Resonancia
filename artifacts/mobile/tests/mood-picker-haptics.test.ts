import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import ts from "typescript";

const source = readFileSync(new URL("../components/MoodPickerSheet.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("MoodPickerSheet.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let body = "";
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "toggleMood" && node.body) {
    body = node.body.getText(ast);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(body);
const toggle = new Function("moodId", "historyReady", "isDailyCheckInLocked", "selected", "setSelected", "Platform", "Haptics", "console", body);
function fixture(platform = "ios", ready = true, locked = false, reject = false) {
  let selected: string[] = [];
  const impacts: string[] = [];
  const warnings: unknown[][] = [];
  return {
    impacts, warnings,
    selected: () => selected,
    tap: (id: string) => toggle(id, ready, locked, selected,
      (update: (current: string[]) => string[]) => { selected = update(selected); },
      { OS: platform },
      {
        ImpactFeedbackStyle: { Soft: "soft" },
        impactAsync: (style: string) => {
          impacts.push(style);
          return reject ? Promise.reject(new Error("Haptics unavailable")) : Promise.resolve();
        },
      },
      { warn: (...args: unknown[]) => warnings.push(args) }),
  };
}

test("each new emoji selection triggers one soft impact on iOS and Android, without vibrating on deselection", () => {
  assert.match(source, /onPress=\{\(\) => toggleMood\(mood\.id\)\}/);
  for (const platform of ["ios", "android"]) {
    const f = fixture(platform);
    for (const id of ["feliz", "triste", "agradecido"]) {
      f.tap(id);
      assert.deepEqual(f.selected(), [id]);
    }
    assert.deepEqual(f.impacts, ["soft", "soft", "soft"]);
    f.tap("agradecido");
    assert.deepEqual(f.selected(), []);
    assert.equal(f.impacts.length, 3);
  }
});

test("disabled or unhydrated check-ins do not select or vibrate; web selects without native haptics", () => {
  for (const [ready, locked] of [[false, false], [true, true]]) {
    const f = fixture("ios", ready, locked);
    f.tap("feliz");
    assert.deepEqual(f.selected(), []);
    assert.deepEqual(f.impacts, []);
  }
  const web = fixture("web");
  web.tap("feliz");
  assert.deepEqual(web.selected(), ["feliz"]);
  assert.deepEqual(web.impacts, []);
});

test("a haptic failure is reported without blocking the emoji selection", async () => {
  const f = fixture("ios", true, false, true);
  f.tap("feliz");
  assert.deepEqual(f.selected(), ["feliz"]);
  await Promise.resolve();
  assert.equal(f.warnings.length, 1);
  assert.deepEqual(f.impacts, ["soft"]);
});