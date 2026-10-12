import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync("components/ScrollProgressIndicator.tsx", "utf8");
const ast = ts.createSourceFile("progress.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function mount() {
  let effect: (() => () => void) | undefined;
  let reaction: ((active: number, previous: number) => void) | undefined;
  let pending: { delay: number; next: number } | undefined;
  let activity: any;
  let value = 0;
  let count = 0;
  const timings: any[] = [];
  const context = {
    module: { exports: {} as any },
    exports: {} as any,
    require: (name: string) => {
      if (name === "react") return { useEffect: (callback: () => () => void) => { effect = callback; } };
      if (name === "react-native") return { StyleSheet: { create: (styles: any) => styles } };
      if (name === "react-native-reanimated") return {
        ReduceMotion: { System: "system", Never: "never" },
        useSharedValue: (initial: number) => {
          if (count++ !== 3) return { value: initial };
          activity = {
            get value() { return value; },
            set value(next: any) {
              if (typeof next === "object") { pending = next; return; }
              const previous = value;
              value = next;
              if (previous !== next) reaction?.(next, previous);
            },
          };
          return activity;
        },
        cancelAnimation: (shared: any) => { if (shared === activity) pending = undefined; },
        useAnimatedReaction: (_prepare: any, callback: typeof reaction) => { reaction = callback; },
        useAnimatedScrollHandler: (handlers: any) => handlers,
        useAnimatedStyle: (getStyle: any) => getStyle,
        withTiming: (to: number, config: any) => { timings.push({ to, ...config }); return to; },
        withDelay: (delay: number, next: number, reduceMotion: string) => {
          assert.equal(reduceMotion, "never");
          return { delay, next };
        },
      };
      if (name === "@/lib/reflection-gallery-layout") return {
        reflectionGalleryScrollIndicator: (viewport: number, content: number, offset: number) => {
          if (content <= viewport) return { height: 0, translateY: 0 };
          const height = Math.min(viewport, Math.max(18, viewport * viewport / content));
          return { height, translateY: (viewport - height) * Math.min(1, Math.max(0, offset / (content - viewport))) };
        },
      };
      throw new Error(name);
    },
  };
  context.exports = context.module.exports;
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText, context);
  const progress = context.module.exports.useScrollProgress(true);
  const cleanup = effect!();
  progress.onLayout({ nativeEvent: { layout: { height: 200 } } });
  progress.onContentSizeChange(350, 1000);
  return {
    progress, timings, cleanup,
    idle: () => { assert.equal(pending?.delay, 120); const next = pending!.next; pending = undefined; activity.value = next; },
    pending: () => pending,
  };
}

test("cover progress fades in only on movement, remains through inertia, then fades out at rest", () => {
  const { progress, timings, idle, pending } = mount();
  assert.equal(progress.trackStyle().opacity, 0);
  progress.onScroll.onScroll({ contentOffset: { y: 80 } });
  assert.equal(progress.trackStyle().opacity, 1);
  assert.equal(progress.onScroll.onEndDrag, undefined);
  progress.onScroll.onScroll({ contentOffset: { y: 160 } });
  assert.equal(progress.trackStyle().opacity, 1);
  assert.equal(timings.filter(t => t.to === 1).length, 1);
  assert.equal(progress.thumbStyle().height, 40);
  assert.equal(progress.thumbStyle().transform[0].translateY, 32);
  idle();
  assert.equal(progress.trackStyle().opacity, 0);
  assert.equal(timings.at(-1).duration, 240);
  progress.onScroll.onScroll({ contentOffset: { y: 160 } });
  assert.equal(pending(), undefined, "same-offset events must not show a stationary indicator");
  progress.onScroll.onScroll({ contentOffset: { y: 200 } });
  progress.onScroll.onMomentumEnd();
  assert.equal(pending(), undefined);
  assert.equal(progress.trackStyle().opacity, 0);
});

test("short or resized grids hide the track and bounce keeps the thumb clamped", () => {
  const { progress, cleanup, pending } = mount();
  progress.onScroll.onScroll({ contentOffset: { y: 1100 } });
  assert.equal(progress.thumbStyle().transform[0].translateY, 160);
  progress.onScroll.onScroll({ contentOffset: { y: -20 } });
  assert.equal(progress.thumbStyle().transform[0].translateY, 0);
  progress.onContentSizeChange(350, 150);
  assert.equal(progress.trackStyle().opacity, 0);
  progress.onContentSizeChange(350, 1000);
  progress.onLayout({ nativeEvent: { layout: { height: 1200 } } });
  assert.equal(progress.trackStyle().opacity, 0);
  cleanup();
  assert.equal(pending(), undefined);
});

test("mix, playlist and avatar grids wire all movement and measurement callbacks without changing selection", () => {
  for (const [file, hookName] of [
    ["app/mi-mezcla/[id].tsx", "coverScrollProgress"],
    ["app/playlist/[id].tsx", "coverScrollProgress"],
    ["components/ProfileScreenBase.tsx", "avatarScrollProgress"],
  ]) {
    const text = readFileSync(file, "utf8");
    const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let list: ts.JsxSelfClosingElement | undefined;
    function visit(node: ts.Node) {
      if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(tree).endsWith(".FlatList")) list = node;
      ts.forEachChild(node, visit);
    }
    visit(tree);
    assert.ok(list, file);
    const attrs = list.attributes.getText(tree);
    for (const name of ["onScroll", "onLayout", "onContentSizeChange"]) {
      assert.ok(attrs.includes(`${name}={${hookName}.${name}}`), `${file}: ${name}`);
    }
    assert.match(attrs, /scrollEventThrottle=\{16\}/);
    assert.match(attrs, /showsVerticalScrollIndicator=\{false\}/);
    assert.ok(text.includes(`<ScrollProgressIndicator progress={${hookName}} />`));
    assert.match(attrs, /numColumns=\{5\}/);
    if (hookName === "avatarScrollProgress") {
      assert.match(attrs, /<AvatarCoverCell preset=\{preset\} selected=\{selected\} locked=\{locked\}/);
      const cell = text.slice(text.indexOf("const AvatarCoverCell ="), text.indexOf("function resizeImageForWeb"));
      assert.match(cell, /accessibilityState=\{\{ selected, disabled \}\}/);
      assert.match(cell, /onPress=\{\(\) => onSelect\(preset\)\}/);
    } else {
      assert.match(attrs, /accessibilityState=\{\{ selected/);
    }
  }
  assert.match(source, /pointerEvents="none"/);
  assert.match(source, /rgba\(249,249,249,0\.13\)/);
  assert.match(source, /rgba\(249,249,249,0\.75\)/);
});
