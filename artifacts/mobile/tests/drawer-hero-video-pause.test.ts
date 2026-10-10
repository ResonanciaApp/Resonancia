import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const compile = (text: string) => ts.transpileModule(text, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;

function pauseHarness(initialProgress = 0, initialEnabled = true) {
  const drawerProgress = { value: initialProgress };
  const updates: boolean[] = [];
  let initialized = false;
  let paused = false;
  let previous: boolean | null = null;
  let prepare: () => boolean;
  let reaction: (next: boolean, previous: boolean | null) => void;
  const refs: any[] = [];
  let refIndex = 0;
  let cleanup: (() => void) | undefined;
  let effectMounted = false;
  const frames = new Map<number, () => void>();
  let frameId = 0;
  const modules: any = {
    react: {
      useRef: (initial: any) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      useCallback: (fn: any) => fn,
      useEffect: (fn: () => (() => void)) => {
        if (!effectMounted) { cleanup = fn(); effectMounted = true; }
      },
      useState: (initial: () => boolean) => {
      if (!initialized) { paused = initial(); initialized = true; }
      return [paused, (next: boolean) => { paused = next; updates.push(next); }];
    } },
    "react-native-reanimated": {
      runOnJS: (fn: any) => fn,
      useAnimatedReaction: (a: any, b: any) => { prepare = a; reaction = b; },
    },
    "@/context/DrawerContext": { useDrawerMotion: () => ({ drawerProgress }) },
  };
  const module = { exports: {} as any };
  new Function("require", "module", "exports", "requestAnimationFrame", "cancelAnimationFrame", compile(read("../hooks/useDrawerMediaPaused.ts")))(
    (id: string) => modules[id], module, module.exports,
    (fn: () => void) => { frames.set(++frameId, fn); return frameId; },
    (id: number) => frames.delete(id),
  );
  let enabled = initialEnabled;
  const render = () => { refIndex = 0; return module.exports.useDrawerMediaPaused(enabled); };
  render();
  return {
    updates, render,
    frame() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn()); return render(); },
    unmount() { cleanup?.(); },
    sample(value: number) {
      drawerProgress.value = value;
      const next = prepare();
      reaction(next, previous);
      previous = next;
      return render();
    },
    enable(value: boolean) { enabled = value; return render(); },
  };
}

test("video pauses immediately and resumes two paint opportunities after fully closed progress", () => {
  const h = pauseHarness();
  assert.equal(h.sample(0), false);
  h.updates.length = 0;
  assert.equal(h.sample(0.001), true);
  for (const value of [0.2, 0.4, 0.8, 1, 0.6, 0.05, 0.001]) assert.equal(h.sample(value), true);
  assert.deepEqual(h.updates, [true], "no per-frame React updates");
  assert.equal(h.sample(0), true);
  assert.deepEqual(h.updates, [true], "the final closing commit must not restart the decoder");
  assert.equal(h.frame(), true);
  assert.equal(h.frame(), false);
  assert.deepEqual(h.updates, [true, false]);
});

test("cancelled and interrupted gestures track actual progress rather than the open-state flag", () => {
  const h = pauseHarness();
  assert.equal(h.sample(0.3), true);
  assert.equal(h.sample(0), true);
  h.frame(); assert.equal(h.frame(), false);
  assert.equal(h.sample(0.2), true);
  assert.equal(h.sample(0.01), true);
  assert.equal(h.sample(0.9), true);
  assert.equal(h.sample(0), true);
  h.frame(); assert.equal(h.frame(), false);
});

test("reopening between close and deferred resume never restarts the video", () => {
  for (const framesBeforeReopening of [0, 1]) {
    const h = pauseHarness(1);
    h.sample(1);
    h.sample(0);
    if (framesBeforeReopening) h.frame();
    h.sample(0.01);
    h.frame(); h.frame();
    assert.equal(h.render(), true);
    assert.equal(h.updates.includes(false), false);
    h.sample(0); h.frame();
    assert.equal(h.frame(), false);
  }
});

test("unmount cancels deferred resume and changing back from an image does not retain stale pause", () => {
  const h = pauseHarness(1);
  h.sample(1); h.sample(0);
  h.frame(); h.unmount(); h.frame();
  assert.equal(h.updates.includes(false), false);

  const media = pauseHarness(1);
  media.sample(1); media.enable(false); media.sample(1);
  media.frame(); media.frame();
  media.sample(0); media.enable(true);
  assert.equal(media.sample(0), false);
});

test("media mounted behind an already open drawer starts paused; images stay unaffected", () => {
  assert.equal(pauseHarness(1).render(), true);
  const images = pauseHarness(0, false);
  assert.equal(images.sample(0), false);
  images.updates.length = 0;
  for (const value of [0.1, 0.8, 1, 0.4, 0]) assert.equal(images.sample(value), false);
  assert.deepEqual(images.updates, []);
});

test("switching media types updates the local pause gate while the drawer is open", () => {
  const h = pauseHarness(1, false);
  assert.equal(h.sample(1), false);
  h.enable(true);
  assert.equal(h.sample(1), true);
  h.enable(false);
  assert.equal(h.sample(1), false);
});

test("actual hero playback respects drawer, focus and active-slide gates without resetting its source", () => {
  const source = read("../app/(tabs)/inicio8.tsx");
  const ast = ts.createSourceFile("inicio8.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "Inicio3HeroMedia");
  assert.ok(declaration);
  let paused = false;
  let focused = true;
  let stateIndex = 0;
  const commands: string[] = [];
  const sources: string[] = [];
  const player = {
    currentTime: 12, loop: false, muted: false,
    pause: () => commands.push("pause"),
    play: () => commands.push("play"),
    addListener: () => ({ remove() {} }),
  };
  const Native = () => null;
  const imports: Record<string, any> = {
    React,
    useState: (initial: any) => [stateIndex++ === 0 ? focused : initial, () => {}],
    useEffect: (fn: () => void) => fn(),
    useCallback: (fn: any) => fn,
    useFocusEffect: () => {},
    useDrawerMediaPaused: (enabled: boolean) => enabled && paused,
    useVideoPlayer: (uri: string, setup: any) => { sources.push(uri); setup(player); return player; },
    View: Native, ExpoImage: Native, VideoView: Native,
    StyleSheet: { absoluteFill: {} }, styles: { inicio2HeroImage: {} },
    INICIO3_HERO_FALLBACK: 1,
  };
  const Media = new Function(...Object.keys(imports), `${compile(declaration.getText(ast))}\nreturn Inicio3HeroMedia;`)(...Object.values(imports));
  const props = { active: true, reduceMotion: false, effectiveHero: { kind: "video", uri: "https://example.test/hero.mp4", fallbackImage: 1 } };
  const render = (overrides = {}) => { stateIndex = 0; return Media({ ...props, ...overrides }); };
  render();
  assert.equal(commands.at(-1), "play");
  paused = true;
  const hidden = render();
  assert.equal(commands.at(-1), "pause");
  assert.equal(hidden.props.children[1].props.player, player, "video stays mounted on its last frame");
  paused = false;
  render();
  assert.equal(commands.at(-1), "play");
  assert.equal(player.currentTime, 12);
  assert.ok(sources.every(uri => uri === props.effectiveHero.uri));
  render({ active: false });
  assert.equal(commands.at(-1), "pause");
  focused = false;
  render();
  assert.equal(commands.at(-1), "pause");
  focused = true;
  render({ reduceMotion: true });
  assert.equal(commands.at(-1), "pause");
  render({ effectiveHero: { kind: "image", uri: "https://example.test/hero.webp" } });
  assert.equal(commands.at(-1), "pause");
  assert.equal(player.loop, true);
  assert.equal(player.muted, true);
});
