import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { getThemeStyleId, SCENE_THEMES } from "../config/scene-themes.ts";

const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url).pathname, "utf8");
const golden = readFileSync(new URL("../components/GoldenAvatarSheet.tsx", import.meta.url).pathname, "utf8");
const motion = readFileSync(new URL("../hooks/useGrowthJourneySheetMotion.ts", import.meta.url).pathname, "utf8");

function harness(themeId: keyof typeof SCENE_THEMES) {
  const nodes = new Map<string, any>();
  const texts: unknown[] = [];
  const gradients: any[] = [];
  const Native = (props: any) => {
    if (props.testID) nodes.set(props.testID, props);
    if (props.contentContainerStyle) nodes.set("golden-avatar-scroll-content", props);
    return React.createElement("div", {}, props.children);
  };
  const mocks: Record<string, any> = {
    react: React,
    "react-native": { View: Native, ScrollView: Native, Animated: { View: Native }, Pressable: Native,
      Text: (props: any) => { texts.push(props.children); return React.createElement(Native, props); },
      StyleSheet: { create: (s: any) => s, absoluteFill: {}, absoluteFillObject: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } } },
    "@expo/vector-icons": { Feather: Native },
    "expo-linear-gradient": { LinearGradient: (props: any) => { gradients.push(props); return React.createElement(Native, props); } },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 20 }) },
    "@/config/scene-themes": { getThemeStyleId, SCENE_THEMES },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: SCENE_THEMES[themeId] }) },
  };
  const module = { exports: {} as any };
  const compiled = ts.transpileModule(golden, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  new Function("require", "module", "exports", compiled)((id: string) => {
    assert.ok(id in mocks, `Missing mock ${id}`); return mocks[id];
  }, module, module.exports);
  return { ...module.exports, nodes, texts, gradients };
}

test("Avatar dorado explains the unique prize, shares the native host and can close by X or scrim in every theme", () => {
  assert.doesNotMatch(golden, /<Modal\b/);
  for (const id of ["tibet", "cloudy", "natural", "pleyades"] as const) {
    const h = harness(id);
    let closes = 0;
    const props = { motion: { rendered: true, sheetY: 0, backdropOpacity: 0.62 }, sheetHeight: 874 * 0.85 - 200, onClose: () => closes++ };
    renderToStaticMarkup(React.createElement(h.GoldenAvatarSheet, props));
    assert.ok(h.texts.includes("Avatar dorado"));
    assert.ok(h.texts.includes("?"));
    assert.match(h.texts.filter((text: unknown) => typeof text === "string").join(" "), /avatar dorado/i);
    assert.ok(h.nodes.has("golden-avatar-description"));
    assert.match(h.nodes.get("golden-avatar-description").children, /único avatar dorado: el avatar premiado/);
    const heroStyle = h.nodes.get("golden-avatar-hero-circle").style;
    assert.equal(heroStyle.width, 115.5);
    assert.equal(heroStyle.height, 115.5);
    assert.equal(heroStyle.backgroundColor, "#000000");
    assert.equal(h.nodes.get("golden-avatar-question").style.color, "#F9F9F9");
    const decorations = h.nodes.get("golden-avatar-decorations");
    assert.equal(decorations.pointerEvents, "none");
    assert.equal(decorations.importantForAccessibility, "no-hide-descendants");
    assert.equal(h.nodes.get("golden-avatar-title").style.textAlign, "center");
    assert.equal(h.nodes.get("golden-avatar-title").style.fontSize, 16);
    assert.equal(h.nodes.get("golden-avatar-header").style.minHeight, 63);
    assert.equal(h.nodes.get("golden-avatar-header").style.paddingTop, 20);
    const closeStyles = Object.assign({}, ...h.nodes.get("golden-avatar-close").style);
    assert.equal(closeStyles.left, 0);
    assert.equal(closeStyles.top, 20);
    assert.equal(closeStyles.width, 43);
    const sheetStyle = Object.assign({}, ...h.nodes.get("golden-avatar-sheet").style);
    assert.equal(sheetStyle.height, props.sheetHeight);
    const bodyStyle = Object.assign({}, ...h.nodes.get("golden-avatar-scroll-content").contentContainerStyle);
    assert.equal(bodyStyle.paddingTop, 30);
    h.nodes.get("golden-avatar-close").onPress();
    h.nodes.get("golden-avatar-backdrop-close").onPress();
    assert.equal(closes, 2);
    assert.equal(h.nodes.get("golden-avatar-overlay").accessibilityViewIsModal, true);
    const theme = SCENE_THEMES[id];
    assert.deepEqual(h.gradients[0].colors, getThemeStyleId(id) === "cloudy" ? theme.gradient.slice(0, 4)
      : getThemeStyleId(id) === "indigo2" ? SCENE_THEMES.tibet.gradient.slice(1, 3) : theme.gradient.slice(1, 3));
    assert.equal(renderToStaticMarkup(React.createElement(h.GoldenAvatarSheet, { ...props, motion: { ...props.motion, rendered: false } })), "");
  }
});

test("avatar picker waits for fade-out and native dismissal before invoking the phone photo library", () => {
  assert.match(profile, /visible=\{accountPhotoPickerVisible \|\| avatarPickerMotion.rendered\}/);
  assert.match(profile, /animationType="none"[\s\S]*?onRequestClose=\{closeAvatarPicker\}/);
  assert.match(profile, /opacity: avatarPickerMotion.backdropOpacity/);
  assert.match(profile, /translateY: avatarPickerMotion.sheetY/);
  assert.match(profile, /accountPhotoPickerVisible \|\| avatarPickerMotion.rendered[\s\S]*?\|\| !accountPhotoLibraryPending/);
  assert.match(profile, /onDismiss=\{\(\) => \{[\s\S]*?requestAnimationFrame\(\(\) => \{[\s\S]*?void pickPhoto\(\)/);
  assert.match(profile, /<GoldenAvatarSheet motion=\{goldenAvatarMotion\} sheetHeight=\{goldenAvatarHeight\}/);
  assert.match(profile, /importantForAccessibility=\{goldenAvatarActive \? "no-hide-descendants" : "auto"\}/);
});

test("Android Back closes the celebration first and leaves the avatar draft and picker intact", () => {
  const ast = ts.createSourceFile("Profile.tsx", profile, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "closeAvatarPicker") handler = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(handler);
  const body = ts.transpileModule(`return (${handler.getText(ast)});`, {}).outputText;
  for (const active of [true, false]) {
    const calls: string[] = [];
    new Function("goldenAvatarActive", "setGoldenAvatarVisible", "setAccountPhotoPickerVisible", body)(
      active, () => calls.push("golden"), () => calls.push("picker"),
    )();
    assert.deepEqual(calls, [active ? "golden" : "picker"]);
  }
});

test("both avatar overlays reuse Vuelve a ti timing and retain their host through completed fade-out", () => {
  assert.match(motion, /toValue: 0.62,\s+duration: 500/);
  assert.match(motion, /toValue: 0,\s+duration: 460/);
  assert.match(motion, /if \(finished\)[\s\S]*?setRendered\(false\)/);
  assert.match(profile, /useGrowthJourneySheetMotion\(accountPhotoPickerVisible, height \* 0.85\)/);
  assert.match(profile, /const goldenAvatarHeight = Math.max\(200, height \* 0.85 - 200\)/);
  assert.match(profile, /useGrowthJourneySheetMotion\(goldenAvatarVisible && accountPhotoPickerVisible, goldenAvatarHeight\)/);
});
