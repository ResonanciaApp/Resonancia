import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import * as JSXRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../components/EditorialPlaylistCarousel.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const presses = new Map<string, () => void>();
let styles: Record<string, Record<string, unknown>>;
function Native({ children, style, testID, onPress, numberOfLines }: any) {
  const resolved = Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
  if (onPress && testID) presses.set(testID, onPress);
  return React.createElement("div", {
    "data-testid": testID,
    "data-editorial-pill": resolved.position === "absolute" && resolved.borderRadius === 999 ? "true" : undefined,
    "data-font-size": resolved.fontSize,
    "data-font-weight": resolved.fontWeight,
    "data-color": resolved.color,
    "data-lines": numberOfLines,
  }, children);
}
const mocks: Record<string, unknown> = {
  "@/components/CardCaptionText": { CardCaptionText: Native },
  react: React,
  "react/jsx-runtime": JSXRuntime,
  "@expo/vector-icons": { Feather: Native },
  "expo-image": { Image: Native },
  "expo-linear-gradient": { LinearGradient: Native },
  "react-native": {
    Dimensions: { get: () => ({ width: 402 }) },
    View: Native, Text: Native, ScrollView: Native,
    StyleSheet: { create: (input: typeof styles) => { styles = input; return input; }, absoluteFill: {}, absoluteFillObject: {} },
  },
  "@/constants/colors": { CARD_TEXT_ABOVE: "#FFF", CARD_TEXT_BELOW: "muted-caption" },
  "@/constants/imagePlaceholder": { BLUR_PLACEHOLDER: "placeholder", IMAGE_TRANSITION: 180 },
  "@/components/PressScale": { PressScale: Native },
  "@/context/PremiumContext": { usePremium: () => ({ isPremium: true }) },
  "@/components/SessionDurationBadge": {
    SessionBadgeGlass: Native,
    SessionDurationBadge: ({ label, showClock }: any) => React.createElement("span", { "data-clock": !!showClock }, label),
  },
};
const loaded = { exports: {} as { EditorialPlaylistCarousel: React.ComponentType<any> } };
new Function("require", "module", "exports", compiled)((name: string) => {
  assert.ok(name in mocks, `Missing mock for ${name}`);
  return mocks[name];
}, loaded, loaded.exports);
const Carousel = loaded.exports.EditorialPlaylistCarousel;
function render(type: string, placement?: string, onPress?: (playlist: any) => void) {
  return renderToStaticMarkup(React.createElement(Carousel, {
    title: "Playlists",
    playlists: [{ id: "sample", title: "Mi playlist", editorialType: type, durationLabel: "30 min", coverUrl: "/cover.png" }],
    editorialTextPlacement: placement,
    showDurationClock: true,
    onPress,
  }));
}

test("Discover renders editorial text below the title, not on the cover, preserving duration and navigation", () => {
  let selected: string | undefined;
  const html = render("Calma profunda", "below-title", playlist => { selected = playlist.id; });
  assert.ok(html.indexOf("Mi playlist") < html.indexOf("Calma profunda"));
  assert.match(html, /data-testid="editorial-playlist-description-sample"/);
  assert.doesNotMatch(html, /data-editorial-pill="true"/);
  assert.equal(html.match(/Calma profunda/g)?.length, 1);
  assert.match(html, /data-clock="true">30 min/);
  presses.get("editorial-playlist-sample")!();
  assert.equal(selected, "sample");
  assert.equal(styles!.cardDescription.fontSize, 10);
  assert.equal(styles!.cardDescription.fontWeight, "500");
  assert.equal(styles!.cardDescription.lineHeight, 15);
  assert.equal(styles!.cardDescription.marginTop, 4);
  assert.equal(styles!.cardDescription.color, "muted-caption");
});

test("historical values remain translated, custom labels stay literal, and none hides both presentations", () => {
  for (const [type, label] of [["meditative", "Meditativa"], ["relaxation", "Relajación"], ["ritual", "Ritual"], ["Respiración", "Respiración"]]) {
    assert.ok(render(type, "below-title").includes(label));
    const cover = render(type);
    assert.ok(cover.includes(label));
    assert.match(cover, /data-editorial-pill="true"/);
    assert.doesNotMatch(cover, /editorial-playlist-description-sample/);
  }
  for (const placement of ["below-title", "cover"]) {
    const html = render("none", placement);
    assert.doesNotMatch(html, /editorial-playlist-description-sample|data-editorial-pill="true"/);
    assert.match(html, /Mi playlist/);
  }
});

test("Discover opts into descriptions and Admin continues saving its existing editable field", () => {
  const discover = readFileSync(new URL("../app/(tabs)/explore.tsx", import.meta.url), "utf8");
  assert.match(discover, /<EditorialPlaylistCarousel[\s\S]*?editorialTextPlacement="below-title"/);
  const admin = readFileSync(new URL("../../resonancia-admin/src/pages/playlists.tsx", import.meta.url), "utf8");
  assert.match(admin, /onChange=\{\(e\) => set\("editorialType", e.target.value\)\}/);
  assert.match(admin, /editorialType: form.editorialType.trim\(\)/);
  assert.match(admin, /En Descubrir aparece como descripción debajo del título/);
});