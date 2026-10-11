import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import ts from "typescript";

function harness(saved: string | null = null, failWrite = false) {
  const states: any[] = [];
  const pending = { current: false };
  const writes: string[][] = [];
  const alerts: string[][] = [];
  let index = 0;
  let mounted = false;
  let effect: (() => void) | undefined;
  let preference: any = null;
  const mocks: Record<string, any> = {
    react: {
      ...React,
      createContext: () => ({ Provider: "provider" }),
      useContext: () => preference,
      useRef: () => pending,
      useMemo: (calculate: () => any) => calculate(),
      useCallback: (callback: any) => callback,
      useEffect: (callback: () => void) => { if (!mounted) effect = callback; },
      useState: (initial: any) => {
        const slot = index++;
        if (!(slot in states)) states[slot] = initial;
        return [states[slot], (next: any) => { states[slot] = next; }];
      },
    },
    "@react-native-async-storage/async-storage": {
      getItem: async () => saved,
      setItem: async (key: string, value: string) => {
        writes.push([key, value]);
        if (failWrite) throw new Error("storage unavailable");
        saved = value;
      },
    },
    "react-native": { Alert: { alert: (...args: string[]) => alerts.push(args) } },
  };
  const source = readFileSync(new URL("../context/EmojiWidgetContext.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module: any = { exports: {} };
  new Function("require", "module", "exports", "console", compiled)(
    (name: string) => { assert.ok(name in mocks, name); return mocks[name]; },
    module, module.exports, { warn: () => {} },
  );
  const render = () => {
    index = 0;
    preference = module.exports.EmojiWidgetProvider({ children: null }).props.value;
    if (!mounted) { mounted = true; effect?.(); }
    return preference;
  };
  return {
    render, writes, alerts,
    hydrate: async () => { await new Promise<void>(resolve => setImmediate(resolve)); return render(); },
    hook: () => module.exports.useEmojiWidget(),
  };
}

test("emoji widget is on by default and restores an explicitly disabled preference", async () => {
  for (const [saved, expected] of [[null, true], ["true", true], ["false", false]] as const) {
    const h = harness(saved);
    assert.equal(h.render().loaded, false);
    const preference = await h.hydrate();
    assert.equal(preference.loaded, true);
    assert.equal(preference.enabled, expected);
    assert.equal(h.hook().enabled, expected);
    assert.deepEqual(h.writes, [], "hydration never overwrites the saved choice");
  }
});

test("turning the widget off and back on persists the choice, guarding pending writes", async () => {
  const h = harness();
  h.render();
  await h.hydrate();
  const disabling = h.render().setEnabled(false);
  assert.equal(h.render().enabled, false);
  assert.equal(h.render().saving, true);
  await h.render().setEnabled(true);
  assert.equal(h.writes.length, 1);
  await disabling;
  assert.equal(h.render().saving, false);
  await h.render().setEnabled(true);
  assert.equal(h.render().enabled, true);
  assert.deepEqual(h.writes.map(write => write[1]), ["false", "true"]);
  assert.ok(h.writes.every(write => write[0] === "@resonance_emoji_widget_visible"));
});

test("failed persistence restores the previous choice and shows an explicit error", async () => {
  const h = harness("true", true);
  h.render();
  await h.hydrate();
  await h.render().setEnabled(false);
  assert.equal(h.render().enabled, true);
  assert.equal(h.render().saving, false);
  assert.equal(h.alerts.length, 1);
});

test("settings row precedes Racha, while the header remains available when the widget is hidden", () => {
  const settings = readFileSync(new URL("../components/ProfileSettingsSections.tsx", import.meta.url), "utf8");
  assert.ok(settings.indexOf('label: "Widget emoji"') < settings.indexOf('label: "Racha"'));
  assert.match(settings, /toggleValue: emojiWidgetEnabled/);
  assert.match(settings, /void setEmojiWidgetEnabled\(value\)/);
  assert.match(settings, /\{ icon: "zap", label: "Racha", toggle: true \}/);
  const root = readFileSync(new URL("../app/_layout.tsx", import.meta.url), "utf8");
  assert.match(root, /<EmojiWidgetProvider>[\s\S]*<\/EmojiWidgetProvider>/);
  const home = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");
  assert.match(home, /const \{ enabled, loaded \} = useEmojiWidget\(\);\s*if \(!loaded \|\| !enabled\) return null/);
  const header = home.slice(home.indexOf("const Inicio2HeroStatic"), home.indexOf("function InicioEmotionWidget"));
  assert.doesNotMatch(header, /useEmojiWidget/);
  assert.match(header, /Registro de ánimo/);
});
