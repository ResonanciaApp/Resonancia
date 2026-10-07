import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("profile.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
test("avatar hero uses the same image transition as playlist covers without remounting on selection", () => {
  const heroes: ts.JsxSelfClosingElement[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "Image"
      && node.attributes.getText(ast).includes("styles.accountCoverPreview")) heroes.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(heroes.length, 2); // Editorial avatar and uploaded photo.
  for (const hero of heroes) {
    assert.match(hero.attributes.getText(ast), /transition=\{IMAGE_TRANSITION\}/);
    assert.equal(hero.attributes.properties.some((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(ast) === "key"), false);
  }
  assert.match(source, /import \{ IMAGE_TRANSITION \} from "@\/constants\/imagePlaceholder"/);
  const playlist = readFileSync(new URL("../app/playlist/[id].tsx", import.meta.url), "utf8");
  assert.match(playlist, /style=\{modalStyles.selectedPreview\}[\s\S]*?transition=\{IMAGE_TRANSITION\}/);
});

function findStyle(name: string) {
  let expression: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === name) expression = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression);
  const js = ts.transpileModule(`return (${expression.getText(ast)});`, {}).outputText;
  return new Function(js)();
}

test("a large avatar catalog cannot enlarge the sheet beyond the screen", () => {
  const sheet = findStyle("accountCoverSheet");
  assert.equal(sheet.height, "85%");
  assert.equal(sheet.bottom, 0);
  const hero = findStyle("accountCoverPreviewSlot");
  assert.equal(hero.height, 170);
  assert.equal(hero.flexShrink, 0);
  assert.equal(hero.flex, undefined);
  assert.equal(findStyle("accountCoverPresetGrid").flex, 1);
  const handle = findStyle("accountCoverHandle");
  const headerHeight = handle.marginTop + handle.height + handle.marginBottom + findStyle("accountCoverHeader").minHeight;
  for (const viewportHeight of [568, 640, 874, 1024]) {
    const sheetHeight = viewportHeight * 0.85;
    const listHeight = sheetHeight - headerHeight - hero.height - 42 - 54;
    assert.ok(listHeight > 63, `a usable scroll area remains at ${viewportHeight}px`);
    for (const avatars of [26, 86, 200]) {
      const contentHeight = Math.ceil(avatars / 5) * 75 + 46;
      assert.ok(contentHeight > listHeight || viewportHeight >= 874);
      assert.ok(sheetHeight < viewportHeight);
    }
  }
});

test("opening and reopening the actual picker resets its own avatar list to the first row", () => {
  let picker: ts.JsxOpeningElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(ast) === "Modal"
      && node.attributes.getText(ast).includes("accountPhotoPickerVisible")) picker = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(picker);
  const attribute = picker.attributes.properties.find((node) => ts.isJsxAttribute(node) && node.name.getText(ast) === "onShow");
  assert.ok(attribute && ts.isJsxAttribute(attribute));
  assert.ok(attribute.initializer && ts.isJsxExpression(attribute.initializer));
  const js = ts.transpileModule(`return (${attribute.initializer.expression!.getText(ast)});`, {}).outputText;
  const calls: unknown[] = [];
  const ref: { current: null | { scrollToOffset: (args: unknown) => void } } = {
    current: { scrollToOffset: (args) => calls.push(args) },
  };
  const onShow = new Function("accountAvatarGridRef", js)(ref);
  onShow();
  onShow();
  assert.deepEqual(calls, [{ offset: 0, animated: false }, { offset: 0, animated: false }]);
  ref.current = null;
  assert.doesNotThrow(onShow);
  assert.match(source, /<FlatList\s+ref=\{accountAvatarGridRef\}/);
});
