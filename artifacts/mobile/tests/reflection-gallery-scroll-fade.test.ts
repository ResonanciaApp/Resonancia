import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync("components/ReflectionShare.tsx", "utf8");
const ast = ts.createSourceFile("ReflectionShare.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function initializer(name: string) {
  let value: string | undefined;
  function walk(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name && node.initializer) {
      value = node.initializer.getText(ast);
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
  assert.ok(value, `Missing ${name}`);
  return value;
}

function mount() {
  const timings: { to: number; duration: number; reduceMotion: string }[] = [];
  let reaction: ((active: number, previous: number) => void) | undefined;
  let activityValue = 0;
  let pending: { delay: number; next: number } | undefined;
  const activity = {
    get value() { return activityValue; },
    set value(value: any) {
      if (typeof value === "object") {
        pending = value;
        return;
      }
      const previous = activityValue;
      activityValue = value;
      if (value !== previous) reaction?.(value, previous);
    },
  };
  const context = {
    galleryScrollOpacity: runInNewContext(initializer("galleryScrollOpacity"), {
      useSharedValue: (value: number) => ({ value }),
    }),
    galleryScrollOffset: { value: 0 },
    galleryScrollActivity: activity,
    galleryContentHeight: { value: 1000 },
    galleryViewport: { value: 200 },
    useAnimatedScrollHandler: (handlers: unknown) => handlers,
    useAnimatedStyle: (getStyle: unknown) => getStyle,
    useAnimatedReaction: (_prepare: unknown, callback: typeof reaction) => { reaction = callback; },
    cancelAnimation: (value: unknown) => { if (value === activity) pending = undefined; },
    ReduceMotion: { System: "system", Never: "never" },
    withTiming: (to: number, config: { duration: number; reduceMotion: string }) => {
      timings.push({ to, ...config });
      return to;
    },
    withDelay: (delay: number, next: number, reduceMotion: string) => {
      assert.equal(reduceMotion, "never", "accessibility settings must not skip the inactivity debounce");
      return { delay, next };
    },
  };
  let reactionCall: string | undefined;
  function findReaction(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === "useAnimatedReaction") {
      reactionCall = node.getText(ast);
    }
    ts.forEachChild(node, findReaction);
  }
  findReaction(ast);
  assert.ok(reactionCall);
  runInNewContext(reactionCall, context);
  const handler = runInNewContext(initializer("galleryScrollHandler"), context);
  const style = runInNewContext(initializer("galleryScrollTrackStyle"), context);
  const stopMoving = () => {
    assert.ok(pending, "scroll activity has scheduled an inactivity check");
    assert.equal(pending.delay, 120);
    const next = pending.next;
    pending = undefined;
    activity.value = next;
  };
  return { context, handler, style, timings, stopMoving, hasPending: () => Boolean(pending) };
}

test("indicator is hidden at rest, fades in on movement and out when scrolling stops", () => {
  const { handler, style, timings, stopMoving, hasPending } = mount();
  assert.equal(style().opacity, 0);
  handler.onScroll({ contentOffset: { y: 0 } });
  assert.equal(style().opacity, 0);
  assert.equal(hasPending(), false, "initial layout events do not show the indicator");
  handler.onScroll({ contentOffset: { y: 30 } });
  assert.equal(style().opacity, 1);
  stopMoving();
  assert.equal(style().opacity, 0);
  const fades = timings.filter(item => item.duration > 0);
  assert.deepEqual(fades.map(item => item.to), [1, 0]);
  assert.deepEqual(fades.map(item => item.duration), [160, 240]);
  assert.ok(timings.every(item => item.reduceMotion === "system"));
});

test("inertia keeps the indicator visible after finger release and updates thumb until scrolling ends", () => {
  const { context, handler, style, timings, stopMoving } = mount();
  handler.onScroll({ contentOffset: { y: 80 } });
  assert.equal(handler.onEndDrag, undefined, "lifting the finger no longer hides the moving indicator");
  handler.onScroll({ contentOffset: { y: 130 } });
  assert.equal(context.galleryScrollOffset.value, 130);
  assert.equal(style().opacity, 1);
  handler.onScroll({ contentOffset: { y: 160 } });
  assert.equal(style().opacity, 1);
  assert.equal(timings.filter(item => item.to === 1).length, 1, "scroll events do not restart the fade-in");
  handler.onMomentumEnd();
  assert.equal(style().opacity, 0);
  handler.onScroll({ contentOffset: { y: 170 } });
  assert.equal(style().opacity, 1);
  stopMoving();
  assert.equal(style().opacity, 0);
});

test("short and resized galleries never show an unnecessary scrollbar", () => {
  const { context, handler, style, stopMoving } = mount();
  context.galleryContentHeight.value = 150;
  handler.onScroll({ contentOffset: { y: 10 } });
  assert.equal(style().opacity, 0);
  context.galleryContentHeight.value = 1000;
  assert.equal(style().opacity, 1);
  context.galleryViewport.value = 1200;
  assert.equal(style().opacity, 0);
  stopMoving();
  context.galleryViewport.value = 200;
  assert.equal(style().opacity, 0);
});

test("only the upper avatar control has a 45% excluded or 15% included black overlay; capture avatar is unchanged", () => {
  const declaration = source.slice(source.indexOf("headerRightAction="), source.indexOf("renderArtwork={(width"));
  assert.match(declaration, /source=\{currentAvatarSource\}/);
  assert.match(declaration, /backgroundColor: includedAvatar \? "rgba\(0,0,0,0\.15\)" : "rgba\(0,0,0,0\.45\)"/);
  assert.doesNotMatch(declaration, /opacity: includedAvatar/);
  for (const includedAvatar of [undefined, { uri: "avatar.webp" }]) {
    assert.equal(runInNewContext('includedAvatar ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.45)"', { includedAvatar }),
      includedAvatar ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.45)");
  }
  const avatarLayer = readFileSync("components/StoryAvatar.tsx", "utf8");
  assert.doesNotMatch(avatarLayer, /opacity/);
  assert.match(source, /useEffect\(\(\) => \(\) => \{\s*cancelAnimation\(galleryScrollOpacity\);\s*cancelAnimation\(galleryScrollActivity\)/);
});

test("a stationary finger or programmatic scroll uses actual movement, not touch events", () => {
  const { handler, style, stopMoving, hasPending } = mount();
  assert.equal(handler.onBeginDrag, undefined);
  handler.onScroll({ contentOffset: { y: 42 } });
  assert.equal(style().opacity, 1);
  stopMoving();
  handler.onScroll({ contentOffset: { y: 42 } });
  assert.equal(style().opacity, 0);
  assert.equal(hasPending(), false);
  handler.onScroll({ contentOffset: { y: 100 } });
  assert.equal(style().opacity, 1);
  handler.onMomentumEnd();
  assert.equal(hasPending(), false, "momentum end cancels the idle check");
  assert.equal(style().opacity, 0);
});
