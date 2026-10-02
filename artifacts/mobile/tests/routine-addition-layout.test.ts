import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../components/MiRutinaSection.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("MiRutinaSection.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effect: ts.Expression | undefined;
let reaction: ts.CallExpression | undefined;
function visit(node: ts.Node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === "useEffect"
    && node.arguments[0]?.getText(ast).includes("previousActivityCount.current")) {
    effect = node.arguments[0];
  }
  if (ts.isCallExpression(node) && node.expression.getText(ast) === "useAnimatedReaction"
    && node.arguments[0]?.getText(ast).includes("effectiveSlot")) {
    reaction = node;
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(effect);
assert.ok(reaction);
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

function rowHarness(order: string[], activityId: string, initialIndex: number) {
  const sharedOrder = { value: order };
  const settledY = { value: initialIndex * slotHeight };
  const animations: { target: number; duration: number }[] = [];
  const bindings: Record<string, unknown> = {
    sharedOrder, activityId, initialIndex,
    sharedDragOriginSlot: { value: -1 }, sharedInsertAt: { value: -1 },
    sharedDraggingId: { value: "" }, settledY,
    ROUTINE_SLOT_HEIGHT: slotHeight,
    withTiming: (target: number, options: { duration: number }) => {
      animations.push({ target, duration: options.duration });
      return target;
    },
  };
  const build = (expression: ts.Expression) => new Function(...Object.keys(bindings),
    ts.transpileModule(`return (${expression.getText(ast)});`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText)(...Object.values(bindings));
  return {
    prepare: build(reaction!.arguments[0]),
    react: build(reaction!.arguments[1]),
    sharedOrder, settledY, animations,
  };
}

test("a newly inserted card never moves up to the first slot while its shared order catches up", () => {
  const h = rowHarness(["first", "second"], "new", 2);
  const inserted = h.prepare();
  assert.equal(inserted.target, 166);
  h.react(inserted, null);
  assert.equal(h.settledY.value, 166);
  assert.equal(h.animations.length, 0);
  h.sharedOrder.value = ["first", "second", "new"];
  h.react(h.prepare(), inserted);
  assert.equal(h.settledY.value, 166);
  assert.equal(h.animations.length, 0);
});

test("insertion leaves existing cards anchored and adds space only below them", () => {
  const h = rowHarness(["first", "second"], "second", 1);
  const before = h.prepare();
  h.react(before, null);
  h.sharedOrder.value = ["first", "second", "new"];
  h.react(h.prepare(), before);
  assert.equal(h.settledY.value, 83);
  assert.equal(h.animations.length, 0);
});

test("real slot changes still use the existing 180ms drag/reorder animation", () => {
  const h = rowHarness(["first", "second"], "first", 0);
  const before = h.prepare();
  h.react(before, null);
  h.sharedOrder.value = ["second", "first"];
  h.react(h.prepare(), before);
  assert.deepEqual(h.animations, [{ target: 83, duration: 180 }]);
});