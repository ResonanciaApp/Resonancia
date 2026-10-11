import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

function harness(dev = true) {
  let buttons: any[] = [], report: any, cleanup: any, callback: any;
  let timer: any, nextFrame: any;
  const active: boolean[] = [];
  const source = readFileSync(new URL("../hooks/useDrawerDiagnostics.ts", import.meta.url), "utf8");
  const module = { exports: {} as any };
  const modules: any = {
    react: { useEffect: (fn: any) => { cleanup = fn(); }, useCallback: (fn: any) => fn },
    "react-native": {
      Platform: { OS: "ios", Version: "26" },
      Alert: { alert: (_title: any, _message: any, options: any[]) => { buttons = options; } },
      Share: { share: async (data: any) => { report = JSON.parse(data.message); } },
    },
    "react-native-reanimated": {
      runOnJS: (fn: any) => fn, runOnUI: (fn: any) => fn,
      useFrameCallback: (fn: any, auto: boolean) => {
        assert.equal(auto, false); callback = fn;
        return { setActive: (value: boolean) => active.push(value) };
      },
      useSharedValue: (value: any) => ({
        value, modify(fn: any) { this.value = fn(this.value); },
      }),
    },
  };
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, {
    module, exports: module.exports, require: (id: string) => modules[id], __DEV__: dev,
    Date, Promise, setTimeout: (fn: any) => { timer = fn; return 1; },
    clearTimeout() {}, requestAnimationFrame: (fn: any) => { nextFrame = fn; return 1; },
    cancelAnimationFrame() {},
  });
  const api = module.exports;
  api.useDrawerDiagnostics({ value: 0.25 });
  const press = (text: string) => {
    api.showDrawerDiagnostics();
    const button = buttons.find(b => b.text === text);
    assert.ok(button, text);
    button.onPress();
  };
  return { api, press, active, get report() { return report; },
    ui: (gap: number) => callback({ timeSincePreviousFrame: gap }),
    js: () => nextFrame(), expire: () => timer(), cleanup: () => cleanup?.(),
    get buttons() { return buttons; } };
}

test("manual recording exports timing and origins without changing progress", async () => {
  const h = harness();
  assert.deepEqual(h.active, []);
  h.press("Iniciar registro");
  h.api.drawerDiagnosticEvent("tap:inicio");
  h.ui(16); h.ui(82); h.js();
  h.press("Terminar y compartir");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.report.ui.samples, 2);
  assert.equal(h.report.ui.maxGapMs, 82);
  assert.equal(h.report.ui.slowFrames[0].progress, 0.25);
  assert.equal(h.report.events[0].name, "tap:inicio");
  assert.deepEqual(h.active, [true, false]);
  h.cleanup();
});

test("automatic stop keeps report shareable and a new session resets it", async () => {
  const h = harness();
  h.press("Iniciar registro"); h.ui(90); h.expire();
  await new Promise(resolve => setImmediate(resolve));
  h.press("Terminar y compartir");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.report.ui.samples, 1);
  h.press("Iniciar registro"); h.ui(16);
  h.press("Terminar y compartir");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.report.ui.samples, 1);
  assert.equal(h.report.ui.gapsOver32ms, 0);
  h.cleanup();
});

test("production never activates the recorder or exposes its dialog", () => {
  const h = harness(false);
  h.api.showDrawerDiagnostics();
  h.api.drawerDiagnosticEvent("ignored");
  assert.equal(h.buttons.length, 0);
  assert.deepEqual(h.active, []);
});
