import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const publicSource = readFileSync("app/usuario/[id].tsx", "utf8");
const ownSource = readFileSync("components/ProfileScreenBase.tsx", "utf8");
function styleProperties(source: string, key: string) {
  const file = ts.createSourceFile("screen.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let properties: Record<string, string> | undefined;
  function walk(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(file) === key && ts.isObjectLiteralExpression(node.initializer)) {
      properties = Object.fromEntries(node.initializer.properties.filter(ts.isPropertyAssignment).map((p) => [
        p.name.getText(file), p.initializer.getText(file).replace(/\s/g, ""),
      ]));
    }
    ts.forEachChild(node, walk);
  }
  walk(file);
  assert.ok(properties, `Missing style ${key}`);
  return properties;
}
const baseProfile = {
  id: 123, displayName: "Nombre real", avatarUrl: "https://example.invalid/avatar.webp",
  avatarPresetId: null, lifeMotto: "Respirar y avanzar", longDescription: "Mi descripción completa.",
  isPremium: true, totalActiveDays: 500,
};
let profile: typeof baseProfile | null = baseProfile;
let loading = false;
let backCount = 0;
type NodeRecord = { kind: string; testID?: string; style: Record<string, unknown>; children?: React.ReactNode; onPress?: () => void };
let nodes: NodeRecord[] = [];
function flatten(style: unknown): Record<string, unknown> {
  return Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style && typeof style === "object" ? style as Record<string, unknown> : {};
}
function native(kind: string) {
  return ({ style, children, testID, onPress }: { style?: unknown; children?: React.ReactNode; testID?: string; onPress?: () => void }) => {
    nodes.push({ kind, testID, style: flatten(style), children, onPress });
    return React.createElement("div", { "data-testid": testID }, children);
  };
}
const componentModule: { exports: { default?: React.ComponentType } } = { exports: {} };
const mocks: Record<string, unknown> = {
  react: React,
  "react-native": {
    View: native("View"), Text: native("Text"), Pressable: native("Pressable"),
    ScrollView: native("ScrollView"), ActivityIndicator: native("Loader"), StatusBar: () => null,
    StyleSheet: { create: (styles: unknown) => styles }, Platform: { OS: "ios" },
  },
  "expo-router": { router: { back: () => { backCount++; } }, useLocalSearchParams: () => ({ id: "123" }) },
  "expo-image": { Image: native("Image") },
  "@expo/vector-icons": { Feather: native("Icon"), MaterialCommunityIcons: native("Icon") },
  "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 24, bottom: 0 }) },
  "@workspace/api-client-react": {
    useGetPublicUserProfile: () => ({ data: profile, isLoading: loading, isError: false }),
    getGetPublicUserProfileQueryKey: () => ["public", 123],
    useGetUserGrowth: () => ({ data: { currentStage: { name: "Intención" } } }),
    getGetUserGrowthQueryKey: (id: string) => ["public-growth", id],
  },
  "@/hooks/useColors": { useColors: () => ({ foreground: "#F9F9F9", primary: "#BE9650", secondary: "#060A0F" }) },
  "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { id: "cloudy", gradient: ["#060A0F"] } }) },
  "@/components/SceneThemeBackground": { SceneThemeBackground: () => null },
  "@/components/GrowthJourney": { GrowthCurrentStagePill: ({ stage }: { stage: { name: string } | null }) => stage ? React.createElement("div", { "data-shared-stage": true }, stage.name) : null },
  "@/components/SessionDurationBadge": { SessionBadgeGlass: () => React.createElement("div", { "data-shared-premium-background": true }) },
  "@/lib/profile-avatar": { useProfileAvatarSource: (p: typeof baseProfile) => p.avatarUrl ? { uri: p.avatarUrl } : null },
  "@/constants/imagePlaceholder": {},
  "@/constants/colors": { MEMBERSHIP_AURORA: { premium: { accent: "#BE9650" } } },
};
const compiled = ts.transpileModule(publicSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
new Function("require", "module", "exports", compiled)((name: string) => {
  assert.ok(name in mocks, `Missing mock ${name}`);
  return mocks[name];
}, componentModule, componentModule.exports);
function render(overrides: Partial<typeof baseProfile> = {}) {
  profile = { ...baseProfile, ...overrides };
  loading = false;
  nodes = [];
  return renderToStaticMarkup(React.createElement(componentModule.exports.default!));
}

test("public identity uses precisely the own-profile sizes, type and inner spacing", () => {
  for (const key of ["avatarWrapper", "avatarImage", "avatarPremiumBadge", "profileDetails", "profileNameRow", "profileNameText", "userName", "profileBiography", "profileLifeMotto", "profileDescription"]) {
    assert.deepEqual(styleProperties(publicSource, key), styleProperties(ownSource, key), key);
  }
  assert.deepEqual(styleProperties(publicSource, "profileCard"), styleProperties(ownSource, "profileIdentityRow"));
});
test("description and life motto shrink one point without changing line heights or spacing", () => {
  for (const source of [ownSource, publicSource]) {
    const motto = styleProperties(source, "profileLifeMotto");
    const description = styleProperties(source, "profileDescription");
    assert.equal(motto.fontSize, "18");
    assert.equal(motto.lineHeight, "27");
    assert.equal(motto.marginTop, "7");
    assert.equal(motto.fontWeight, '"700"');
    assert.equal(description.fontSize, "13");
    assert.equal(description.lineHeight, "20");
  }
});
test("renders actual identity in order and stops at description", () => {
  const html = render();
  const ordered = ["public-profile-back", "public-profile-premium-badge", "public-profile-name", "data-shared-stage", "public-profile-life-motto", "public-profile-long-description"];
  let previous = -1;
  for (const marker of ordered) {
    const index = html.indexOf(marker);
    assert.ok(index > previous, marker);
    previous = index;
  }
  assert.match(html, /Nombre real/);
  assert.match(html, /Respirar y avanzar/);
  assert.match(html, /Mi descripción completa/);
  assert.doesNotMatch(html, /500 días|Sus mezclas|Sus reflexiones|Enviar mensaje|Agregar a amigos|Mi rutina|Progreso semanal/);
  assert.equal(nodes.filter((n) => n.kind === "Pressable").length, 1);
  const image = nodes.find((n) => n.kind === "Image")!;
  assert.equal(image.style.width, 124);
  assert.equal(image.style.height, 124);
  assert.equal(image.style.borderWidth, undefined);
  assert.equal(nodes.find((n) => n.testID === "public-profile-long-description")!.style.color, "#C4C4C4");
});
test("back control is above the avatar, has a circular background and really navigates", () => {
  render();
  const back = nodes.find((n) => n.testID === "public-profile-back")!;
  assert.equal(back.style.width, 43);
  assert.equal(back.style.height, 43);
  assert.equal(back.style.backgroundColor, "rgba(0,0,0,0.16)");
  const initial = backCount;
  back.onPress!();
  assert.equal(backCount, initial + 1);
  assert.match(publicSource, /paddingTop: 20/);
  assert.doesNotMatch(publicSource, /dedicatedProfileCard|marginTop: -/);
});
test("missing optional identity fields do not invent a motto or Premium badge", () => {
  const html = render({ isPremium: false, lifeMotto: "", longDescription: "" });
  assert.doesNotMatch(html, /public-profile-premium-badge|public-profile-life-motto|public-profile-long-description/);
  assert.match(html, /data-shared-stage/);
  assert.doesNotMatch(render({ isPremium: null as unknown as boolean }), /public-profile-premium-badge/);
});
test("loading and unavailable profiles preserve a working back control", () => {
  loading = true;
  nodes = [];
  renderToStaticMarkup(React.createElement(componentModule.exports.default!));
  assert.ok(nodes.some((n) => n.kind === "Loader"));
  assert.ok(nodes.some((n) => n.testID === "public-profile-back"));
  loading = false;
  profile = null;
  nodes = [];
  const html = renderToStaticMarkup(React.createElement(componentModule.exports.default!));
  assert.match(html, /Perfil no disponible/);
  assert.ok(nodes.some((n) => n.testID === "public-profile-back"));
});
