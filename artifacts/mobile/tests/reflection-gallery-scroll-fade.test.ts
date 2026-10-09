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
  const context = {
    galleryScrollOpacity: runInNewContext(initializer("galleryScrollOpacity"), {
      useSharedValue: (value: number) => ({ value }),
    }),
    galleryScrollOffset: { value: 0 },
    galleryContentHeight: { value: 1000 },
    galleryViewport: { value: 200 },
    useAnimatedScrollHandler: (handlers: unknown) => handlers,
    useAnimatedStyle: (getStyle: unknown) => getStyle,
    ReduceMotion: { System: "system" },
    withTiming: (to: number, config: { duration: number; reduceMotion: string }) => {
      timings.push({ to, ...config });
      return to;
    },
  };
  const handler = runInNewContext(initializer("galleryScrollHandler"), context);
  const style = runInNewContext(initializer("galleryScrollTrackStyle"), context);
  return { context, handler, style, timings };
}

test("indicator is hidden at rest, fades in on drag and out on release", () => {
  const { handler, style, timings } = mount();
  assert.equal(style().opacity, 0);
  handler.onBeginDrag();
  assert.equal(style().opacity, 1);
  handler.onEndDrag();
  assert.equal(style().opacity, 0);
  assert.deepEqual(timings.map(item => item.to), [1, 0]);
  assert.ok(timings.every(item => item.duration > 0 && item.reduceMotion === "system"));
});

test("inertia updates thumb position without bringing the indicator back", () => {
  const { context, handler, style, timings } = mount();
  handler.onBeginDrag();
  handler.onScroll({ contentOffset: { y: 80 } });
  handler.onEndDrag();
  handler.onScroll({ contentOffset: { y: 130 } });
  assert.equal(context.galleryScrollOffset.value, 130);
  assert.equal(style().opacity, 0);
  assert.equal(timings.length, 2);
  handler.onBeginDrag();
  assert.equal(style().opacity, 1);
  handler.onEndDrag();
  assert.equal(style().opacity, 0);
});

test("short and resized galleries never show an unnecessary scrollbar", () => {
  const { context, handler, style } = mount();
  context.galleryContentHeight.value = 150;
  handler.onBeginDrag();
  assert.equal(style().opacity, 0);
  context.galleryContentHeight.value = 1000;
  assert.equal(style().opacity, 1);
  context.galleryViewport.value = 1200;
  assert.equal(style().opacity, 0);
  handler.onEndDrag();
  context.galleryViewport.value = 200;
  assert.equal(style().opacity, 0);
});

test("only the upper avatar control dims when excluded; capture avatar is unchanged", () => {
  const declaration = source.slice(source.indexOf("headerRightAction="), source.indexOf("renderArtwork={(width"));
  assert.match(declaration, /source=\{currentAvatarSource\}/);
  assert.match(declaration, /opacity: includedAvatar \? 1 : 0\.8/);
  for (const includedAvatar of [undefined, { uri: "avatar.webp" }]) {
    assert.equal(runInNewContext("includedAvatar ? 1 : 0.8", { includedAvatar }), includedAvatar ? 1 : 0.8);
  }
  const avatarLayer = readFileSync("components/StoryAvatar.tsx", "utf8");
  assert.doesNotMatch(avatarLayer, /opacity/);
  assert.match(source, /useEffect\(\(\) => \(\) => cancelAnimation\(galleryScrollOpacity\)/);
});
