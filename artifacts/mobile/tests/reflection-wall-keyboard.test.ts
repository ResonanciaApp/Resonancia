import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import * as JSXRuntime from "react/jsx-runtime";
import ts from "typescript";

const source = readFileSync(new URL("../components/HomeReflectionWallSection.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

function fixture(measureResponds = true, layoutReady = true) {
  let focus = 0;
  let composing = false;
  let scrollY = 0;
  let requestedY: number | undefined;
  let scrollRequests = 0;
  let stateIndex = 0;
  let nextId = 1;
  const frames = new Map<number, () => void>();
  const timers = new Map<number, { callback: () => void; delay: number }>();
  const cleanup: (() => void)[] = [];
  const hooks = {
    ...React,
    forwardRef: (render: unknown) => ({ render }),
    useRef: (initial: unknown) => ({ current: initial }),
    useState: (initial: unknown) => {
      const index = stateIndex++;
      return [index === 0 ? layoutReady : initial, (update: any) => {
        if (index === 1) focus = typeof update === "function" ? update(focus) : update;
      }];
    },
    useCallback: (callback: unknown) => callback,
    useEffect: (callback: () => (() => void) | void) => { const dispose = callback(); if (dispose) cleanup.push(dispose); },
    useImperativeHandle: (ref: any, create: () => unknown) => { ref.current = create(); },
  };
  const mocks: Record<string, unknown> = {
    react: hooks,
    "react/jsx-runtime": JSXRuntime,
    "react-native": {
      Platform: { OS: "ios" },
      Keyboard: { addListener: () => ({ remove() {} }), isVisible: () => false },
      View: "section", ScrollView: "scroll",
    },
    "expo-router": { useFocusEffect: () => {} },
    "@/components/InnerSpaceCard": { InnerSpaceCard: "composer", INNER_SPACE_CARD_BOTTOM_MARGIN: 32 },
    "@/context/DrawerContext": { useDrawerDestinations: () => ({ wallComposeRequest: null, consumeWallComposeRequest() {} }) },
  };
  const loaded = { exports: {} as any };
  new Function("require", "module", "exports", "requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "clearTimeout", compiled)(
    (name: string) => { assert.ok(name in mocks, name); return mocks[name]; },
    loaded, loaded.exports,
    (callback: () => void) => { const id = nextId++; frames.set(id, callback); return id; },
    (id: number) => frames.delete(id),
    (callback: () => void, delay: number) => { const id = nextId++; timers.set(id, { callback, delay }); return id; },
    (id: number) => timers.delete(id),
  );
  const handle = { current: null as any };
  const element = loaded.exports.HomeReflectionWallSection.render({
    scrollRef: { current: {
      getNativeScrollRef: () => ({ measureInWindow: (cb: Function) => cb(0, 0, 402, 800) }),
       scrollTo: ({ y }: { y: number }) => { requestedY = y; scrollRequests++; },
    } },
    getScrollY: () => scrollY,
    onComposingChange: (value: boolean) => { composing = value; },
    onMessageSaved() {},
    canonicalVerticalInsets: true,
  }, handle);
  element.props.ref.current = { measureInWindow: (cb: Function) => { if (measureResponds) cb(0, 300, 402, 300); } };
  const runFrames = () => {
    for (let i = 0; i < 2; i++) {
      const pending = [...frames.entries()];
      frames.clear();
      pending.forEach(([, callback]) => callback());
    }
  };
  const fireTimers = (delay: number) => {
    for (const [id, timer] of [...timers]) if (timer.delay === delay) {
      timers.delete(id);
      timer.callback();
    }
  };
  return {
    request: element.props.children.props.onComposeRequested,
    handle,
    runFrames, fireTimers,
    finishScroll: () => { scrollY = requestedY!; handle.current.finishPendingScroll(); },
    scrollToY: (y: number, ended = false) => {
      scrollY = y;
      handle.current.finishPendingScroll(ended);
    },
    dispose: () => cleanup.forEach(callback => callback()),
    get focus() { return focus; },
    get composing() { return composing; },
    get requestedY() { return requestedY; },
    get scrollRequests() { return scrollRequests; },
  };
}

test("a field tap schedules composition without waiting for unrelated animations and focuses after scroll completion", () => {
  const f = fixture();
  f.request();
  assert.equal(f.composing, true);
  assert.equal(f.focus, 0);
  f.runFrames();
  assert.equal(f.requestedY, 150);
  assert.equal(f.focus, 0);
  f.finishScroll();
  assert.equal(f.focus, 1, "arrival opens the keyboard without an extra settling delay");
  f.fireTimers(80);
  assert.equal(f.focus, 1);
  f.fireTimers(900);
  f.fireTimers(1200);
  assert.equal(f.focus, 1);
  f.dispose();
});

test("native focus and repeated taps share one scroll without restarting the keyboard deadline", () => {
  const f = fixture();
  f.request();
  f.request(); // Native onFocus following onPressIn.
  f.runFrames();
  for (let tap = 0; tap < 5; tap++) {
    f.request();
    f.runFrames();
  }
  assert.equal(f.scrollRequests, 1);
  assert.equal(f.composing, true);
  assert.equal(f.focus, 0);
  f.fireTimers(900);
  assert.equal(f.focus, 1, "the original fallback still completes despite repeated taps");
  f.dispose();
});

test("a native scroll end completes even when its destination was clamped", () => {
  const f = fixture();
  f.request();
  f.runFrames();
  assert.equal(f.requestedY, 150);
  f.scrollToY(110, true);
  assert.equal(f.focus, 1);
  f.fireTimers(900);
  assert.equal(f.focus, 1);
  f.dispose();
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /onMomentumScrollEnd=\{\(\) => profileWallRef\.current\?\.finishPendingScroll\(true\)\}/);
});

test("a scroll that stops short opens after brief inactivity, not the long fallback", () => {
  const f = fixture();
  f.request();
  f.runFrames();
  f.scrollToY(60);
  assert.equal(f.focus, 0, "the keyboard stays hidden while scrolling");
  f.scrollToY(110);
  f.fireTimers(80);
  assert.equal(f.focus, 1);
  f.fireTimers(900);
  assert.equal(f.focus, 1);
  f.dispose();
});

test("missing native measurements and missing scroll-end events cannot leave the keyboard request pending", () => {
  const missingMeasure = fixture(false);
  missingMeasure.request();
  missingMeasure.runFrames();
  missingMeasure.fireTimers(1200);
  assert.equal(missingMeasure.focus, 1);
  missingMeasure.dispose();
  const missingScrollEnd = fixture();
  missingScrollEnd.request();
  missingScrollEnd.runFrames();
  missingScrollEnd.fireTimers(900);
  assert.equal(missingScrollEnd.focus, 1);
  missingScrollEnd.dispose();
});

test("manual dragging and unmount cancel the pending keyboard request", () => {
  for (const cancel of ["drag", "unmount"]) {
    const f = fixture();
    f.request();
    f.runFrames();
    f.scrollToY(60);
    if (cancel === "drag") {
      f.handle.current.cancelPendingScroll();
      assert.equal(f.composing, false);
    } else f.dispose();
    f.runFrames();
    f.fireTimers(1200);
    f.fireTimers(80);
    f.fireTimers(900);
    assert.equal(f.focus, 0);
  }
});

test("early taps still request focus and the native text input explicitly enables its software keyboard", () => {
  const f = fixture(true, false);
  f.request();
  assert.equal(f.focus, 1);
  f.dispose();
  const card = readFileSync(new URL("../components/InnerSpaceCard.tsx", import.meta.url), "utf8");
  assert.match(card, /editable=\{!freeLimitReached\}\s+showSoftInputOnFocus=\{inputActive\}/);
  assert.match(card, /onPressIn=\{requestInputFocus\}/);
  assert.doesNotMatch(card, /pointerEvents=\{inputActive \? "auto" : "none"\}/);
  assert.match(card, /if \(inputActive\) \{\s*focusInput\(\);/);
  assert.doesNotMatch(source, /InteractionManager|runAfterInteractions/);
});