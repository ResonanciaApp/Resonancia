import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../hooks/useAvatarPickerDismiss.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function setup(offset = 0) {
  const calls: unknown[] = [];
  const exports: any = {};
  const options = {
    enabled: true, sheetTop: 100, gridTop: 300, scrollOffset: { value: offset },
    sheetY: { stopAnimation: () => calls.push("stop"), setValue: (value: number) => calls.push(value) },
    onClose: () => calls.push("close"),
  };
  const mocks: Record<string, unknown> = {
    react: { useMemo: (fn: () => unknown) => fn(), useRef: (value: unknown) => ({ current: value }) },
    "react-native": {
      PanResponder: { create: (handlers: unknown) => ({ panHandlers: handlers }) },
      Animated: { spring: (_: unknown, config: any) => ({ start: () => calls.push(["restore", config.toValue, config.useNativeDriver]) }) },
    },
    "./useGrowthJourneySheetMotion": { GROWTH_SHEET_SPRING: { tension: 55, friction: 8, useNativeDriver: true } },
  };
  new Function("require", "exports", code)((id: string) => mocks[id], exports);
  const controls = exports.useAvatarPickerDismiss(options);
  const pan = controls.panHandlers;
  const start = (pageY = 500) => pan.onStartShouldSetPanResponderCapture({ nativeEvent: { pageY } });
  const gesture = (dy: number, dx = 0, vy = 0) => ({ dy, dx, vy });
  return { controls, pan, calls, options, start, gesture };
}

test("downward drag closes at the top of the grid and follows the finger", () => {
  const h = setup();
  assert.equal(h.start(), false);
  assert.equal(h.pan.onMoveShouldSetPanResponderCapture(null, h.gesture(20)), true);
  h.pan.onPanResponderGrant();
  h.pan.onPanResponderMove(null, h.gesture(80));
  h.pan.onPanResponderRelease(null, h.gesture(80));
  assert.deepEqual(h.calls, ["stop", 80, "close"]);
});

test("grid scrolling and horizontal or upward movement do not become dismissal gestures", () => {
  const h = setup(90);
  h.start();
  assert.equal(h.pan.onMoveShouldSetPanResponderCapture(null, h.gesture(80)), false);
  h.start(200); // Header remains draggable even with a scrolled grid.
  assert.equal(h.pan.onMoveShouldSetPanResponderCapture(null, h.gesture(80)), true);
  assert.equal(h.pan.onMoveShouldSetPanResponderCapture(null, h.gesture(-80)), false);
  assert.equal(h.pan.onMoveShouldSetPanResponderCapture(null, h.gesture(20, 60)), false);
});

test("short drag springs back, fast intentional swipe closes, and cancelled drag restores", () => {
  const h = setup();
  h.start();
  h.pan.onPanResponderRelease(null, h.gesture(30));
  assert.deepEqual(h.calls.pop(), ["restore", 0, true]);
  h.pan.onPanResponderRelease(null, h.gesture(18, 0, 0.7));
  assert.equal(h.calls.pop(), "close");
  h.pan.onPanResponderTerminate();
  assert.deepEqual(h.calls.pop(), ["restore", 0, true]);
});

test("blank taps close, but a drag does not also fire a tap; nested windows block closing", () => {
  const h = setup();
  h.start();
  h.controls.onBlankPress();
  assert.equal(h.calls.pop(), "close");
  h.pan.onPanResponderGrant();
  h.calls.length = 0;
  h.controls.onBlankPress();
  assert.equal(h.calls.length, 0);
  h.options.enabled = false;
  h.start();
  h.controls.onBlankPress();
  h.pan.onPanResponderTerminate();
  assert.equal(h.pan.onMoveShouldSetPanResponderCapture(null, h.gesture(80)), false);
  assert.equal(h.calls.length, 0);
});
