import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import ts from "typescript";

const source = readFileSync(new URL("../app/galeria-reflexiones/index.tsx", import.meta.url), "utf8");
const tree = ts.createSourceFile("gallery.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const compile = (text: string) => ts.transpileModule(text, {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
}).outputText;
function find(predicate: (node: ts.Node) => boolean): any {
  let result: any;
  function visit(node: ts.Node) {
    if (predicate(node)) result = node;
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.ok(result);
  return result;
}
const styleCall = find(node => ts.isCallExpression(node) && node.expression.getText(tree) === "StyleSheet.create");
const styles = new Function("CARD_MARGIN", compile(`return (${styleCall.arguments[0].getText(tree)});`))(8);
const card = find(node => ts.isVariableDeclaration(node) && node.name.getText(tree) === "renderItem");
const render = new Function("React", "Pressable", "StoryArtworkFrame", "View", "Text", "StyleSheet",
  "styles", "cardWidth", "coverCatalog", "reflectionCategories", "resolveProfileAvatarSource", "qc",
  "getGetMyReflectionStoryQueryKey", "clerkUserId", "router",
  compile(`return (${card.initializer.getText(tree)});`));

test("gallery matches Muro's title size, starts cards 20px lower and separates rows by 25px without changing columns", () => {
  const wallSource = readFileSync(new URL("../app/mi-espacio-interior.tsx", import.meta.url), "utf8");
  const wallTitle = wallSource.match(/mainTitle:\s*\{\s*fontSize:\s*(\d+)/);
  assert.ok(wallTitle);
  assert.equal(styles.mainTitle.fontSize, Number(wallTitle[1]));
  assert.equal(styles.mainTitle.fontSize, 18);
  assert.equal(styles.listContent.paddingTop, 20);
  assert.equal(styles.columnWrapper.marginBottom, 25);
  assert.equal(styles.listContent.paddingHorizontal, 20);
  assert.match(source, /const CARD_MARGIN = 8;/, "horizontal card gap remains unchanged");
  assert.match(source, /contentContainerStyle=\{styles\.listContent\}/);
  assert.match(source, /columnWrapperStyle=\{styles\.columnWrapper\}/);
});

function mount(categoryId = "gratitude") {
  const cache: any[] = [], routes: string[] = [];
  const item = {
    id: "story-id", createdAt: "2026-10-09T12:00:00Z", category: categoryId,
    backgroundPresetKey: "cover-id", avatarImagePath: "avatar-path", message: "Mi historia",
    avatarX: 0.3, avatarY: 0.4, backgroundScale: 1.2, backgroundX: 0.1, backgroundY: 0.2,
    textX: 0.1, textY: 0.3, textScale: 1.4,
  };
  const artworkSource = { uri: "cover-path" };
  const categories = {
    gratitude: { color: "#F075B3", label: "Gratitud" },
    clarity: { color: "#5FA1CA", label: "Claridad" },
  };
  const element = render(React, "pressable", "artwork", "view", "text",
    { absoluteFill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } },
    styles, 177, [{ key: "cover-id", source: artworkSource }], categories,
    ({ avatarUrl }: any) => ({ uri: avatarUrl }), { setQueryData: (...args: any[]) => cache.push(args) },
    (id: string) => ["/api/me/reflection-stories", id], "viewer-id",
    { push: (route: string) => routes.push(route) })({ item });
  return { element, item, artworkSource, cache, routes, categories };
}

test("gallery metadata flows below the full artwork: pill at 10px and date 8px below pill, without a black strip", () => {
  const { element } = mount();
  const [artwork, metadata] = React.Children.toArray(element.props.children) as any[];
  assert.equal(artwork.type, "artwork");
  assert.equal(metadata.props.style.marginTop, 10);
  assert.equal(metadata.props.style.position, undefined);
  assert.equal(metadata.props.style.backgroundColor, undefined);
  assert.equal(element.props.style[0].overflow, undefined, "metadata is not clipped by artwork corner rounding");
  const [pill, date] = React.Children.toArray(metadata.props.children) as any[];
  assert.equal(pill.props.style, styles.categoryPill);
  assert.equal(date.props.style.marginTop, 8);
  assert.doesNotMatch(source, /cardOverlay|cardMetaRow|rgba\(0,0,0,0\.4\)/);
});

test("gallery pills match Muro's 20% category color, white 500-weight 11pt text and 10px radius", () => {
  for (const categoryId of ["gratitude", "removed-category"]) {
    const { element, categories } = mount(categoryId);
    const metadata = (React.Children.toArray(element.props.children) as any[])[1];
    const pill = (React.Children.toArray(metadata.props.children) as any[])[0];
    const [background, label] = React.Children.toArray(pill.props.children) as any[];
    const expected = categoryId === "gratitude" ? categories.gratitude : categories.clarity;
    assert.equal(background.props.pointerEvents, "none");
    assert.equal(background.props.style[1].backgroundColor, expected.color);
    assert.equal(background.props.style[1].opacity, 0.2);
    assert.equal(label.props.style.color, "#F9F9F9");
    assert.equal(label.props.style.fontWeight, "500");
    assert.equal(label.props.style.fontSize, 11);
    assert.equal(label.props.children, expected.label);
    assert.equal(pill.props.style.borderRadius, 10);
    assert.equal(pill.props.style.paddingHorizontal, 10);
    assert.equal(pill.props.style.paddingVertical, 4);
    assert.equal(pill.props.style.opacity, undefined);
  }
});

test("gallery card still preserves the story composition and seeds account-scoped detail cache before navigating", () => {
  const { element, item, artworkSource, cache, routes } = mount();
  const artwork = (React.Children.toArray(element.props.children) as any[])[0];
  assert.equal(artwork.props.bgImageSource, artworkSource);
  assert.equal(artwork.props.width, 177);
  assert.deepEqual(artwork.props.avatarPosition, { x: 0.3, y: 0.4 });
  assert.deepEqual(artwork.props.avatarSource, { uri: "avatar-path" });
  assert.deepEqual(artwork.props.composition, {
    backgroundScale: 1.2, backgroundX: 0.1, backgroundY: 0.2, textX: 0.1, textY: 0.3, textScale: 1.4,
  });
  element.props.onPress();
  assert.deepEqual(cache, [[["/api/me/reflection-stories", "story-id", "viewer-id"], item]]);
  assert.deepEqual(routes, ["/galeria-reflexiones/story-id"]);
});
