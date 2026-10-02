import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const compiled = ts.transpileModule(source("../components/RoutineCompletionTransition.tsx"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
type Animation = { target: number; duration: number; callback?: (finished: boolean) => void };

function harness(initialComplete = false, animateToPending = true) {
  const slots: any[] = [];
  let cursor = 0;
  let focused = true;
  let effects: (() => void)[] = [];
  const animations = new Map<Value, Animation>();
  class Value {
    current: number;
    constructor(value: number) { this.current = value; }
    get value() { return this.current; }
    set value(next: number | Animation) {
      if (typeof next === "number") this.current = next;
      else animations.set(this, next);
    }
  }
  const slot = (create: () => any) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = create();
    return slots[index];
  };
  const same = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const View = ({ children, testID, style, pointerEvents }: any) => {
    const resolved = Object.assign({}, ...(Array.isArray(style) ? style : [style]));
    return React.createElement("div", {
      "data-testid": testID, "data-opacity": resolved.opacity,
      "data-height": resolved.height, "data-pointer": pointerEvents,
    }, children);
  };
  const mocks: Record<string, unknown> = {
    react: {
      ...React,
      useRef: (value: unknown) => slot(() => ({ current: value })),
      useState: (value: unknown) => {
        const state = slot(() => ({ value }));
        return [state.value, (next: unknown) => { state.value = next; }];
      },
      useCallback: (fn: Function, deps: unknown[]) => {
        const memo = slot(() => ({ fn, deps }));
        if (!same(memo.deps, deps)) Object.assign(memo, { fn, deps });
        return memo.fn;
      },
      useEffect: (fn: () => (() => void) | undefined, deps: unknown[]) => {
        const effect = slot(() => ({ deps: null, cleanup: undefined }));
        if (effect.deps === null || !same(effect.deps, deps)) {
          effect.deps = deps;
          effects.push(() => { effect.cleanup?.(); effect.cleanup = fn(); });
        }
      },
    },
    "expo-router": {
      useFocusEffect: (fn: () => (() => void) | undefined) => {
        const focus = slot(() => ({ active: false, cleanup: undefined }));
        if (focus.active !== focused) {
          const nextFocus = focused;
          focus.active = focused;
          effects.push(() => {
            focus.cleanup?.();
            focus.cleanup = nextFocus ? fn() : undefined;
          });
        }
      },
    },
    "react-native": { StyleSheet: { create: (styles: unknown) => styles } },
    "react-native-reanimated": {
      View,
      useSharedValue: (value: number) => slot(() => new Value(value)),
      useAnimatedStyle: (fn: () => object) => fn(),
      withTiming: (target: number, options: { duration: number }, callback?: Animation["callback"]) =>
        ({ target, duration: options.duration, callback }),
      cancelAnimation: (value: Value) => animations.delete(value),
      runOnJS: (fn: Function) => fn,
    },
  };
  const module = { exports: {} as { RoutineCompletionTransition: (props: any) => React.ReactElement } };
  new Function("require", "module", "exports", compiled)((name: string) => {
    assert.ok(name in mocks, `Unexpected dependency: ${name}`);
    return mocks[name];
  }, module, module.exports);
  const render = (complete = initialComplete, label = "Última tarea · Añadir actividad") => {
    cursor = 0;
    const element = module.exports.RoutineCompletionTransition({
      complete, animateToPending, children: React.createElement("span", null, label),
      completedContent: React.createElement("span", null, "Rutina completa · ¡Hasta mañana!"),
    });
    const next = effects;
    effects = [];
    next.forEach((effect) => effect());
    return element;
  };
  const advance = (fraction: number) => {
    animations.forEach((animation, value) => { value.current = animation.target * fraction; });
  };
  const finish = () => {
    const active = [...animations];
    animations.clear();
    active.forEach(([value, animation]) => {
      value.current = animation.target;
      animation.callback?.(true);
    });
  };
  const measure = (element: any) => {
    element.props.children[0]?.props.onLayout({ nativeEvent: { layout: { height: 161 } } });
    element.props.children[1].props.onLayout({ nativeEvent: { layout: { height: 156 } } });
  };
  return { render, advance, finish, measure, animations, blur: () => { focused = false; } };
}

test("last card and lower button remain mounted until the coordinated 350ms transition finishes", () => {
  const h = harness();
  h.measure(h.render());
  h.finish();
  const initial = h.render(true, "No quedan tareas");
  assert.match(renderToStaticMarkup(initial), /Última tarea · Añadir actividad/);
  assert.equal((initial.props as any).children[0].props.pointerEvents, "none");
  assert.equal((initial.props as any).children[0].props.accessibilityElementsHidden, true);
  assert.equal([...h.animations.values()][0].duration, 350);
  h.advance(0.5);
  const midway = h.render(true);
  assert.equal((midway.props as any).style.height, 158.5);
  assert.equal((midway.props as any).children[0].props.style.opacity, 0.5);
  assert.equal((midway.props as any).children[1].props.style[1].opacity, 0.5);
  h.finish();
  const final = h.render(true);
  assert.doesNotMatch(renderToStaticMarkup(final), /Última tarea/);
  assert.match(renderToStaticMarkup(final), /Rutina completa · ¡Hasta mañana!/);
  assert.equal((final.props as any).style.height, 156);
  assert.equal((final.props as any).children[1].props.style[1].opacity, 1);
});

test("rapid completions retain only the latest pending layer, not an earlier card list", () => {
  const h = harness();
  h.render(false, "Tarea A · Tarea B");
  h.finish();
  h.render(false, "Tarea B");
  const outgoing = h.render(true, "Vacío");
  assert.match(renderToStaticMarkup(outgoing), /Tarea B/);
  assert.doesNotMatch(renderToStaticMarkup(outgoing), /Tarea A|Vacío/);
});

test("adding a task interrupts completion and stale animation callbacks cannot discard the new layer", () => {
  const h = harness();
  h.measure(h.render());
  h.finish();
  h.render(true);
  const stale = [...h.animations.values()][0].callback;
  h.advance(0.4);
  h.render(false, "Nueva tarea");
  h.finish();
  stale?.(true);
  const resumed = h.render(false, "Nueva tarea");
  assert.match(renderToStaticMarkup(resumed), /Nueva tarea/);
  assert.equal((resumed.props as any).children[0].props.pointerEvents, "auto");
  assert.equal((resumed.props as any).children[1].props.accessibilityElementsHidden, true);
  h.render(true);
  stale?.(true);
  assert.match(renderToStaticMarkup(h.render(true)), /Nueva tarea/);
});

test("leaving the tab settles completion and cancels its animation", () => {
  const h = harness();
  h.render();
  h.finish();
  h.render(true);
  h.blur();
  h.render(true);
  const settled = h.render(true);
  assert.equal(h.animations.size, 0);
  assert.equal((settled.props as any).children[0], false);
  assert.equal((settled.props as any).children[1].props.style[1].opacity, 1);
});

test("already completed routines reserve their final height without an initial blank fade", () => {
  const h = harness(true);
  const initial = h.render(true);
  assert.equal((initial.props as any).children[0], false);
  assert.equal((initial.props as any).style.height, 156);
  assert.equal((initial.props as any).children[1].props.style[1].opacity, 1);
});

test("routine integration freezes outgoing rows, settles added tasks without a reverse transition, and keeps completion timing", () => {
  const routine = source("../components/MiRutinaSection.tsx");
  assert.match(routine, /if \(todayActivityIds\.length === 0\) return/);
  assert.match(routine, /if \(todayActivities\.length === 0\) return/);
  assert.match(routine, /COMPLETION_EXIT_DELAY = 1500/);
  assert.match(routine, /<RoutineCompletionTransition\s+key=\{dateKey\}\s+complete=\{showCompleteState\}/);
  assert.match(routine, /animateToPending=\{false\}/);
  assert.doesNotMatch(routine, /completeFade|completeStateSlot/);
});

test("adding a task to a complete routine settles immediately without a 350ms height transition", () => {
  const h = harness(true, false);
  h.render(true);
  const returned = h.render(false, "Nueva tarea · Añadir actividad");
  assert.equal(h.animations.size, 0);
  assert.equal((returned.props as any).style.height, undefined);
  assert.match(renderToStaticMarkup(returned), /Nueva tarea/);
  const settled = h.render(false);
  assert.equal((settled.props as any).style.height, undefined);
  assert.equal((settled.props as any).children[0].props.style.opacity, 1);
  assert.equal((settled.props as any).children[1].props.style[1].opacity, 0);
});

test("disabling the return-to-pending animation preserves the last-task completion fade", () => {
  const h = harness(false, false);
  h.measure(h.render(false));
  h.render(true);
  assert.equal([...h.animations.values()][0].duration, 350);
  h.advance(0.5);
  const midway = h.render(true);
  assert.equal((midway.props as any).children[0].props.style.opacity, 0.5);
  assert.equal((midway.props as any).children[1].props.style[1].opacity, 0.5);
});

test("returning to pending explicitly clears the last native height as more cards are added", () => {
  const h = harness(true, false);
  // Native animated props retain keys omitted from subsequent style updates.
  const nativeStyle: { height?: number } = {};
  const apply = (element: any) => {
    Object.assign(nativeStyle, element.props.style);
    return element;
  };
  apply(h.render(true));
  assert.equal(nativeStyle.height, 156);

  for (const cards of [1, 2, 3, 6, 10]) {
    const pending = apply(h.render(false, `${cards} tareas · Añadir actividad`));
    assert.ok(Object.hasOwn(pending.props.style, "height"), "Must clear height, not omit it");
    assert.equal(nativeStyle.height, undefined, "Routine must use its children's full layout height");
    pending.props.children[0].props.onLayout({
      nativeEvent: { layout: { height: cards * 83 + 78 } },
    });
    apply(h.render(false));
    assert.equal(nativeStyle.height, undefined, "Measurements must not re-freeze the growing routine");
  }

  apply(h.render(true));
  h.finish();
  apply(h.render(true));
  assert.equal(nativeStyle.height, 156);
  apply(h.render(false));
  assert.equal(nativeStyle.height, undefined, "The next completed-to-pending cycle must also clear height");
});