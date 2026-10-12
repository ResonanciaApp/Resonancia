import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../hooks/useAvatarPickerDismiss.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function setup(offset = 0, deferJS = false, showNativeModal = true) {
  const calls: any[] = [];
  const springs: any[] = [];
  const jsTasks: (() => void)[] = [];
  const values: { value: any }[] = [];
  const refs: any[] = [];
  const states: any[] = [];
  const effects: any[][] = [];
  const memos: { deps: any[]; value: any }[] = [];
  let mi = 0;
  const memo = (fn: () => any, deps: any[]) => {
    const index = mi++;
    if (!memos[index] || deps.some((dep, i) => dep !== memos[index].deps[i])) {
      memos[index] = { deps, value: fn() };
    }
    return memos[index].value;
  };
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
    "@/hooks/useDrawerDiagnostics": { drawerDiagnosticEvent: () => {} },
    react: {
      useMemo: memo,
      useCallback: (fn: any, deps: any[]) => memo(() => fn, deps),
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
      runOnUI: (fn: any) => fn,
      runOnJS: (fn: (...args: any[]) => void) => (...args: any[]) => {
        if (deferJS) jsTasks.push(() => fn(...args));
        else fn(...args);
      },
      withSpring: (target: number, config: any, completed?: (ok: boolean) => void) => {
        calls.push(["spring", target]);
        springs.push({ target, from: values[0]?.value, config });
        if (completed) completions.push(completed);
        return target;
      },
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
    vi = ri = si = ei = mi = 0;
    controls = exports.useAvatarPickerDismiss(options);
    return controls;
  };
  render();
  if (showNativeModal) {
    controls.onShow();
    completions.splice(0).forEach(fn => fn(true));
    jsTasks.splice(0).forEach(fn => fn());
  }
  calls.length = 0;
  springs.length = 0;
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
  return { options, values, states, calls, springs, completions, render, down, move, release,
    jsTasks, flushJS: () => jsTasks.splice(0).forEach(fn => fn()),
    completeExit: () => { completions[0](true); completions[1](true); },
    cancel: () => controls.gesture.handlers.onFinalize(), failed: () => failed, controls };
}

test("tap close uses timer timings without changing React state until both animations finish", () => {
  const h = setup(0, true);
  const before = [...h.states];
  h.controls.dismiss();
  assert.deepEqual(h.calls, [["timing", 780, 500, 0], ["timing", 0, 460, 780]]);
  assert.deepEqual(h.states, before, "keep the grid and opened configuration stable during exit");
  h.controls.dismiss();
  assert.equal(h.calls.length, 2, "repeated taps cannot restart the exit");
  h.completions[0](true);
  assert.equal(h.jsTasks.length, 0);
  h.completions[1](true);
  assert.equal(h.jsTasks.length, 1);
  h.flushJS();
  assert.equal(h.calls.at(-1), "close");
  h.options.visible = h.options.enabled = false;
  const count = h.calls.length;
  h.render();
  assert.equal(h.calls.length, count, "do not replay a completed close");
  assert.equal(h.states[0], false);
});

test("native downward drag continues immediately; React dismisses only after motion and fade finish", () => {
  const h = setup();
  assert.equal(h.controls.gesture.config.blocksExternalGesture, h.controls.gridGesture);
  h.down();
  h.move(20);
  assert.equal(h.values[0].value, 20);
  h.move(90);
  assert.equal(h.values[0].value, 90);
  h.release(90, 900);
  assert.deepEqual(h.calls, [["spring", 780], ["timing", 0, 460, 780]]);
  assert.equal(h.springs[0].from, 90);
  assert.equal(h.springs[0].config.velocity, 900);
  h.completions[0](true);
  assert.equal(h.calls.includes("close"), false);
  h.completions[1](true);
  assert.equal(h.calls.at(-1), "close");
  const callsBeforeRender = h.calls.length;
  h.options.visible = h.options.enabled = false;
  h.render();
  assert.equal(h.calls.length, callsBeforeRender, "React must not start a second exit");
  assert.equal(h.states[0], false);
});

test("opening waits for native presentation and exposes readiness only after completion", () => {
  const h = setup(0, false, false);
  assert.equal(h.values[0].value, 780);
  assert.equal(h.states[1], false);
  assert.equal(h.calls.length, 0);
  h.controls.onShow();
  assert.deepEqual(h.calls[0], ["spring", 0]);
  assert.equal(h.states[1], false);
  h.completions[0](true);
  assert.equal(h.states[1], true);
});

test("scrolling the grid releases its native recognizer, while the header always permits dismissal", () => {
  const h = setup(90);
  h.down();
  assert.equal(h.failed(), true);
  h.down(200);
  h.move(90);
  h.release(90);
  h.completeExit();
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
  h.completeExit();
  assert.equal(h.calls.pop(), "close");
  const interrupted = setup();
  interrupted.down();
  interrupted.move(25);
  interrupted.cancel();
  assert.deepEqual(interrupted.calls.pop(), ["spring", 0]);
});

test("a busy JS thread cannot delay the continuation at finger release", () => {
  const h = setup(0, true);
  h.down(200);
  h.move(150);
  h.release(150, 1200);
  assert.equal(h.springs[0].from, 150);
  assert.equal(h.springs[0].config.velocity, 1200);
  assert.equal(h.jsTasks.length, 0, "no JS work is needed to start closing");
  h.completeExit();
  assert.equal(h.jsTasks.length, 1, "React is notified only after both animations");
  assert.equal(h.calls.includes("close"), false);
  h.flushJS();
  assert.equal(h.calls.at(-1), "close");
});

test("a second touch during exit cannot interrupt or restart it", () => {
  const h = setup();
  h.down(200);
  h.move(100);
  h.release(100, 600);
  const motionCount = h.calls.length;
  h.down(200);
  assert.equal(h.failed(), true);
  h.move(100);
  h.release(100);
  assert.equal(h.calls.length, motionCount);
  h.completeExit();
  assert.equal(h.calls.filter(call => call === "close").length, 1);
});

test("programmatic dismissal still animates and cancelled gesture completion never dismisses", () => {
  const h = setup();
  h.down();
  h.move(100);
  h.release(100);
  h.completions[0](false);
  h.completions[1](false);
  assert.equal(h.calls.includes("close"), false);
  h.options.visible = h.options.enabled = false;
  h.render();
  assert.equal(h.calls.some(call => call[0] === "timing" && call[2] === 500), true);
  h.completions[2](true);
  assert.equal(h.states[0], false);
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
  assert.match(source, /onUpdate\(event => \{[\s\S]*?sheetY.value = Math.max/);
  const page = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(page, /<GestureHandlerRootView style=\{styles.accountCoverModalRoot\}>/);
  assert.match(page, /<GestureDetector gesture=\{avatarPickerMotion.gesture\}>/);
  assert.match(page, /<GestureDetector gesture=\{avatarPickerMotion.gridGesture\}>\s*<Reanimated.FlatList/);
  assert.match(page, /styles.accountCoverSheet, avatarPickerMotion.sheetStyle/);
  assert.doesNotMatch(page, /onPress=\{closeAvatarPicker\}/);
});
