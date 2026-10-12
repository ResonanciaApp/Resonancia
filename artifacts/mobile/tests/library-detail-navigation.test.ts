import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";
import { hasLibrarySlide, isLibraryDetailRoute, libraryDetailOptions } from "../lib/library-detail-navigation.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("only library playlists and folders get a stationary backdrop; other routes keep their options", () => {
  for (const route of ["/playlist/a", "/editorial-playlist/a", "/carpeta/a", "/carpeta-mezcla/a", "/carpeta-favorito/a"]) {
    assert.equal(isLibraryDetailRoute(route), true);
  }
  assert.equal(isLibraryDetailRoute("/artista/a"), false);
  assert.equal(isLibraryDetailRoute("/playlist"), false);
  assert.deepEqual(libraryDetailOptions(), {});
  assert.deepEqual(libraryDetailOptions({ fromLibrary: "1" }), {});
  assert.equal(hasLibrarySlide({ librarySlide: ["1"] }), true);
  assert.deepEqual(libraryDetailOptions({ librarySlide: "1" }), {
    presentation: "transparentModal", animation: "none", gestureEnabled: false,
  });
});

test("opening library cards pushes the detail without closing or fading Biblioteca", () => {
  const source = read("../components/BibliotecaScreen.tsx");
  const start = source.indexOf("function useLibraryRouteOpener()");
  const end = source.indexOf("/** Abre una playlist", start);
  const compiled = ts.transpileModule(source.slice(start, end), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const libOpen of [true, false]) {
    const pushed: string[] = [];
    let closed = 0;
    const open = new Function("useDrawer", "useCallback", "router", "isLibraryDetailRoute", "requestAnimationFrame", "Platform",
      `${compiled}; return useLibraryRouteOpener();`)(
      () => ({ libOpen, isOpen: false, closeLib: () => closed++, close: () => closed++ }),
      (fn: unknown) => fn,
      { push: (route: string) => pushed.push(route) },
      isLibraryDetailRoute,
      () => { throw new Error("A library card must not schedule Biblioteca's dismissal"); },
      { OS: "ios" },
    );
    for (const route of ["/playlist/one", "/carpeta/two", "/carpeta-mezcla/three", "/carpeta-favorito/four", "/editorial-playlist/five"]) {
      open(route);
      assert.equal(pushed.at(-1), `${route}?librarySlide=1${libOpen ? "&fromLibrary=1" : ""}`);
    }
    assert.equal(closed, 0);
  }
});

test("return uses the panel's close animation, without reopening or remounting Biblioteca", () => {
  let closed = 0;
  let reopened = 0;
  let nativeBack = 0;
  const compiled = ts.transpileModule(read("../hooks/useLibraryReturnBack.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} as any };
  const imports: Record<string, any> = {
    react: { useCallback: (fn: unknown) => fn, useRef: (current: unknown) => ({ current }) },
    "expo-router": { router: { back: () => nativeBack++ }, useFocusEffect: () => {} },
    "react-native": { BackHandler: {} },
    "@/context/BackOverrideContext": { useBackOverride: () => () => closed++ },
    "@/context/DrawerContext": {
      useDrawer: () => ({
        openLib: () => reopened++, openLibFromDrawer: () => reopened++, libOpenedFromDrawer: true,
      }),
    },
  };
  new Function("require", "module", "exports", compiled)(
    (name: string) => { assert.ok(name in imports, name); return imports[name]; }, module, module.exports,
  );
  module.exports.useLibraryReturnBack("1")();
  assert.equal(closed, 1);
  assert.equal(reopened, 0);
  assert.equal(nativeBack, 0);
});
