import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../hooks/usePreparedAvatarImage.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function setup() {
  const requests: { source: any; resolve: (image: any) => void; reject: (error: Error) => void }[] = [];
  const refs: any[] = [];
  const states: any[] = [];
  const effects: { deps: any[]; cleanup?: () => void }[] = [];
  const warnings: any[] = [];
  let ri = 0, si = 0, ei = 0;
  const react = {
    useRef: (value: any) => refs[ri++] ?? (refs[ri - 1] = { current: value }),
    useState: (value: any) => {
      const index = si++;
      if (!(index in states)) states[index] = value;
      return [states[index], (next: any) => { states[index] = next; }];
    },
    useCallback: (fn: any) => fn,
    useEffect: (fn: () => (() => void) | void, deps: any[]) => {
      const index = ei++;
      const old = effects[index];
      if (old && old.deps.every((dep, i) => dep === deps[i])) return;
      old?.cleanup?.();
      effects[index] = { deps, cleanup: fn() || undefined };
    },
  };
  const exports: any = {};
  new Function("require", "exports", "console", code)(
    (name: string) => name === "react" ? react : {
      Image: { loadAsync: (source: any) => new Promise((resolve, reject) => requests.push({ source, resolve, reject })) },
    }, exports, { warn: (...args: any[]) => warnings.push(args) },
  );
  const options = { source: { uri: "https://example.test/avatar.webp" } as any, enabled: true };
  const render = () => {
    ri = si = ei = 0;
    return exports.usePreparedAvatarImage(options.source, options.enabled);
  };
  return { options, requests, render, states, warnings,
    unmount: () => effects.forEach(effect => effect.cleanup?.()) };
}

test("preloads before the Modal opens and reuses the same decoded native image", async () => {
  const h = setup();
  const preview = h.render();
  const opening = preview.prepare();
  assert.equal(h.requests.length, 1, "opening reuses the in-flight preload");
  assert.equal(preview.image, null);
  const image = { nativeRef: "decoded-avatar" };
  h.requests[0].resolve(image);
  assert.equal(await opening, image);
  assert.equal(h.render().image, image);
  assert.equal(await h.render().prepare(), image);
  assert.equal(h.requests.length, 1, "reopening does not decode or reload the hero");
  h.options.source = { uri: "https://example.test/avatar.webp" };
  assert.equal(h.render().image, image, "catalog refresh keeps the hero visible");
  assert.equal(await h.render().prepare(), image);
  assert.equal(h.requests.length, 1, "equivalent source objects must not restart loading");
});

test("a delayed previous avatar cannot replace the current selection", async () => {
  const h = setup();
  const old = h.render().prepare();
  h.options.source = { uri: "file:///new-avatar.jpg" };
  const current = h.render().prepare();
  h.requests[0].resolve({ nativeRef: "old" });
  await old;
  assert.equal(h.render().image, null);
  const image = { nativeRef: "new" };
  h.requests[1].resolve(image);
  await current;
  assert.equal(h.render().image, image);
});

test("no-avatar and non-account screens do not request an image", async () => {
  const h = setup();
  h.options.enabled = false;
  h.render();
  assert.equal(h.requests.length, 0);
  h.options.source = null;
  h.options.enabled = true;
  assert.equal(await h.render().prepare(), null);
  assert.equal(h.requests.length, 0);
});

test("failed preparation is reported and can be retried without stale updates after unmount", async () => {
  const h = setup();
  const first = h.render().prepare();
  h.requests[0].reject(new Error("network unavailable"));
  await assert.rejects(first, /network unavailable/);
  assert.equal(h.warnings.length, 1);
  const retry = h.render().prepare();
  assert.equal(h.requests.length, 2);
  h.unmount();
  h.requests[1].resolve({ nativeRef: "late" });
  await retry;
  assert.equal(h.states[0], null);
});
