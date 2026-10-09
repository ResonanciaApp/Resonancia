import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import ts from "typescript";

const source = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
const compile = (text: string) => ts.transpileModule(text, {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
}).outputText;
const flatten = (style: any) => Object.assign({}, ...(Array.isArray(style) ? style.filter(Boolean) : [style]));
function ast(text: string) {
  return ts.createSourceFile("fixture.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}
function find(tree: ts.Node, predicate: (node: ts.Node) => boolean): any {
  let result: any;
  function visit(node: ts.Node) {
    if (predicate(node)) result = node;
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.ok(result);
  return result;
}
function styles(tree: ts.SourceFile, keys: string[]) {
  const call = find(tree, node => ts.isCallExpression(node)
    && node.expression.getText(tree) === "StyleSheet.create");
  return Object.fromEntries(call.arguments[0].properties
    .filter((entry: any) => keys.includes(entry.name.getText(tree)))
    .map((entry: any) => [entry.name.getText(tree), new Function("INNER_SPACE_CARD_BOTTOM_MARGIN",
      compile(`return (${entry.initializer.getText(tree)});`))(32)]));
}

test("Muro expansivo filters keep selected colors, use theme-specific inactive black and expand Todos' stroke", () => {
  const tree = ast(source("../app/mi-espacio-interior.tsx"));
  const row = find(tree, node => ts.isJsxElement(node)
    && node.openingElement.tagName.getText(tree) === "ScrollView"
    && node.getText(tree).includes('label="Todos"'));
  const wallStyles = styles(tree, ["filtersContent", "filterPill", "filterPillCategory",
    "filterPillSelected", "filterPillInactive", "filterPillAllInactive", "filterText"]);
  const render = new Function("React", "ScrollView", "Pressable", "ReflectionCategoryTabFill",
    "ReflectionCategoryTabLabel", "ReflectionCategoryTabBorder", "styles", "reflectionCategoryOptions",
    "filter", "setFilter", "disableWallAnimations", "Haptics", "reduceMotion", "inactiveTabBackground",
    compile(`return (${row.getText(tree)});`));
  const options = [{ id: "gratitude", label: "Gratitud", color: "#F075B3" },
    { id: "custom", label: "Editorial", color: "#123456" }];
  const palette = find(tree, node => ts.isVariableDeclaration(node)
    && node.name.getText(tree) === "inactiveTabBackground");
  const background = new Function("theme", compile(`return (${palette.initializer.getText(tree)});`));
  for (const id of ["cloudy", "natural", "indigo2", "pleyades"]) {
  const inactive = background({ id });
  assert.equal(inactive, id === "cloudy" || id === "natural" ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)");
  for (const filter of ["all", "gratitude"]) {
    for (const reduceMotion of [false, true]) {
      const changed: string[] = [], impacts: string[] = [];
      let disabledAnimations = 0;
      const result = render(React, "scroll", "pressable", "fill", "label", "border", wallStyles,
        options, filter, (next: string) => changed.push(next), () => disabledAnimations++,
        { impactAsync: async (kind: string) => { impacts.push(kind); }, ImpactFeedbackStyle: { Soft: "soft" } },
        reduceMotion, inactive);
      const [all, ...categories] = React.Children.toArray(result.props.children) as any[];
      const allChildren = React.Children.toArray(all.props.children) as any[];
      assert.equal(allChildren.some(child => child.type === "fill"), false);
      assert.equal(flatten(all.props.style).backgroundColor, filter === "all" ? "rgba(0,0,0,0.16)" : inactive);
      assert.equal(flatten(all.props.style).borderWidth, filter === "all" ? 1 : 3);
      assert.equal(flatten(all.props.style).paddingHorizontal + flatten(all.props.style).borderWidth, 17,
        "Todos retains its outer dimensions with the 3px inactive stroke");
      assert.equal(allChildren.find(child => child.type === "label").props.uniformWeight, undefined);
      if (filter === "all") {
        const border = allChildren.find(child => child.type === "border");
        assert.equal(border.props.borderWidth, 3);
        assert.equal(border.props.opacity, 0.75);
        assert.equal(border.props.inset, -1);
      }
      for (let index = 0; index < categories.length; index++) {
        const tab = categories[index];
        const tabStyle = flatten(tab.props.style);
        assert.equal(tabStyle.borderWidth, 0);
        assert.equal(tabStyle.height, 51);
        assert.equal(tabStyle.paddingHorizontal, 17);
        assert.equal(tabStyle.backgroundColor, undefined);
        const children = React.Children.toArray(tab.props.children) as any[];
        assert.equal(children.some(child => child.type === "border"), false);
        const fill = children.find(child => child.type === "fill");
        assert.equal(fill.props.color, options[index].color);
        assert.equal(fill.props.selected, filter === options[index].id);
        assert.equal(fill.props.reduceMotion, reduceMotion);
        assert.equal(fill.props.selectedOpacity, 0.6);
        assert.equal(fill.props.inactiveBackgroundColor, inactive);
        const label = children.find(child => child.type === "label");
        assert.equal(label.props.uniformWeight, true);
        assert.equal(label.props.textStyle.fontSize, 13);
      }
      categories[1].props.onPress();
      assert.deepEqual(changed, ["custom"]);
      assert.deepEqual(impacts, ["soft"]);
      assert.equal(disabledAnimations, 1);
      all.props.onPress();
      assert.deepEqual(changed, filter === "all" ? ["custom"] : ["custom", "all"]);
    }
  }
  }
});

test("message category pills use their editorial color at 20% and full-white 500-weight text", () => {
  const tree = ast(source("../app/mi-espacio-interior.tsx"));
  const wallStyles = styles(tree, ["cardCatPill", "cardCatText", "filterText"]);
  const pill = find(tree, node => ts.isJsxElement(node)
    && node.openingElement.tagName.getText(tree) === "View"
    && node.openingElement.attributes.getText(tree).includes("styles.cardCatPill"));
  const render = new Function("React", "View", "Text", "StyleSheet", "styles", "cat",
    compile(`return (${pill.getText(tree)});`));
  for (const color of ["#F075B3", "#8B95EE", "#F2C94C", "#B875F0", "#5FCA81", "#5FA1CA", "#123456"]) {
    const result = render(React, "view", "text", { absoluteFillObject: { position: "absolute" } },
      wallStyles, { color, bg: "unused-old-tint", label: "Categoría" });
    const [background, label] = React.Children.toArray(result.props.children) as any[];
    assert.equal(flatten(background.props.style).backgroundColor, color);
    assert.equal(flatten(background.props.style).opacity, 0.2);
    assert.equal(background.props.pointerEvents, "none");
    assert.equal(flatten(label.props.style).color, "#F9F9F9");
    assert.equal(flatten(label.props.style).fontWeight, wallStyles.filterText.fontWeight);
    assert.equal(flatten(label.props.style).opacity, undefined);
    assert.equal(flatten(result.props.style).opacity, undefined);
    assert.equal(label.props.children, "Categoría");
  }
});

test("the pencil action opens the existing editor with the original reflection ID and message", () => {
  const tree = ast(source("../app/mi-espacio-interior.tsx"));
  const button = find(tree, node => ts.isJsxElement(node)
    && node.openingElement.tagName.getText(tree) === "Pressable"
    && node.openingElement.attributes.getText(tree).includes("menu-${reflection.id}"));
  const editor = find(tree, node => ts.isVariableDeclaration(node) && node.name.getText(tree) === "beginEditing");
  let id, message;
  const beginEditing = new Function("setEditingId", "setEditMessage",
    compile(`return (${editor.initializer.getText(tree)});`))(
      (value: number) => { id = value; }, (value: string) => { message = value; });
  const reflection = { id: 7, message: "Mi reflexión original" };
  const render = new Function("React", "Pressable", "Feather", "styles", "colors", "reflection", "beginEditing",
    compile(`return (${button.getText(tree)});`));
  const result = render(React, "button", "icon", styles(tree, ["menuButton"]),
    { mutedForeground: "#CCCCCC" }, reflection, beginEditing);
  assert.equal(result.props.accessibilityLabel, "Editar reflexión");
  assert.equal(result.props.accessibilityRole, "button");
  assert.equal(result.props.children.props.name, "edit-2");
  assert.equal(result.props.children.props.size, 17);
  assert.equal(result.props.children.props.color, "#D6D6D6");
  result.props.onPress();
  assert.equal(id, reflection.id);
  assert.equal(message, reflection.message);
});

test("edit and Instagram actions are vertical inside the card with existing sharing guards", () => {
  const tree = ast(source("../app/mi-espacio-interior.tsx"));
  const row = find(tree, node => ts.isJsxElement(node)
    && node.openingElement.attributes.getText(tree).includes("styles.cardActionsRow"));
  const card = find(tree, node => ts.isJsxElement(node)
    && node.openingElement.attributes.getText(tree) === "style={styles.reflectionCard}");
  assert.match(card.getText(tree), /testID=\{`menu-/);
  assert.match(card.getText(tree), /testID=\{`share-/);
  const meta = find(tree, node => ts.isJsxElement(node)
    && node.openingElement.attributes.getText(tree).includes("styles.reflectionMetaRow"));
  assert.doesNotMatch(meta.getText(tree), /testID=\{`(?:menu|share)-/);
  const render = new Function("React", "View", "Text", "Pressable", "Feather", "StyleSheet", "styles",
    "cat", "isEditing", "isPremium", "isShareable", "reflection", "beginEditing", "setShareReflection",
    compile(`return (${row.getText(tree)});`));
  const wallStyles = styles(tree, ["reflectionMetaRow", "cardActionsRow", "cardCatPill", "cardCatText", "menuButton"]);
  assert.equal(wallStyles.reflectionMetaRow.justifyContent, "space-between");
  assert.equal(wallStyles.cardActionsRow.flexDirection, "column");
  assert.equal(wallStyles.cardActionsRow.marginRight, -4);
  const reflection = { id: 7, message: "Mi reflexión" };
  let shared;
  const run = (editing: boolean, premium: boolean, shareable: boolean) => render(React, "view", "text", "button",
    "icon", { absoluteFill: {} }, wallStyles, { color: "#F075B3", label: "Gratitud" },
    editing, premium, shareable, reflection, () => {}, (value: unknown) => { shared = value; });
  const [pencil, instagram] = React.Children.toArray(run(false, true, true).props.children) as any[];
  assert.equal(pencil.props.children.props.size, 17);
  assert.equal(pencil.props.children.props.color, "#D6D6D6");
  assert.equal(instagram.props.children.props.name, "instagram");
  assert.equal(instagram.props.children.props.size, 16);
  assert.equal(instagram.props.children.props.color, "#D6D6D6");
  instagram.props.onPress();
  assert.equal(shared, reflection);
  assert.equal(React.Children.toArray(run(false, false, true).props.children).length, 1);
  const disabledActions = run(false, true, false);
  assert.equal((React.Children.toArray(disabledActions.props.children) as any[])[1].props.disabled, true);
});

test("composer retains both 20px writing gaps and adds 8px below the buttons across themes", () => {
  const tree = ast(source("../components/InnerSpaceCard.tsx"));
  const cardStyles = styles(tree, ["container", "canonicalVerticalInsets", "cloudyFlushBorder",
    "profileWall", "expandBody", "categoriesMask", "inputContainer", "actionRow"]);
  const declarations = ["flatBorder", "containerBottomInset", "bottomGapExtra"].map(name =>
    `const ${name} = ${find(tree, node => ts.isVariableDeclaration(node) && node.name.getText(tree) === name)
      .initializer.getText(tree)};`).join("\n");
  const root = find(tree, node => ts.isJsxElement(node)
    && node.openingElement.tagName.getText(tree) === "View"
    && node.openingElement.attributes.getText(tree).includes("styles.container"));
  const rootStyle = root.openingElement.attributes.properties.find((item: any) => item.name?.getText(tree) === "style");
  const measure = new Function("styles", "theme", "getThemeStyleId", "canonicalVerticalInsets", "profileVariant",
    "COMPOSER_BOTTOM_GAP", "sectionBackgroundColor", compile(`${declarations}
      return { bottomGapExtra, rootStyle: ${rootStyle.initializer.expression.getText(tree)} };`));
  const row = find(tree, node => ts.isJsxElement(node) && node.openingElement.tagName.getText(tree) === "View"
    && node.openingElement.attributes.getText(tree).includes("styles.actionRow"));
  const onLayout = row.openingElement.attributes.properties.find((item: any) => item.name?.getText(tree) === "onLayout");
  assert.equal(cardStyles.categoriesMask.marginBottom, 20);
  assert.equal(cardStyles.inputContainer.marginBottom + cardStyles.actionRow.marginTop, 20);
  assert.equal(Number(find(tree, node => ts.isVariableDeclaration(node)
    && node.name.getText(tree) === "COMPOSER_BOTTOM_GAP").initializer.getText(tree)), 28);
  for (const id of ["cloudy", "natural", "indigo2", "pleyades", "dark"]) {
    for (const [canonical, profile] of [[false, false], [true, false], [true, true]]) {
      const result = measure(cardStyles, { id }, (theme: string) => theme === "natural" ? "cloudy" : theme,
        canonical, profile, 28, undefined);
      let height = 0;
      const handler = new Function("styles", "updateContentHeight", "bottomGapExtra",
        compile(`return (${onLayout.initializer.expression.getText(tree)});`))(cardStyles,
          (measured: number) => { height = measured; }, result.bottomGapExtra);
      handler({ nativeEvent: { layout: { y: 200, height: 42 } } });
      const parent = flatten(result.rootStyle);
      assert.equal(height - 242 + parent.paddingBottom + parent.borderWidth, 28,
        `${id}: canonical=${canonical}, profile=${profile}`);
      assert.equal(parent.paddingBottom, canonical ? profile || id !== "cloudy" && id !== "natural" ? 18 : 19 : 16,
        "collapsed card retains its existing padding");
    }
  }
});
