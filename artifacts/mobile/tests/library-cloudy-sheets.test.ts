import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import ts from "typescript";
import { getThemeStyleId, isIndigo2ThemeId, SCENE_THEMES } from "../config/scene-themes.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const gradient = ["#2D2F7C", "#2D3981", "#2D4085", "#2A4687", "#25528C", "#1F5D92", "#166494"];
let theme = { id: "cloudy", gradient, gradientStart: { x: 0.5, y: 0 }, gradientEnd: { x: 0.5, y: 1 } };
const mocks: Record<string, unknown> = {
  "@/config/scene-themes": { getThemeStyleId },
  react: React,
  "react-native": { StyleSheet: { absoluteFill: { position: "absolute" } } },
  "expo-linear-gradient": { LinearGradient: () => null },
  "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme }) },
};
const component = { exports: {} as { LibraryCreationBackground: (props: object) => React.ReactElement<any> | null } };
new Function("require", "exports", ts.transpileModule(read("../components/LibraryCreationBackground.tsx"), {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText)((name: string) => {
  assert.ok(name in mocks, name);
  return mocks[name];
}, component.exports);

test("creation backgrounds use exactly the first four Cloudy stops and leave all other themes unchanged", () => {
  for (const id of ["cloudy", "cloudy2", "indigo2", "tibet"]) {
    theme = { ...theme, id };
    const result = component.exports.LibraryCreationBackground({ style: { borderTopLeftRadius: 22 } });
    if (id !== "cloudy") { assert.equal(result, null); continue; }
    assert.ok(result);
    assert.deepEqual(result.props.colors, gradient.slice(0, 4));
    assert.deepEqual(result.props.locations, [0, 1 / 3, 2 / 3, 1]);
    assert.deepEqual(result.props.start, theme.gradientStart);
    assert.deepEqual(result.props.end, theme.gradientEnd);
    assert.equal(result.props.pointerEvents, "none");
    assert.equal(result.props.style[1].borderTopLeftRadius, 22);
  }
});

test("all six Biblioteca creation surfaces include the Cloudy background", () => {
  const source = read("../components/BibliotecaScreen.tsx");
  assert.equal((source.match(/<LibraryCreationBackground\b/g) ?? []).length, 6);
  for (const name of ["NombreCarpetaModal", "NombrePlaylistModal", "NombreCarpetaMezclaModal", "NombreCarpetaFavModal", "CreateSheet"]) {
    const body = source.split(`function ${name}(`)[1].split("\nfunction ")[0];
    assert.match(body, /<LibraryCreationBackground \/>/, name);
  }
  assert.match(source, /styles\.addResModalSheet[\s\S]*?<LibraryCreationBackground style=/);
});

test("long-press menus use Natural first stop and Cloudy last stop only in Biblioteca", () => {
  for (const [file, variable, scope] of [
    ["PlaylistActionsSheet", "sheetColor", "librarySurface"],
    ["FavoriteActionsSheet", "sheetSolid", "librarySurface"],
    ["MixActionsSheet", "sheetColor", "libraryActionsOnly"],
  ]) {
    const source = read(`../components/${file}.tsx`);
    const expression = source.match(new RegExp(`const ${variable} = ([\\s\\S]*?);`))?.[1];
    assert.ok(expression);
    const resolve = new Function("theme", scope, "getThemeStyleId", `return (${expression});`);
    for (const id of ["natural", "pleyades", "cloudy", "cloudy2", "indigo2", "tibet"]) {
      for (const library of [true, false]) {
        assert.equal(resolve({ id, gradient }, library, getThemeStyleId), library && id === "natural" ? gradient[0] : id === "cloudy" && library ? gradient[6] : gradient[2]);
      }
    }
  }
  const library = read("../components/BibliotecaScreen.tsx");
  assert.match(library, /<PlaylistActionsSheet\s+librarySurface/);
  assert.match(library, /<FavoriteActionsSheet\s+librarySurface/);
  assert.match(library, /<MixActionsSheet[\s\S]*?libraryActionsOnly/);
});

test("Natural and Cloudy resonador long press open a themed confirmation and retain native alerts for other themes", () => {
  const source = read("../components/BibliotecaScreen.tsx");
  assert.match(source, /if \(sceneTheme\.id === "cloudy" \|\| sceneTheme\.id === "natural"\) \{\s+setResonadorToUnfollow\(\{ id, name \}\);\s+return;\s+\}\s+Alert\.alert/);
  assert.match(source, /visible=\{resonadorToUnfollow !== null\}/);
  assert.match(source, /backgroundColor: libraryActionsColor[\s\S]*?>Dejar de seguir</);
  assert.match(source, /saveFollowed\(followedIds\.filter\(\(id\) => id !== resonadorToUnfollow\.id\)\)/);
  assert.match(source, />Cancelar</);
});

test("resonador action background uses first Natural stop without changing creation backgrounds", () => {
  const source = read("../components/BibliotecaScreen.tsx");
  const expr = source.match(/const libraryActionsColor = ([^;]+);/)![1];
  const resolve = new Function("sceneTheme", "librarySheetColor", `return (${expr});`);
  for (const theme of Object.values(SCENE_THEMES)) {
    const last = theme.gradient[theme.gradient.length - 1];
    assert.equal(resolve(theme, last), theme.id === "natural" ? theme.gradient[0] : last);
  }
  assert.match(source, /styles\.addResModalSheet, \{ backgroundColor: librarySheetColor \}/);
});

test("Agregar Resonador has no search, centers title and has a left close button and subtle handle", () => {
  const source = read("../components/BibliotecaScreen.tsx");
  assert.doesNotMatch(source, /addResSearch|addResonadorQ|setAddResonadorQ/);
  assert.match(source, /addResModalHeader: \{[^}]*justifyContent: "center"/);
  assert.match(source, /addResClose: \{ position: "absolute", left: H_PAD \}/);
  assert.match(source, /addResHandle: \{[^}]*backgroundColor: "rgba\(255,255,255,0\.1\)"/);
  assert.doesNotMatch(source.match(/addResFollowButton: \{[^}]*\}/)![0], /borderWidth|borderColor/);
});
