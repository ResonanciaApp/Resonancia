import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const sleep = read("../app/(tabs)/descanzo.tsx");
const sound = read("../app/(tabs)/sonidos.tsx");
function find(source: string, predicate: (node: ts.Node) => boolean) {
  const ast = ts.createSourceFile("screen.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result: ts.Node | undefined;
  function visit(node: ts.Node) {
    if (!result && predicate(node)) result = node;
    if (!result) ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(result);
  return { node: result, ast };
}
function evaluate(expression: string, bindings: Record<string, unknown>) {
  const compiled = ts.transpileModule(`return (${expression});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  return new Function(...Object.keys(bindings), compiled)(...Object.values(bindings));
}
function style(source: string, name: string) {
  const { node, ast } = find(source, node => ts.isPropertyAssignment(node) && node.name.getText() === name);
  return evaluate((node as ts.PropertyAssignment).initializer.getText(ast), {
    StyleSheet: { hairlineWidth: 0.333 }, H_PAD: 16, SECTION_EXTRA_GAP: 5,
  });
}

for (const [name, source, titleCount] of [["Dormir", sleep, 3], ["Sonidos", sound, 2]] as const) {
  test(`${name}: all section carousel titles grow from 17 to 19 points`, () => {
    assert.equal((source.match(/titleSize=\{19\}/g) ?? []).length, titleCount);
    assert.doesNotMatch(source, /titleSize=\{17\}/);
  });
  test(`${name}: hidden dividers preserve the existing gap`, () => {
    const spacer = style(source, "sectionSpacer");
    assert.equal(spacer.opacity, 0);
    assert.equal(spacer.backgroundColor, "rgba(255,255,255,0.12)");
    assert.equal(spacer.borderWidth, undefined);
    assert.equal(spacer.marginTop, 26 + spacer.marginBottom);
    assert.equal(spacer.height, 0.333);
    const oldGap = 26 + 0.333 + 26;
    const newGap = spacer.marginTop + spacer.height + spacer.marginBottom + 26;
    assert.equal(Math.round((newGap - oldGap) * 1000) / 1000, 5);
    assert.doesNotMatch(source, /styles\.sectionDivider/);
  });
}

function sleepCarousel(isPremium: boolean, hasFeatured: boolean) {
  const { node, ast } = find(sleep, node => ts.isVariableDeclaration(node) && node.name.getText() === "renderSleepCarousel");
  const expression = (node as ts.VariableDeclaration).initializer!.getText(ast);
  return evaluate(expression, {
    React, isPremium, featuredSleepSessions: hasFeatured ? [{}] : [],
    SECTION_EXTRA_GAP: 5, H_PAD: 16, SLEEP_CAROUSEL_CARD_W: 160,
    styles: {
      sectionSpacer: style(sleep, "sectionSpacer"),
      bannerDividerGap: style(sleep, "bannerDividerGap"),
      bannerSectionDivider: style(sleep, "bannerSectionDivider"),
      sectionExtraSpacing: style(sleep, "sectionExtraSpacing"),
    },
    SessionCarousel: "session-carousel", EditorialPlaylistCarousel: "playlist-carousel",
    View: "view", PremiumBanner: "premium-banner",
    handleSessionTap: () => {}, openCategory: () => {},
    sleepCarouselViewAllHandlers: { sample: () => {} },
  });
}

test("Dormir preserves the first carousel offset for both sessions and playlists", () => {
  for (const playlist of [false, true]) {
    const item = playlist
      ? { key: "playlist", playlist: { title: "Playlist", playlists: [] } }
      : { key: "session", session: { id: "sample", label: "Sesiones", sessions: [] } };
    const render = sleepCarousel(true, false);
    assert.equal(render(item, 0).props.children[1].props.style.marginTop, 33);
    assert.equal(render(item, 1).props.children[1].props.style.marginTop, 26);
    assert.equal(render(item, 1).props.children[1].props.titleSize, 19);
  }
});

test("Dormir keeps centered dividers on both sides of the free-user banner without moving sections", () => {
  for (const playlist of [false, true]) {
    const item = playlist
      ? { key: "playlist", playlist: { title: "Playlist", playlists: [] } }
      : { key: "session", session: { id: "sample", label: "Sesiones", sessions: [] } };
    const render = sleepCarousel(false, false);
    const first = render(item, 0);
    assert.equal(first.props.children[2].props.style.paddingTop, 5);
    const second = render(item, 1);
    assert.equal(second.props.children[0].props.style.height, 0);
    const line = second.props.children[0].props.children.props.style;
    assert.equal(line.opacity, 0);
    assert.equal(line.top + line.height / 2, 31 / 2);
    assert.equal(line.backgroundColor, "rgba(255,255,255,0.12)");
    assert.equal(second.props.children[1].props.style.marginTop, 31);
    const withFeatured = sleepCarousel(false, true)(item, 1);
    assert.ok(withFeatured.props.children[0]);
    assert.equal(withFeatured.props.children[1].props.style.marginTop, 26);
  }
  assert.match(sleep, /!isPremium \? \(\s*<View style=\{styles\.sectionExtraSpacing\}>\s*<View pointerEvents="none" style=\{styles\.bannerSectionDivider\} \/>\s*<PremiumBanner sleepVariant/);
});

test("Sonidos preserves the first carousel position and keeps dividers around banners", () => {
  assert.equal(style(sound, "firstCarousel").marginTop, 33);
  assert.equal(style(sound, "carouselAfterSpacer").marginTop, 26);
  assert.match(sound, /index === 1 && !isPremium[\s\S]*?styles\.sectionSpacer[\s\S]*?<SoundPremiumBanner/);
  assert.match(sound, /styles\.stickyBorder/);
  assert.match(sleep, /styles\.stickyDivider/);
});