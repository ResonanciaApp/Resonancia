import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../hooks/useAvatarPickerDismiss.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function setup(offset = 0) {
  const calls: any[] = [];
  const values: { value: any }[] = [];
  const refs: any[] = [];
  const states: any[] = [];
  const effects: any[][] = [];
  const completions: ((finished: boolean) => void)[] = [];
  let vi = 0, ri = 0, si = 0, ei = 0;
  let failed = false, active = false;
  const exports: any = {};
  function recognizer(kind: string) {
    const gesture: any = { kind, handlers: {}, config: {} };
    for (const key of ["enabled", "maxPointers", "manualActivation", "blocksExternalGesture"]) {
      gesture[key] = (value: unknown) => { gesture.config[key] = value; return gesture; };
    }
    for (const key of ["onTouchesDown", "onTouchesMove", "onStart", "onUpdate", "onEnd", "onFinalize"]) {
      gesture[key] = (fn: unknown) => { gesture.handlers[key] = fn; return gesture; };
    }
    return gesture;
  }
  const mocks: Record<string, any> = {
    react: {
      useMemo: (fn: () => unknown) => fn(),
      useCallback: (fn: unknown) => fn,
      useRef: (initial: unknown) => refs[ri++] ?? (refs[ri - 1] = { current: initial }),
      useState: (initial: unknown) => {
        const i = si++;
        if (!(i in states)) states[i] = initial;
        return [states[i], (next: unknown) => { states[i] = next; }];
      },
      useEffect: (fn: () => unknown, deps: unknown[]) => {
        const i = ei++;
        if (!effects[i] || deps.some((value, n) => value !== effects[i][n])) fn();
        effects[i] = deps;
      },
    },
    "react-native-gesture-handler": { Gesture: { Native: () => recognizer("native"), Pan: () => recognizer("pan") } },
    "react-native-reanimated": {
      useSharedValue: (initial: unknown) => values[vi++] ?? (values[vi - 1] = { value: initial }),
      useAnimatedStyle: (fn: () => unknown) => fn(),
      cancelAnimation: () => {},
      runOnJS: (fn: unknown) => fn,
      withSpring: (target: number) => { calls.push(["spring", target]); return target; },
      withTiming: (target: number, config: any, completed?: (ok: boolean) => void) => {
        calls.push(["timing", target, config.duration, values[0]?.value]);
        if (completed) completions.push(completed);
        return target;
      },
      Easing: { ease: () => {}, inOut: (fn: unknown) => fn },
    },
  };
  new Function("require", "exports", code)((id: string) => mocks[id], exports);
  const options = {
    visible: true, enabled: true, sheetHeight: 700, sheetTop: 100, gridTop: 300,
    scrollOffset: { value: offset }, onClose: () => calls.push("close"),
  };
  let controls: any;
  const render = () => {
    vi = ri = si = ei = 0;
    controls = exports.useAvatarPickerDismiss(options);
    return controls;
  };
  render();
  calls.length = 0;
  const manager = {
    fail: () => { failed = true; },
    activate: () => {
      if (!active && !failed) { active = true; controls.gesture.handlers.onStart(); }
    },
  };
  let startY = 500;
  const down = (pageY = 500) => {
    failed = !controls.gesture.config.enabled;
    active = false;
    startY = pageY;
    if (!failed) controls.gesture.handlers.onTouchesDown({ allTouches: [{ absoluteX: 50, absoluteY: pageY }] }, manager);
  };
  const move = (dy: number, dx = 0) => {
    if (failed) return;
    controls.gesture.handlers.onTouchesMove({ allTouches: [{ absoluteX: 50 + dx, absoluteY: startY + dy }] }, manager);
    if (active) controls.gesture.handlers.onUpdate({ translationY: dy });
  };
  const release = (dy: number, velocityY = 0) => {
    if (active && !failed) controls.gesture.handlers.onEnd({ translationY: dy, velocityY });
    controls.gesture.handlers.onFinalize();
  };
  return { options, values, states, calls, completions, render, down, move, release,
    cancel: () => controls.gesture.handlers.onFinalize(), failed: () => failed, controls };
}

test("native downward drag moves the same translation and dismisses on release", () => {
  const h = setup();
  assert.equal(h.controls.gesture.config.blocksExternalGesture, h.controls.gridGesture);
  h.down();
  h.move(20);
  assert.equal(h.values[0].value, 20);
  h.move(90);
  assert.equal(h.values[0].value, 90);
  h.release(90);
  assert.deepEqual(h.calls, ["close"]);
  h.options.visible = h.options.enabled = false;
  h.render();
  assert.deepEqual(h.calls[1], ["timing", 780, 500, 90]);
  h.completions[0](true);
  assert.equal(h.states[0], false);
});

test("scrolling the grid releases its native recognizer, while the header always permits dismissal", () => {
  const h = setup(90);
  h.down();
  assert.equal(h.failed(), true);
  h.down(200);
  h.move(90);
  h.release(90);
  assert.equal(h.calls.pop(), "close");
});

test("upward, horizontal and stationary touches do not dismiss or block normal list browsing", () => {
  const h = setup();
  h.down();
  h.release(0);
  assert.deepEqual(h.calls, []);
  h.down();
  h.move(-20);
  assert.equal(h.failed(), true);
  h.down();
  h.move(12, 40);
  assert.equal(h.failed(), true);
  assert.deepEqual(h.calls, []);
});

test("short swipes and interruptions spring back; a quick deliberate swipe dismisses", () => {
  const h = setup();
  h.down();
  h.move(30);
  h.release(30);
  assert.deepEqual(h.calls.pop(), ["spring", 0]);
  h.down();
  h.move(18);
  h.release(18, 700);
  assert.equal(h.calls.pop(), "close");
  h.down();
  h.move(25);
  h.cancel();
  assert.deepEqual(h.calls.pop(), ["spring", 0]);
});

test("disabled gestures and stale completion callbacks cannot close a newly opened sheet", () => {
  const h = setup();
  h.options.visible = h.options.enabled = false;
  h.render();
  h.down();
  assert.equal(h.failed(), true);
  h.options.visible = h.options.enabled = true;
  h.render();
  h.completions[0](true);
  assert.equal(h.states[0], true);
});

test("the gesture and its motion run on the UI thread without React touch-capture or per-frame bridges", () => {
  assert.doesNotMatch(source, /PanResponder|runOnJS\(.*setValue|\.runOnJS\(true\)/);
  assert.match(source, /onUpdate\(event => \{\s*sheetY.value = Math.max/);
  const page = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(page, /<GestureHandlerRootView style=\{styles.accountCoverModalRoot\}>/);
  assert.match(page, /<GestureDetector gesture=\{avatarPickerMotion.gesture\}>/);
  assert.match(page, /<GestureDetector gesture=\{avatarPickerMotion.gridGesture\}>\s*<Reanimated.FlatList/);
  assert.match(page, /styles.accountCoverSheet, avatarPickerMotion.sheetStyle/);
  assert.doesNotMatch(page, /onPress=\{closeAvatarPicker\}/);
});
