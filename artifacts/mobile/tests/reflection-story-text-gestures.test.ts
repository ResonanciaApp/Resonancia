import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import * as logic from "../lib/reflection-story-logic.ts";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../components/ReflectionShare.tsx", import.meta.url), "utf8");

function fixture() {
  const groups: any[] = [];
  const commits: any[] = [];
  const animatedStyles: Array<() => any> = [];
  function gesture(kind: string) {
    const callbacks: any = {};
    const options: any = {};
    const result: any = { kind, callbacks, options };
    for (const key of ["minPointers", "maxPointers", "minDistance", "averageTouches"]) {
      result[key] = (value: any) => { options[key] = value; return result; };
    }
    for (const key of ["onBegin", "onUpdate", "onFinalize"]) {
      result[key] = (callback: any) => { callbacks[key] = callback; return result; };
    }
    return result;
  }
  const environment: any = {
    React: require("react"),
    View: "view", Text: "text", Image: "image", GestureDetector: "gesture-detector",
    Animated: { View: "animated-view" },
    Gesture: {
      Pan: () => gesture("pan"), Pinch: () => gesture("pinch"),
      Simultaneous: (...gestures: any[]) => { groups.push(gestures); return gestures; },
    },
    StyleSheet: { absoluteFillObject: {} }, styles: {},
    useSharedValue: (value: number) => ({ value }),
    useEffect: (callback: any) => callback(),
    useMemo: (callback: any) => callback(),
    useAnimatedStyle: (callback: any) => { animatedStyles.push(callback); return {}; },
    runOnJS: (callback: any) => callback,
    STORY_WIDTH: 1080, STORY_QUOTE_TOP: 610, STORY_QUOTE_HEIGHT: 700,
    ...logic,
  };
  const functionSource = source.slice(
    source.indexOf("function InteractiveReflectionArtwork"),
    source.indexOf("export function ReflectionShare"),
  );
  const compiled = ts.transpileModule(functionSource, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const component = new Function(...Object.keys(environment), compiled + "\nreturn InteractiveReflectionArtwork;")(
    ...Object.values(environment),
  );
  component({
    reflection: { message: "Mi reflexión" }, width: 1080,
    composition: logic.DEFAULT_REFLECTION_STORY_COMPOSITION,
    avatarPosition: logic.DEFAULT_REFLECTION_STORY_AVATAR_POSITION,
    onCompositionChange: (value: any) => commits.push(value),
  });
  const text = groups.find(group => group[0].options.maxPointers === 2);
  return { pan: text[0], pinch: text[1], commits, textStyle: animatedStyles[2] };
}

test("Two-finger zoom and drag update only the text and cannot shrink below its initial size", () => {
  const f = fixture();
  f.pinch.callbacks.onBegin();
  f.pinch.callbacks.onUpdate({ scale: 2 });
  f.pan.callbacks.onBegin();
  f.pan.callbacks.onUpdate({ translationX: 60, translationY: 180 });
  f.pan.callbacks.onFinalize();
  assert.deepEqual(f.commits.at(-1), {
    ...logic.DEFAULT_REFLECTION_STORY_COMPOSITION,
    textScale: 2, textX: 60 / 1080, textY: 180 / 1920,
  });
  assert.deepEqual(f.textStyle().transform, [
    { translateX: 60 }, { translateY: 180 }, { scale: 2 },
  ]);
  f.pinch.callbacks.onBegin();
  f.pinch.callbacks.onUpdate({ scale: 0.1 });
  f.pinch.callbacks.onFinalize();
  assert.equal(f.commits.at(-1).textScale, 1);
  assert.equal(f.commits.at(-1).backgroundScale, 1);
  assert.equal(f.pan.options.averageTouches, true);
});

test("Consecutive zooms start from the current text size; reset and legacy recipes use size 1", () => {
  const f = fixture();
  for (const scale of [1.5, 1.5]) {
    f.pinch.callbacks.onBegin();
    f.pinch.callbacks.onUpdate({ scale });
    f.pinch.callbacks.onFinalize();
  }
  assert.equal(f.commits.at(-1).textScale, 2.25);
  assert.equal(logic.clampReflectionStoryComposition({ backgroundScale: 1, backgroundX: 0, backgroundY: 0, textX: 0, textY: 0 }).textScale, 1);
  assert.equal(logic.DEFAULT_REFLECTION_STORY_COMPOSITION.textScale, 1);
  const artwork = readFileSync(new URL("../components/StoryArtworkFrame.tsx", import.meta.url), "utf8");
  assert.match(artwork, /scale: composition\.textScale \?\? 1/);
  assert.match(source, /textScale: composition\.textScale \?\? 1/);
  assert.match(source, /\(composition\.textScale \?\? 1\)\.toFixed\(4\)/);
  const avatar = readFileSync(new URL("../components/StoryAvatarLayer.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(avatar, /Gesture\.Pinch|textScale/);
});
