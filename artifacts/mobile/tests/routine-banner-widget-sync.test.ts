import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import ts from "typescript";
import { TAB_BAR_BLUR_INTENSITY, TAB_BAR_GLASS_OVERLAY } from "../constants/tab-bar.ts";
import { CONFIRMATION_ENTRY_DELAY_MS } from "../constants/confirmation-banner.ts";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const compile = (text: string) => ts.transpileModule(text, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;

test("emotion widget preserves its original native blur and translucent background", () => {
  const home = source("../app/(tabs)/inicio8.tsx");
  const widget = home.slice(home.indexOf("function InicioEmotionWidget("), home.indexOf("type InicioMoodRecommendationsProps"));
  assert.ok(widget.length > 0);
  assert.match(widget, /<BlurView\s+pointerEvents="none"\s+intensity=\{38\}\s+tint="light"\s+experimentalBlurMethod="dimezisBlurView"\s+style=\{styles.inicio2HeroEmotionGlass\}/);
  assert.match(widget, /onPress=\{onOpenMoodPicker\}/);
  assert.match(widget, /testID="inicio-add-emotion"/);
  assert.match(widget, /opacity: emotionWidgetOpacity/);
  assert.match(home, /inicio2HeroEmotionGlass: \{[\s\S]*?borderRadius: 33\.5,[\s\S]*?backgroundColor: "rgba\(255,255,255,0\.10\)"/);
});

function harness(kind: "added" | "completed") {
  class Value {
    constructor(public value: number) {}
    setValue(value: number) { this.value = value; }
    stopAnimation() {}
    interpolate() { return this; }
  }
  const widgetOpacity = new Value(1);
  const started: any[] = [];
  const timers = new Map<number, { callback: () => void; at: number }>();
  const haptics: string[] = [];
  let clock = 0;
  let timerId = 0;
  let dismissals = 0;
  let refIndex = 0;
  let effectIndex = 0;
  const refs: any[] = [];
  const effects: any[] = [];
  const pendingEffects: (() => void)[] = [];
  const context: any = {
    activeEvent: kind === "added" ? { id: 1, kind } : { id: 1, kind, previousCount: 1, nextCount: 2 },
    hasPendingCompletion: false,
    emotionWidgetOpacity: widgetOpacity,
    dismissActiveEvent: () => { dismissals++; },
  };
  const Native = (props: any) => React.createElement("div", props, props.children);
  const Animated = {
    Value, View: Native, Text: Native,
    timing(target: Value, config: any) {
      const animation: any = { target, config, start: (callback: any) => {
        animation.callback = callback;
        started.push(animation);
      } };
      return animation;
    },
    parallel(children: any[]) {
      const animation: any = { children, start: (callback: any) => {
        animation.callback = callback;
        started.push(animation);
      } };
      return animation;
    },
  };
  const imports: any = {
    react: {
      ...React,
      useRef(initial: unknown) { return refs[refIndex++] ??= { current: initial }; },
      useState: (initial: unknown) => [initial, () => {}],
      useEffect(effect: () => void, deps: unknown[]) {
        const index = effectIndex++;
        const previous = effects[index];
        if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
          pendingEffects.push(() => {
            previous?.cleanup?.();
            effects[index] = { deps, cleanup: effect() };
          });
        }
      },
    },
    "react-native": {
      Animated, Easing: { out: (x: unknown) => `out(${x})`, in: (x: unknown) => `in(${x})`, inOut: (x: unknown) => `inOut(${x})`, cubic: "cubic", quad: "quad" },
      Pressable: Native, Text: Native, View: Native,
      Platform: { OS: "ios" },
      StyleSheet: { create: (styles: unknown) => styles, absoluteFillObject: {}, hairlineWidth: 1 },
    },
    "@expo/vector-icons": { Feather: Native },
    "expo-blur": { BlurView: Native },
    "expo-haptics": {
      ImpactFeedbackStyle: { Medium: "medium" },
      impactAsync: (style: string) => { haptics.push(style); return Promise.resolve(); },
    },
    "@/constants/tab-bar": { TAB_BAR_BLUR_INTENSITY, TAB_BAR_GLASS_OVERLAY },
    "@/constants/confirmation-banner": { CONFIRMATION_ENTRY_DELAY_MS },
    "@/components/RoutineGradientFill": { RoutineGradientFill: Native },
    "@/context/RoutineCompletionBannerContext": { useRoutineCompletionBanner: () => context },
  };
  const module: any = { exports: {} };
  new Function("require", "module", "exports", "setTimeout", "clearTimeout", compile(source("../components/RoutineCompletionBanner.tsx")))(
    (name: string) => { assert.ok(name in imports, `Missing mock ${name}`); return imports[name]; },
    module, module.exports,
    (callback: () => void, delay: number) => { timers.set(++timerId, { callback, at: clock + delay }); return timerId; },
    (id: number) => timers.delete(id),
  );
  const render = (visible = true) => {
    refIndex = 0; effectIndex = 0;
    const element = module.exports.RoutineCompletionBanner({ bottom: 80, visible });
    pendingEffects.splice(0).forEach(effect => effect());
    return element;
  };
  const finish = (animation: any) => {
    for (const child of animation.children ?? [animation]) child.target.setValue(child.config.toValue);
    animation.callback?.({ finished: true });
  };
  const advance = (ms: number) => {
    const until = clock + ms;
    let next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    while (next && next[1].at <= until) {
      timers.delete(next[0]);
      clock = next[1].at;
      next[1].callback();
      next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    }
    clock = until;
  };
  return { context, widgetOpacity, started, render, finish, advance, haptics,
    dismissals: () => dismissals,
    hold: () => advance(1800),
  };
}

for (const kind of ["added", "completed"] as const) {
  test(`${kind}: widget fade shares the banner's entry and exit animation groups`, () => {
    const h = harness(kind);
    h.render();
    h.advance(kind === "added" ? 900 : 500);
    const entry = h.started[0];
    const fade = entry.children.find((animation: any) => animation.target === h.widgetOpacity);
    assert.equal(fade.config.toValue, 0);
    assert.ok(entry.children.every((animation: any) => animation.config.duration === 380 && animation.config.useNativeDriver));
    h.finish(entry);
    assert.equal(h.widgetOpacity.value, 0);
    if (kind === "completed") h.finish(h.started[1]); // count, then hold
    assert.equal(h.widgetOpacity.value, 0);
    h.hold();
    const exit = h.started.at(-1);
    assert.equal(exit.children.find((animation: any) => animation.target === h.widgetOpacity).config.toValue, 1);
    assert.ok(exit.children.every((animation: any) => animation.config.duration === 320 && animation.config.useNativeDriver));
    assert.equal(h.dismissals(), 0);
    h.finish(exit);
    assert.equal(h.widgetOpacity.value, 1);
    assert.equal(h.dismissals(), 1);
  });
}

test("queued completion interruption restores the widget in the same 160ms fade", () => {
  const h = harness("completed");
  h.render();
  h.advance(500);
  h.finish(h.started[0]);
  h.context.hasPendingCompletion = true;
  h.render();
  const exit = h.started.at(-1);
  assert.equal(exit.children.length, 2);
  assert.ok(exit.children.every((animation: any) => animation.config.duration === 160));
  h.finish(exit);
  assert.equal(h.widgetOpacity.value, 1);
  assert.equal(h.dismissals(), 1);
});

test("hiding the banner or clearing its event cannot leave the widget transparent", () => {
  for (const clear of [false, true]) {
    const h = harness("added");
    h.render();
    h.advance(900);
    h.finish(h.started[0]);
    if (clear) h.context.activeEvent = null;
    h.render(clear);
    assert.equal(h.widgetOpacity.value, 1);
  }
});

for (const kind of ["added", "completed"] as const) {
  const delay = kind === "added" ? 900 : 500;
  test(`${kind}: waits ${delay}ms hidden, then gives one medium impact as the widget and banner transition together`, () => {
    const h = harness(kind);
    const banner = h.render();
    assert.equal(banner.props.style[1].opacity.value, 0);
    assert.equal(h.widgetOpacity.value, 1);
    h.advance(delay - 1);
    assert.equal(h.started.length, 0);
    assert.deepEqual(h.haptics, []);
    h.advance(1);
    assert.equal(banner.props.style[1].opacity.value, 0, "Entry must fade in, not become opaque in one frame");
    assert.equal(h.started.length, 1);
    const fade = h.started[0].children.find((animation: any) =>
      animation.target === banner.props.style[1].opacity);
    assert.equal(fade.config.toValue, 1);
    assert.equal(fade.config.duration, 380);
    assert.equal(fade.config.useNativeDriver, true);
    assert.equal(fade.config.easing, kind === "added" ? "inOut(cubic)" : "out(cubic)");
    assert.ok(h.started[0].children.every((animation: any) =>
      animation.config.easing === fade.config.easing));
    assert.deepEqual(h.haptics, ["medium"]);
    h.render();
    h.advance(500);
    assert.deepEqual(h.haptics, ["medium"]);
    h.finish(h.started[0]);
    assert.equal(banner.props.style[1].opacity.value, 1);
  });

  test(`${kind}: shares the tab bar's purple dark blur and is exactly 50px narrower`, () => {
    const h = harness(kind);
    const banner = h.render();
    const style = banner.props.style[0];
    assert.equal(style.left, style.right);
    assert.equal(style.left + style.right - 28, 50);
    const [blur, overlay] = banner.props.children[0].props.children;
    assert.equal(blur.props.tint, "dark");
    assert.equal(blur.props.intensity, TAB_BAR_BLUR_INTENSITY);
    assert.equal(blur.props.experimentalBlurMethod, "dimezisBlurView");
    assert.equal(overlay.props.style[1].backgroundColor, TAB_BAR_GLASS_OVERLAY);
  });
}

test("hiding or dismissing a banner during its delay cancels entry and vibration", () => {
  for (const clear of [false, true]) {
    const h = harness("added");
    h.render();
    h.advance(899);
    if (clear) h.context.activeEvent = null;
    h.render(clear);
    h.advance(1000);
    assert.equal(h.started.length, 0);
    assert.deepEqual(h.haptics, []);
    assert.equal(h.widgetOpacity.value, 1);
  }
});

test("the blue gradient counter and its halo use a smaller 32px circle", () => {
  const h = harness("completed");
  const banner = h.render();
  const [halo, counter] = banner.props.children[2].props.children.props.children;
  assert.equal(counter.props.style.width, 32);
  assert.equal(counter.props.style.height, 32);
  assert.equal(counter.props.style.borderRadius, 16);
  assert.equal(counter.props.style.overflow, "hidden");
  assert.equal(halo.props.style[0].width, 32);
  assert.equal(halo.props.style[0].height, 32);
  assert.equal(banner.props.children[2].props.style.width, 36);
  assert.equal(banner.props.children[2].props.style.height, 36);
});

test("a queued completion cancels the earlier delayed entrance without an impact", () => {
  const h = harness("completed");
  h.render();
  h.advance(450);
  h.context.hasPendingCompletion = true;
  h.render();
  h.advance(500);
  assert.deepEqual(h.haptics, []);
  assert.equal(h.started.length, 1);
  assert.ok(h.started[0].children.every((animation: any) => animation.config.duration === 160));
});

test("emoji, plus, plus background and widget glass all share one native opacity wrapper", () => {
  const home = source("../app/(tabs)/inicio8.tsx");
  const ast = ts.createSourceFile("inicio8.tsx", home, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const widget = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "InicioEmotionWidget");
  assert.ok(widget);
  const opacity = { native: true };
  const context: any = { activeEvent: null, emotionWidgetOpacity: opacity };
  const Native = () => null;
  const styles: any = {
    inicio2HeroEmotionWidget: { width: 67, height: 67, position: "absolute" },
    inicio2HeroEmotionGlass: { backgroundColor: "rgba(255,255,255,0.10)" },
  };
  const build = new Function("React", "Animated", "Pressable", "BlurView", "Text", "View", "LinearGradient", "StyleSheet", "styles", "useRoutineCompletionBanner",
    `${compile(widget.getText(ast))}\nreturn InicioEmotionWidget;`)(
    React, { View: Native }, Native, Native, Native, Native, Native, { absoluteFill: {} }, styles, () => context,
  );
  let opened = 0;
  const root = build({ bottom: 100, onOpenMoodPicker: () => { opened++; } });
  root.props.children.props.onPress();
  assert.equal(opened, 1);
  assert.equal(root.props.style[1].opacity, opacity);
  assert.equal(root.props.style[1].bottom, 96, "The complete widget is moved down 4px");
  assert.equal(root.props.style[1].transform[0].scale, 63 / 67);
  assert.equal(styles.inicio2HeroEmotionWidget.width * root.props.style[1].transform[0].scale, 63);
  assert.equal(styles.inicio2HeroEmotionWidget.height * root.props.style[1].transform[0].scale, 63);
  assert.equal(root.props.pointerEvents, "auto");
  const [glass, emoji, plusBackground] = root.props.children.props.children;
  assert.equal(glass.type, Native);
  assert.equal(glass.props.intensity, 38);
  assert.equal(glass.props.tint, "light");
  assert.equal(glass.props.experimentalBlurMethod, "dimezisBlurView");
  assert.equal(glass.props.style, styles.inicio2HeroEmotionGlass);
  assert.equal(glass.props.pointerEvents, "none");
  assert.equal(emoji.props.children, "😌");
  assert.equal(plusBackground.props.children[1].props.children, "+");
  assert.deepEqual(plusBackground.props.children[0].props.colors, ["#532FA8", "#372FA8"]);
  const cloudy = build({ bottom: 100, plusBackgroundGradient: ["#2D2F7C", "#2D3981"], onOpenMoodPicker: () => {} });
  const cloudyGradient = cloudy.props.children.props.children[2].props.children[0];
  assert.deepEqual(cloudyGradient.props.colors, ["#2D2F7C", "#2D3981"]);
  assert.deepEqual(cloudyGradient.props.start, { x: 0.5, y: 0 });
  assert.deepEqual(cloudyGradient.props.end, { x: 0.5, y: 1 });
  assert.match(home, /plusBackgroundGradient=\{activeTheme\.id === "natural" \? NATURAL_WIDGET_PLUS_GRADIENT : activeTheme\.id === "cloudy" \? CLOUDY_WIDGET_PLUS_GRADIENT : undefined\}/);
  assert.match(source("../constants/colors.ts"), /CLOUDY_WIDGET_PLUS_GRADIENT = \["#2D2F7C", "#2D3981"\]/);
  context.activeEvent = { kind: "added" };
  assert.equal(build({ bottom: 100 }).props.pointerEvents, "none");
});