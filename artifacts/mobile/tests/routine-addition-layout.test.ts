import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../components/MiRutinaSection.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("MiRutinaSection.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effect: ts.Expression | undefined;
function visit(node: ts.Node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === "useEffect"
    && node.arguments[0]?.getText(ast).includes("previousActivityCount.current")) {
    effect = node.arguments[0];
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(effect);
const compiled = ts.transpileModule(`return (${effect.getText(ast)})();`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const update = new Function("previousActivityCount", "todayActivities", "listHeight", "withTiming", "ROUTINE_SLOT_HEIGHT", compiled);
const slotHeight = 83;

test("added routine rows settle their height immediately, even while a previous shrink is running", () => {
  for (const [previous, next, currentHeight] of [[0, 1, 0], [1, 2, 83], [2, 3, 310]]) {
    const count = { current: previous };
    const height = { value: currentHeight };
    update(count, Array(next), height, () => assert.fail("Added rows must not animate height"), slotHeight);
    assert.equal(height.value, next * slotHeight);
    assert.equal(count.current, next);
  }
});

test("completing a row keeps the existing 350ms height animation", () => {
  const height: any = { value: 249 };
  update({ current: 3 }, Array(2), height, (target: number, options: object) => ({ target, ...options }), slotHeight);
  assert.deepEqual(height.value, { target: 166, duration: 350 });
});

test("an empty routine preserves the outgoing height, but its next addition does not animate", () => {
  const count = { current: 1 };
  const height = { value: 83 };
  const noAnimation = () => assert.fail("No height animation expected");
  update(count, [], height, noAnimation, slotHeight);
  assert.equal(height.value, 83);
  assert.equal(count.current, 0);
  update(count, [{}], height, noAnimation, slotHeight);
  assert.equal(height.value, 83);
});