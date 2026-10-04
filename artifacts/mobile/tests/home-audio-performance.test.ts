import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const mixerSource = read("../context/MixerContext.tsx");
const playerSource = read("../context/PlayerContext.tsx");
function find(source: string, predicate: (node: ts.Node) => boolean) {
  const ast = ts.createSourceFile("context.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let match: ts.Node | undefined;
  const visit = (node: ts.Node) => {
    if (!match && predicate(node)) match = node;
    if (!match) ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(match, "Expected production expression exists");
  return match;
}
function initializer(source: string, name: string) {
  return (find(source, node => ts.isVariableDeclaration(node) && node.name.getText() === name) as ts.VariableDeclaration).initializer!;
}
function callback(source: string, name: string) {
  return (initializer(source, name) as ts.CallExpression).arguments[0].getText();
}
function effect(containing: string) {
  return (find(mixerSource, node => ts.isCallExpression(node) &&
    node.expression.getText() === "useEffect" && node.arguments[0]?.getText().includes(containing)) as ts.CallExpression).arguments[0].getText();
}
function evaluate(expression: string, bindings: Record<string, unknown>) {
  const js = ts.transpileModule(`return (${expression});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  return new Function(...Object.keys(bindings), js)(...Object.values(bindings));
}
const loopExpression = effect("playableBreathingIds");
const pruneExpression = effect("breatheStateRef.current.keys()");

function harness() {
  const timers = new Map<number, () => void>();
  let timerId = 0;
  let cleanup: (() => void) | undefined;
  let commits = 0;
  const phase = { base: 0.4, p1: 0, p2: 0, p3: 0, T1: 5000, T2: 11000, T3: 19000 };
  const state: any = {
    breathingIds: ["rain"],
    activeSoundsRef: { current: [{ id: "rain", volume: 0.4 }] },
    isPlayingRef: { current: true },
    breatheStateRef: { current: new Map([["rain", phase]]) },
    breathingTimerRef: { current: null },
    binauralEngineActiveRef: { current: new Set() },
    getCatalogSoundById: () => undefined,
    bpmAudioEngine: { setVolume: () => {} },
    setBreathingIds: (fn: (ids: string[]) => string[]) => {
      state.breathingIds = fn(state.breathingIds);
    },
    setActiveSounds: (fn: (sounds: any[]) => any[]) => {
      const previous = state.activeSoundsRef.current;
      const next = fn(previous);
      if (next !== previous) commits++;
      state.activeSoundsRef.current = next;
    },
    setInterval: (fn: () => void, ms: number) => {
      assert.equal(ms, 32, "Keep the existing audible modulation rate");
      timers.set(++timerId, fn);
      return timerId;
    },
    clearInterval: (id: number) => timers.delete(id),
  };
  state.applyBreathVolume = evaluate(callback(mixerSource, "applyBreathVolume"), state);
  const reset = evaluate(callback(mixerSource, "resetBreathing"), state);
  const bindings = () => ({
    ...state,
    isPlaying: state.isPlayingRef.current,
    activeSoundIdsKey: JSON.stringify(state.activeSoundsRef.current.map((sound: any) => sound.id)),
  });
  return {
    state, timers, phase, reset,
    get commits() { return commits; },
    mount() {
      cleanup?.();
      cleanup = evaluate(loopExpression, bindings())();
    },
    prune() { evaluate(pruneExpression, bindings())(); },
    ticks(count: number) {
      for (let i = 0; i < count; i++) for (const tick of [...timers.values()]) tick();
    },
    unmount() { cleanup?.(); },
  };
}

test("stop clears the actual breathing interval and queued callbacks cannot write after stop", () => {
  const h = harness();
  h.mount();
  const queued = [...h.timers.values()][0];
  h.ticks(313);
  assert.equal(h.commits, 313);
  h.reset();
  h.state.activeSoundsRef.current = [];
  queued();
  h.ticks(18_750); // Ten simulated minutes after stop.
  assert.equal(h.commits, 313);
  assert.equal(h.timers.size, 0);
  assert.equal(h.state.breatheStateRef.current.size, 0);
  assert.deepEqual(h.state.breathingIds, []);
  h.mount();
  assert.equal(h.timers.size, 0);
});

test("pause retains breathing configuration and resumes one loop without phase jumps", () => {
  const h = harness();
  h.mount();
  h.ticks(10);
  const phaseBeforePause = h.phase.p1;
  h.state.isPlayingRef.current = false;
  h.ticks(10); // Guard the interval before React's effect cleanup.
  h.mount();
  assert.equal(h.timers.size, 0);
  assert.equal(h.phase.p1, phaseBeforePause);
  assert.deepEqual(h.state.breathingIds, ["rain"]);
  h.state.isPlayingRef.current = true;
  h.mount();
  assert.equal(h.timers.size, 1);
  h.ticks(1);
  assert.equal(h.commits, 11);
  assert.ok(h.phase.p1 > phaseBeforePause);
  for (let i = 0; i < 100; i++) h.mount();
  assert.equal(h.timers.size, 1);
  const queued = [...h.timers.values()][0];
  h.unmount();
  queued();
  assert.equal(h.commits, 11);
  assert.equal(h.timers.size, 0);
});

test("removing the final breathing sound prunes its state and never emits empty-array updates", () => {
  const h = harness();
  h.mount();
  h.state.activeSoundsRef.current = [];
  h.ticks(100);
  h.state.applyBreathVolume("rain", 0.7);
  assert.equal(h.commits, 0);
  h.prune();
  h.mount();
  assert.equal(h.timers.size, 0);
  assert.deepEqual(h.state.breathingIds, []);
  assert.equal(h.state.breatheStateRef.current.size, 0);
});

test("unchanged volume preserves state identity, and stop/preset replacement clear breathing", () => {
  const h = harness();
  h.state.applyBreathVolume("rain", 0.4);
  assert.equal(h.commits, 0);
  assert.match(callback(mixerSource, "stopAll"), /resetBreathing\(\)/);
  assert.match(callback(mixerSource, "loadPreset"), /resetBreathing\(\)/);
});

test("actual home, library and streak memo values stay stable across 18,750 fast ticks", () => {
  for (const [source, name, changingField] of [
    [playerSource, "homeValue", "favorites"],
    [playerSource, "statsValue", "statEvents"],
    [mixerSource, "libraryValue", "presets"],
  ]) {
    let deps: unknown[] | undefined;
    let value: unknown;
    const noop = () => {};
    const bindings: Record<string, any> = {
      React: { useMemo: (factory: () => unknown, next: unknown[]) => {
        if (!deps || next.some((item, i) => !Object.is(item, deps![i]))) {
          value = factory();
          deps = next;
        }
        return value;
      } },
      playSession: noop, history: [], favorites: [], sessionProgress: {},
      getSessionProgress: noop, statEvents: [], presets: [],
      loadPreset: noop, openSheet: noop, setSleepTimer: noop,
    };
    const compiled = new Function("bindings", `with (bindings) { return (${initializer(source, name).getText()}); }`);
    const initial = compiled(bindings);
    for (let tick = 0; tick < 18_750; tick++) {
      Object.assign(bindings, { elapsed: tick, progress: tick / 18_750,
        activeSounds: [{ id: "rain", volume: tick / 18_750 }], sleepTimerRemaining: 18_750 - tick });
      assert.equal(compiled(bindings), initial);
    }
    bindings[changingField] = ["changed"];
    assert.notEqual(compiled(bindings), initial, "Real data changes still reach subscribers");
  }
  const home = read("../app/(tabs)/inicio8.tsx");
  assert.doesNotMatch(home, /\buse(?:Player|Mixer)\(\)/);
  assert.match(home, /usePlayerHome\(\)/);
  assert.match(home, /useMixerLibrary\(\)/);
  assert.match(read("../hooks/useStreak.ts"), /usePlayerStats\(\)/);
  assert.match(read("../hooks/useLoadMix.ts"), /useMixerLibrary\(\)/);
});